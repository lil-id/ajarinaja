-- Migration: Switch to Manual Attendance Sync (Per Course)
-- 1. Drop problematic automatic triggers
-- 2. Add attendance columns to report_card_entries (per course detail)
-- 3. Create RPC function for manual sync

-- 1. Drop Trigger & Function (Fixes the current blocking error)
DROP TRIGGER IF EXISTS trigger_update_attendance_grade ON public.attendance_records;
DROP FUNCTION IF EXISTS public.update_report_card_attendance();

-- 2. Add Attendance Columns to report_card_entries
-- This enables storing attendance data per course
ALTER TABLE public.report_card_entries
ADD COLUMN IF NOT EXISTS attendance_grade DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS attendance_percentage DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS attendance_sessions_total INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS attendance_sessions_present INTEGER DEFAULT 0;

-- 3. Create Function to Sync Attendance for a Course
CREATE OR REPLACE FUNCTION public.sync_course_attendance_grades(
  p_course_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_period_id UUID;
  v_updated_count INTEGER := 0;
  v_student_record RECORD;
BEGIN
  -- Get Academic Period for this course
  SELECT academic_period_id INTO v_period_id
  FROM public.courses
  WHERE id = p_course_id;

  IF v_period_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Course or Academic Period not found');
  END IF;

  -- Iterate through all students enrolled in this course
  FOR v_student_record IN 
    SELECT student_id 
    FROM public.enrollments 
    WHERE course_id = p_course_id AND status = 'active'
  LOOP
    DECLARE
        v_attendance_grade DECIMAL;
        v_total_sessions INTEGER;
        v_present_count INTEGER;
        v_report_card_id UUID;
    BEGIN
        -- Calculate Grade using existing helper function
        v_attendance_grade := calculate_attendance_grade(v_student_record.student_id, p_course_id);
        
        -- Get Stats
        SELECT 
            COUNT(*),
            COUNT(*) FILTER (WHERE ar.status = 'present')
        INTO 
            v_total_sessions,
            v_present_count
        FROM attendance_records ar
        JOIN attendance_sessions s ON s.id = ar.session_id
        WHERE ar.student_id = v_student_record.student_id
            AND s.course_id = p_course_id
            AND s.status IN ('closed', 'finalized');

        -- Find or Create Report Card (Header)
        -- We try to find existing one first
        SELECT id INTO v_report_card_id
        FROM report_cards
        WHERE student_id = v_student_record.student_id 
          AND period_id = v_period_id;
          
        -- IF report card doesn't exist, we skip updating for now 
        -- (usually report cards are created by homeroom teacher or system init)
        -- OR we could create it? Let's safeguard by only updating if exists.
        
        IF v_report_card_id IS NOT NULL THEN
            -- Update or Insert Entry
            INSERT INTO public.report_card_entries (
                report_card_id,
                course_id,
                attendance_grade,
                attendance_percentage,
                attendance_sessions_total,
                attendance_sessions_present,
                final_grade, -- Required column, set temporary 0 if new
                updated_at
            )
            VALUES (
                v_report_card_id,
                p_course_id,
                v_attendance_grade,
                CASE WHEN v_total_sessions > 0 THEN (v_present_count::decimal / v_total_sessions::decimal) * 100 ELSE 0 END,
                v_total_sessions,
                v_present_count,
                0, -- Default final grade
                NOW()
            )
            ON CONFLICT (report_card_id, course_id)
            DO UPDATE SET
                attendance_grade = EXCLUDED.attendance_grade,
                attendance_percentage = EXCLUDED.attendance_percentage,
                attendance_sessions_total = EXCLUDED.attendance_sessions_total,
                attendance_sessions_present = EXCLUDED.attendance_sessions_present,
                updated_at = NOW();
                
            v_updated_count := v_updated_count + 1;
        END IF;
    END;
  END LOOP;

  RETURN json_build_object(
    'success', true, 
    'updated_count', v_updated_count,
    'message', 'Successfully synced attendance for ' || v_updated_count || ' students'
  );
END;
$$;

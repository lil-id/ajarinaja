-- Migration: Add Attendance Columns to Report Card Header and Update Sync Logic

-- 1. Add columns to report_cards table
ALTER TABLE public.report_cards 
ADD COLUMN IF NOT EXISTS attendance_percentage NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS attendance_grade NUMERIC(5,2);

-- 2. Update sync function to aggregate attendance
CREATE OR REPLACE FUNCTION public.sync_student_attendance_grades(
  p_student_id UUID,
  p_period_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_course_record RECORD;
  v_updated_count INTEGER := 0;
  v_report_card_id UUID;
  v_avg_attendance_pct NUMERIC;
  v_avg_attendance_grade NUMERIC;
BEGIN
  -- Get Report Card ID
  SELECT id INTO v_report_card_id
  FROM report_cards
  WHERE student_id = p_student_id AND period_id = p_period_id;

  IF v_report_card_id IS NULL THEN
     RETURN json_build_object('success', false, 'message', 'Report card not found');
  END IF;

  -- Iterate through all ACTIVE enrollments for this student 
  -- where the course belongs to the academic period
  FOR v_course_record IN 
    SELECT e.course_id
    FROM public.enrollments e
    JOIN public.courses c ON c.id = e.course_id
    WHERE e.student_id = p_student_id 
      AND e.status = 'active'
      AND c.academic_period_id = p_period_id
  LOOP
    DECLARE
        v_attendance_grade DECIMAL;
        v_total_sessions INTEGER;
        v_present_count INTEGER;
    BEGIN
        -- Calculate Grade using existing helper function (or inline logic)
        v_attendance_grade := calculate_attendance_grade(p_student_id, v_course_record.course_id);
        
        -- Get Stats
        SELECT 
            COUNT(*),
            COUNT(*) FILTER (WHERE ar.status = 'present')
        INTO 
            v_total_sessions,
            v_present_count
        FROM attendance_records ar
        JOIN attendance_sessions s ON s.id = ar.session_id
        WHERE ar.student_id = p_student_id
            AND s.course_id = v_course_record.course_id
            AND s.status IN ('closed', 'finalized');

        -- Update or Insert Entry
        INSERT INTO public.report_card_entries (
            report_card_id,
            course_id,
            attendance_grade,
            attendance_percentage,
            attendance_sessions_total,
            attendance_sessions_present,
            final_grade,
            updated_at
        )
        VALUES (
            v_report_card_id,
            v_course_record.course_id,
            v_attendance_grade,
            CASE WHEN v_total_sessions > 0 THEN (v_present_count::decimal / v_total_sessions::decimal) * 100 ELSE 0 END,
            v_total_sessions,
            v_present_count,
            0, -- Default if new
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
    END;
  END LOOP;

  -- NEW: Calculate Aggregates from Entries (Average of all courses)
  SELECT 
    AVG(attendance_percentage),
    AVG(attendance_grade)
  INTO
    v_avg_attendance_pct,
    v_avg_attendance_grade
  FROM report_card_entries
  WHERE report_card_id = v_report_card_id
    AND attendance_percentage IS NOT NULL; -- Only count courses with attendance data

  -- Update Report Card Header with aggregated values
  UPDATE report_cards
  SET 
    attendance_percentage = v_avg_attendance_pct,
    attendance_grade = v_avg_attendance_grade,
    updated_at = NOW()
  WHERE id = v_report_card_id;

  RETURN json_build_object(
    'success', true, 
    'updated_count', v_updated_count,
    'average_percentage', v_avg_attendance_pct,
    'message', 'Synced attendance for ' || v_updated_count || ' courses.'
  );
END;
$$;

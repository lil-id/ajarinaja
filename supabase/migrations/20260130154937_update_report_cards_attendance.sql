-- Migration: Update Report Cards with Attendance Support
-- Generated: 20260130154937

-- 1. Add attendance columns to report_cards table
ALTER TABLE public.report_cards
ADD COLUMN IF NOT EXISTS attendance_grade DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS attendance_percentage DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS attendance_sessions_total INTEGER,
ADD COLUMN IF NOT EXISTS attendance_sessions_present INTEGER;

-- 2. Create function to calculate attendance grade based on settings
CREATE OR REPLACE FUNCTION calculate_attendance_grade(
  p_student_id UUID,
  p_course_id UUID
)
RETURNS DECIMAL
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_settings RECORD;
  v_total_sessions INTEGER;
  v_score DECIMAL := 0;
  v_present_count INTEGER;
  v_late_count INTEGER;
  v_excused_count INTEGER;
  v_absent_count INTEGER;
  v_weights JSONB;
BEGIN
  -- Get Course Settings
  SELECT * INTO v_settings 
  FROM course_attendance_settings 
  WHERE course_id = p_course_id;

  -- Default settings if not found
  IF NOT FOUND THEN
    v_weights := '{"present": 100, "late": 80, "excused": 60, "absent": 0}'::jsonb;
  ELSE
    v_weights := v_settings.scoring;
  END IF;

  -- Count records per student in this course
  -- Ensure we only count finalized/closed sessions or all past sessions
  SELECT 
    COUNT(*) FILTER (WHERE status = 'present'),
    COUNT(*) FILTER (WHERE status = 'late'),
    COUNT(*) FILTER (WHERE status = 'excused'), -- Includes merged 'sick'
    COUNT(*) FILTER (WHERE status = 'absent'),
    COUNT(*)
  INTO 
    v_present_count,
    v_late_count,
    v_excused_count,
    v_absent_count,
    v_total_sessions
  FROM attendance_records ar
  JOIN attendance_sessions s ON s.id = ar.session_id
  WHERE ar.student_id = p_student_id
    AND s.course_id = p_course_id
    AND s.status IN ('closed', 'finalized'); -- Only count closed sessions

  IF v_total_sessions = 0 THEN
    RETURN 100; -- Default perfect score if no sessions yet? Or 0? Usually 100 interaction.
  END IF;

  -- Calculate Weighted Score (Sum of (Count * Weight) / Total Sessions)
  v_score := (
    (v_present_count * COALESCE((v_weights->>'present')::decimal, 100)) +
    (v_late_count * COALESCE((v_weights->>'late')::decimal, 80)) +
    (v_excused_count * COALESCE((v_weights->>'excused')::decimal, 60)) +
    (v_absent_count * COALESCE((v_weights->>'absent')::decimal, 0))
  ) / v_total_sessions;

  RETURN ROUND(v_score, 2);
END;
$$;

-- 3. Trigger Function to Update Report Card when Attendance Changes
CREATE OR REPLACE FUNCTION update_report_card_attendance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_student_id UUID;
  v_course_id UUID;
  v_period_id UUID;
  v_attendance_grade DECIMAL;
  v_total_sessions INTEGER;
  v_present_count INTEGER;
BEGIN
  -- Determine Student and Course from the record
  IF (TG_OP = 'DELETE') THEN
    -- Need to fetch from session
    SELECT course_id INTO v_course_id FROM attendance_sessions WHERE id = OLD.session_id;
    v_student_id := OLD.student_id;
  ELSE
    SELECT course_id INTO v_course_id FROM attendance_sessions WHERE id = NEW.session_id;
    v_student_id := NEW.student_id;
  END IF;

  -- Calculate new grade
  v_attendance_grade := calculate_attendance_grade(v_student_id, v_course_id);
  
  -- Calculate Metadata (Total, Present)
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'present')
  INTO 
    v_total_sessions,
    v_present_count
  FROM attendance_records ar
  JOIN attendance_sessions s ON s.id = ar.session_id
  WHERE ar.student_id = v_student_id
    AND s.course_id = v_course_id
    AND s.status IN ('closed', 'finalized');

  -- Update Report Card
  -- Logic: Update ALL report cards for this student & course (might be multiple periods? usually 1 active).
  -- Ideally we match academic period. For MVP, update all report cards for this course/student.
  UPDATE report_cards
  SET 
    attendance_grade = v_attendance_grade,
    attendance_percentage = CASE WHEN v_total_sessions > 0 THEN (v_present_count::decimal / v_total_sessions::decimal) * 100 ELSE 0 END,
    attendance_sessions_total = v_total_sessions,
    attendance_sessions_present = v_present_count,
    updated_at = NOW()
  WHERE student_id = v_student_id AND course_id = v_course_id;
  
  RETURN NULL;
END;
$$;

-- 4. Attach Trigger to attendance_records
DROP TRIGGER IF EXISTS trigger_update_attendance_grade ON attendance_records;
CREATE TRIGGER trigger_update_attendance_grade
AFTER INSERT OR UPDATE OR DELETE ON attendance_records
FOR EACH ROW
EXECUTE FUNCTION update_report_card_attendance();

-- Notify PostgREST
NOTIFY pgrst, 'reload config';

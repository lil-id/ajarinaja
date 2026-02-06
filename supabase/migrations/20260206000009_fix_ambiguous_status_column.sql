-- Fix "column reference status is ambiguous" error in attendance functions
-- This happens because both attendance_records and attendance_sessions have a 'status' column
-- We need to qualify the columns with table aliases (ar.status vs s.status)

-- 1. Fix calculate_attendance_grade function
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
  -- FIXED: Qualified 'status' with 'ar.'
  SELECT 
    COUNT(*) FILTER (WHERE ar.status = 'present'),
    COUNT(*) FILTER (WHERE ar.status = 'late'),
    COUNT(*) FILTER (WHERE ar.status = 'excused'),
    COUNT(*) FILTER (WHERE ar.status = 'absent'),
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
    AND s.status IN ('closed', 'finalized'); -- s.status is clearly qualified here

  IF v_total_sessions = 0 THEN
    RETURN 100;
  END IF;

  -- Calculate Weighted Score
  v_score := (
    (v_present_count * COALESCE((v_weights->>'present')::decimal, 100)) +
    (v_late_count * COALESCE((v_weights->>'late')::decimal, 80)) +
    (v_excused_count * COALESCE((v_weights->>'excused')::decimal, 60)) +
    (v_absent_count * COALESCE((v_weights->>'absent')::decimal, 0))
  ) / v_total_sessions;

  RETURN ROUND(v_score, 2);
END;
$$;

-- 2. Fix update_report_card_attendance trigger function
CREATE OR REPLACE FUNCTION update_report_card_attendance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_student_id UUID;
  v_course_id UUID;
  v_attendance_grade DECIMAL;
  v_total_sessions INTEGER;
  v_present_count INTEGER;
BEGIN
  -- Determine Student and Course from the record
  IF (TG_OP = 'DELETE') THEN
    SELECT course_id INTO v_course_id FROM attendance_sessions WHERE id = OLD.session_id;
    v_student_id := OLD.student_id;
  ELSE
    SELECT course_id INTO v_course_id FROM attendance_sessions WHERE id = NEW.session_id;
    v_student_id := NEW.student_id;
  END IF;

  -- Calculate new grade
  v_attendance_grade := calculate_attendance_grade(v_student_id, v_course_id);
  
  -- Calculate Metadata (Total, Present)
  -- FIXED: Qualified 'status' with 'ar.'
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE ar.status = 'present')
  INTO 
    v_total_sessions,
    v_present_count
  FROM attendance_records ar
  JOIN attendance_sessions s ON s.id = ar.session_id
  WHERE ar.student_id = v_student_id
    AND s.course_id = v_course_id
    AND s.status IN ('closed', 'finalized');

  -- Update Report Card
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

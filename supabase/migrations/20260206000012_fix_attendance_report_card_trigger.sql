-- Fix "column course_id does not exist" error in update_report_card_attendance
-- The previous function incorrectly tried to query report_cards with course_id
-- report_cards is per-student-per-period, NOT per-course.
-- We must update report_card_entries instead.

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
  v_report_card_id UUID;
BEGIN
  -- Determine Student and Course from the record
  IF (TG_OP = 'DELETE') THEN
    SELECT course_id INTO v_course_id FROM attendance_sessions WHERE id = OLD.session_id;
    v_student_id := OLD.student_id;
  ELSE
    SELECT course_id INTO v_course_id FROM attendance_sessions WHERE id = NEW.session_id;
    v_student_id := NEW.student_id;
  END IF;

  -- Get Academic Period from Course
  SELECT academic_period_id INTO v_period_id
  FROM courses
  WHERE id = v_course_id;

  -- Calculate new grade
  v_attendance_grade := calculate_attendance_grade(v_student_id, v_course_id);
  
  -- Calculate Metadata (Total, Present)
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

  -- 1. Find the Report Card for this student and period
  SELECT id INTO v_report_card_id
  FROM report_cards
  WHERE student_id = v_student_id 
    AND (
        period_id = v_period_id 
        OR period_id IS NULL -- Fallback if not strictly enforced
    )
  LIMIT 1;

  -- 2. If Report Card exists, try to update the ENTRY for this course
  IF v_report_card_id IS NOT NULL THEN
    -- Check if entry exists, if not create it (optional, usually created by other flows)
    -- For now, we only update existing entries to avoid orphaned records
    
    UPDATE report_card_entries
    SET 
      attendance_grade = v_attendance_grade,
      attendance_percentage = CASE WHEN v_total_sessions > 0 THEN (v_present_count::decimal / v_total_sessions::decimal) * 100 ELSE 0 END,
      attendance_sessions_total = v_total_sessions,
      attendance_sessions_present = v_present_count,
      updated_at = NOW()
    WHERE report_card_id = v_report_card_id 
      AND course_id = v_course_id;
      
    -- Also update the main report card attendance stats (aggregate)
    -- This is optional but good for summary
    -- We can just update the updated_at timestamp to signal change
    UPDATE report_cards SET updated_at = NOW() WHERE id = v_report_card_id;
  END IF;
  
  RETURN NULL;
END;
$$;

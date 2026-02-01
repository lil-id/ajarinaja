-- Migration: Backfill Attendance Grades for Existing Report Cards
-- Generated: 20260130155800

-- Re-calculate attendance metrics for ALL existing report cards
DO $$
DECLARE
  r RECORD;
  v_attendance_grade DECIMAL;
  v_total_sessions INTEGER;
  v_present_count INTEGER;
  v_course_id UUID;
  v_student_id UUID;
BEGIN
  -- Loop through all report cards
  FOR r IN SELECT * FROM report_cards LOOP
    v_student_id := r.student_id;
    v_course_id := r.course_id;
    
    -- Calculate Grade
    v_attendance_grade := calculate_attendance_grade(v_student_id, v_course_id);
    
    -- Calculate Counts
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
    UPDATE report_cards
    SET 
      attendance_grade = v_attendance_grade,
      attendance_percentage = CASE WHEN v_total_sessions > 0 THEN (v_present_count::decimal / v_total_sessions::decimal) * 100 ELSE 0 END,
      attendance_sessions_total = v_total_sessions,
      attendance_sessions_present = v_present_count,
      updated_at = NOW()
    WHERE id = r.id;
    
    RAISE NOTICE 'Updated Report Card %: Grade=%, Pct=%', r.id, v_attendance_grade, (CASE WHEN v_total_sessions > 0 THEN (v_present_count::decimal / v_total_sessions::decimal) * 100 ELSE 0 END);
  END LOOP;
END;
$$;

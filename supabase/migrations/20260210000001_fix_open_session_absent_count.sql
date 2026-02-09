-- Fix Absent Count in Open Session
-- Replaces open_attendance_session to initialize absent_count correctly

CREATE OR REPLACE FUNCTION open_attendance_session(
  p_session_id UUID,
  p_duration_minutes INTEGER DEFAULT 15
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_course_id UUID;
  v_grace_period INTEGER;
  v_late_window INTEGER;
  v_open_time TIMESTAMPTZ;
  v_close_time TIMESTAMPTZ;
  v_grace_end_time TIMESTAMPTZ;
  v_enrolled_count INTEGER;
BEGIN
  -- Get course settings
  SELECT s.course_id, COALESCE(cs.grace_period_minutes, 5), COALESCE(cs.late_window_minutes, 10)
  INTO v_course_id, v_grace_period, v_late_window
  FROM attendance_sessions s
  LEFT JOIN course_attendance_settings cs ON cs.course_id = s.course_id
  WHERE s.id = p_session_id
    AND s.teacher_id = auth.uid();
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session not found or unauthorized';
  END IF;
  
  -- Calculate times
  v_open_time := NOW();
  v_grace_end_time := v_open_time + (v_grace_period || ' minutes')::INTERVAL;
  v_close_time := v_open_time + (p_duration_minutes || ' minutes')::INTERVAL;
  
  -- Count enrolled students
  SELECT COUNT(*) INTO v_enrolled_count
  FROM enrollments
  WHERE course_id = v_course_id AND status = 'active';
  
  -- Update session
  UPDATE attendance_sessions
  SET 
    status = 'open',
    open_time = v_open_time,
    grace_end_time = v_grace_end_time,
    close_time = v_close_time,
    total_students = v_enrolled_count,
    absent_count = v_enrolled_count, -- Initialize absent count to total students
    updated_at = NOW()
  WHERE id = p_session_id;
  
  -- Create attendance records for all enrolled students (default: absent)
  INSERT INTO attendance_records (session_id, student_id, status)
  SELECT p_session_id, student_id, 'absent'
  FROM enrollments
  WHERE course_id = v_course_id AND status = 'active'
  ON CONFLICT (session_id, student_id) DO NOTHING;
  
  RETURN json_build_object(
    'success', true,
    'open_time', v_open_time,
    'close_time', v_close_time,
    'grace_end_time', v_grace_end_time,
    'total_students', v_enrolled_count
  );
END;
$$;

-- Backend RPC functions for attendance system
-- Migration: Add attendance RPC functions

-- Function 1: Open attendance session
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

-- Function 2: Student check-in with PIN
CREATE OR REPLACE FUNCTION student_check_in(
  p_session_id UUID,
  p_pin TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session RECORD;
  v_pin_hash TEXT;
  v_current_time TIMESTAMPTZ;
  v_status TEXT;
  v_record_id UUID;
  v_current_attempts INTEGER;
BEGIN
  v_current_time := NOW();
  
  -- Get session details
  SELECT * INTO v_session
  FROM attendance_sessions
  WHERE id = p_session_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session not found';
  END IF;
  
  -- Verify session is open
  IF v_session.status != 'open' THEN
    RAISE EXCEPTION 'Session is not open for check-in';
  END IF;
  
  -- Verify not expired
  IF v_current_time > v_session.close_time THEN
    RAISE EXCEPTION 'Session has expired';
  END IF;
  
  -- Get current attempts
  SELECT pin_attempts INTO v_current_attempts
  FROM attendance_records
  WHERE session_id = p_session_id AND student_id = auth.uid();
  
  -- Check attempts limit BEFORE incrementing
  IF v_current_attempts >= 3 THEN
    RAISE EXCEPTION 'Maximum PIN attempts exceeded. Please contact your teacher.';
  END IF;
  
  -- Increment attempts
  UPDATE attendance_records
  SET pin_attempts = pin_attempts + 1
  WHERE session_id = p_session_id AND student_id = auth.uid();
  
  -- Hash provided PIN
  v_pin_hash := encode(digest(p_pin, 'sha256'), 'hex');
  
  -- Verify PIN
  IF v_pin_hash != v_session.pin_hash THEN
    RAISE EXCEPTION 'Invalid PIN. You have % attempts remaining.', 3 - (v_current_attempts + 1);
  END IF;
  
  -- Determine status based on time
  IF v_current_time <= v_session.grace_end_time THEN
    v_status := 'present';
  ELSE
    v_status := 'late';
  END IF;
  
  -- Update attendance record
  UPDATE attendance_records
  SET 
    status = v_status,
    check_in_time = v_current_time,
    check_in_method = 'pin',
    updated_at = NOW()
  WHERE session_id = p_session_id AND student_id = auth.uid()
  RETURNING id INTO v_record_id;
  
  -- Update session counts
  UPDATE attendance_sessions
  SET 
    present_count = (SELECT COUNT(*) FROM attendance_records WHERE session_id = p_session_id AND status = 'present'),
    late_count = (SELECT COUNT(*) FROM attendance_records WHERE session_id = p_session_id AND status = 'late'),
    absent_count = (SELECT COUNT(*) FROM attendance_records WHERE session_id = p_session_id AND status = 'absent'),
    updated_at = NOW()
  WHERE id = p_session_id;
  
  RETURN json_build_object(
    'success', true,
    'status', v_status,
    'check_in_time', v_current_time
  );
END;
$$;

-- Function 3: Auto-close expired sessions
CREATE OR REPLACE FUNCTION auto_close_expired_sessions()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Close all sessions that have passed close_time
  UPDATE attendance_sessions
  SET status = 'closed', updated_at = NOW()
  WHERE status = 'open' 
    AND close_time < NOW();
END;
$$;

-- Function 4: Approve excuse request (with retroactive update)
CREATE OR REPLACE FUNCTION approve_excuse_request(
  p_excuse_id UUID,
  p_review_notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_excuse RECORD;
  v_affected_count INTEGER;
BEGIN
  -- Get excuse details
  SELECT * INTO v_excuse
  FROM attendance_excuses
  WHERE id = p_excuse_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Excuse request not found';
  END IF;
  
  -- Verify teacher owns the course
  IF NOT EXISTS (
    SELECT 1 FROM courses 
    WHERE id = v_excuse.course_id AND teacher_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  -- Update excuse status
  UPDATE attendance_excuses
  SET 
    status = 'approved',
    reviewed_by = auth.uid(),
    reviewed_at = NOW(),
    review_notes = p_review_notes
  WHERE id = p_excuse_id;
  
  -- Retroactively update attendance records
  UPDATE attendance_records ar
  SET 
    status = v_excuse.excuse_type, -- 'sick' or 'excused'
    check_in_method = 'excuse_approved',
    original_status = ar.status,
    marked_by = auth.uid(),
    notes = v_excuse.reason,
    updated_at = NOW()
  FROM attendance_sessions s
  WHERE ar.session_id = s.id
    AND ar.student_id = v_excuse.student_id
    AND s.course_id = v_excuse.course_id
    AND s.session_date BETWEEN v_excuse.start_date AND v_excuse.end_date
    AND ar.status = 'absent'; -- Only update if currently marked absent
  
  GET DIAGNOSTICS v_affected_count = ROW_COUNT;
  
  -- Update session counts for affected sessions
  UPDATE attendance_sessions s
  SET 
    absent_count = (SELECT COUNT(*) FROM attendance_records WHERE session_id = s.id AND status = 'absent'),
    excused_count = (SELECT COUNT(*) FROM attendance_records WHERE session_id = s.id AND status = 'excused'),
    sick_count = (SELECT COUNT(*) FROM attendance_records WHERE session_id = s.id AND status = 'sick'),
    updated_at = NOW()
  WHERE s.course_id = v_excuse.course_id
    AND s.session_date BETWEEN v_excuse.start_date AND v_excuse.end_date;
  
  RETURN json_build_object(
    'success', true,
    'sessions_updated', v_affected_count
  );
END;
$$;

-- Function 5: Reject excuse request
CREATE OR REPLACE FUNCTION reject_excuse_request(
  p_excuse_id UUID,
  p_review_notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_excuse RECORD;
BEGIN
  -- Get excuse details
  SELECT * INTO v_excuse
  FROM attendance_excuses
  WHERE id = p_excuse_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Excuse request not found';
  END IF;
  
  -- Verify teacher owns the course
  IF NOT EXISTS (
    SELECT 1 FROM courses 
    WHERE id = v_excuse.course_id AND teacher_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  -- Update excuse status
  UPDATE attendance_excuses
  SET 
    status = 'rejected',
    reviewed_by = auth.uid(),
    reviewed_at = NOW(),
    review_notes = p_review_notes
  WHERE id = p_excuse_id;
  
  RETURN json_build_object(
    'success', true
  );
END;
$$;

-- Function 6: Calculate attendance grade
CREATE OR REPLACE FUNCTION calculate_attendance_grade(
  p_student_id UUID,
  p_course_id UUID
)
RETURNS DECIMAL(5,2)
LANGUAGE plpgsql
AS $$
DECLARE
  v_settings RECORD;
  v_total_sessions INTEGER;
  v_attendance_grade DECIMAL;
BEGIN
  -- Get course settings
  SELECT * INTO v_settings
  FROM course_attendance_settings
  WHERE course_id = p_course_id;
  
  IF NOT FOUND THEN
    RETURN NULL; -- No attendance tracking for this course
  END IF;
  
  -- Count total sessions that are closed or finalized
  SELECT COUNT(*) INTO v_total_sessions
  FROM attendance_sessions
  WHERE course_id = p_course_id
    AND status IN ('closed', 'finalized');
  
  IF v_total_sessions = 0 THEN
    RETURN NULL; -- No closed sessions yet
  END IF;
  
  -- Calculate based on method
  IF v_settings.calculation_method = 'simple' THEN
    -- Simple percentage: (present + late) / total * 100
    SELECT 
      ROUND(
        (COUNT(*) FILTER (WHERE status IN ('present', 'late'))::DECIMAL / v_total_sessions) * 100,
        2
      ) INTO v_attendance_grade
    FROM attendance_records ar
    JOIN attendance_sessions s ON s.id = ar.session_id
    WHERE ar.student_id = p_student_id
      AND s.course_id = p_course_id
      AND s.status IN ('closed', 'finalized');
      
  ELSE -- weighted
    -- Weighted: Average of scores per status
    SELECT 
      ROUND(
        AVG(
          CASE ar.status
            WHEN 'present' THEN (v_settings.scoring->>'present')::DECIMAL
            WHEN 'late' THEN (v_settings.scoring->>'late')::DECIMAL
            WHEN 'excused' THEN (v_settings.scoring->>'excused')::DECIMAL
            WHEN 'sick' THEN (v_settings.scoring->>'sick')::DECIMAL
            WHEN 'absent' THEN (v_settings.scoring->>'absent')::DECIMAL
            ELSE 0
          END
        ),
        2
      ) INTO v_attendance_grade
    FROM attendance_records ar
    JOIN attendance_sessions s ON s.id = ar.session_id
    WHERE ar.student_id = p_student_id
      AND s.course_id = p_course_id
      AND s.status IN ('closed', 'finalized');
  END IF;
  
  RETURN COALESCE(v_attendance_grade, 0);
END;
$$;

-- Function 7: Manual attendance update by teacher
CREATE OR REPLACE FUNCTION update_attendance_manual(
  p_record_id UUID,
  p_new_status TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session_id UUID;
  v_old_status TEXT;
BEGIN
  -- Get current status and session
  SELECT session_id, status INTO v_session_id, v_old_status
  FROM attendance_records
  WHERE id = p_record_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Attendance record not found';
  END IF;
  
  -- Verify teacher owns the session
  IF NOT EXISTS (
    SELECT 1 FROM attendance_sessions
    WHERE id = v_session_id AND teacher_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  -- Update record
  UPDATE attendance_records
  SET 
    status = p_new_status,
    original_status = COALESCE(original_status, v_old_status),
    marked_by = auth.uid(),
    check_in_method = 'manual_teacher',
    notes = COALESCE(p_notes, notes),
    updated_at = NOW()
  WHERE id = p_record_id;
  
  -- Update session counts
  UPDATE attendance_sessions
  SET 
    present_count = (SELECT COUNT(*) FROM attendance_records WHERE session_id = v_session_id AND status = 'present'),
    late_count = (SELECT COUNT(*) FROM attendance_records WHERE session_id = v_session_id AND status = 'late'),
    absent_count = (SELECT COUNT(*) FROM attendance_records WHERE session_id = v_session_id AND status = 'absent'),
    excused_count = (SELECT COUNT(*) FROM attendance_records WHERE session_id = v_session_id AND status = 'excused'),
    sick_count = (SELECT COUNT(*) FROM attendance_records WHERE session_id = v_session_id AND status = 'sick'),
    updated_at = NOW()
  WHERE id = v_session_id;
  
  RETURN json_build_object(
    'success', true,
    'old_status', v_old_status,
    'new_status', p_new_status
  );
END;
$$;

-- Trigger: Update report card when attendance changes
CREATE OR REPLACE FUNCTION update_report_card_attendance()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_course_id UUID;
  v_period_id UUID;
  v_attendance_grade DECIMAL;
BEGIN
  -- Get session details
  SELECT s.course_id, c.academic_period_id
  INTO v_course_id, v_period_id
  FROM attendance_sessions s
  JOIN courses c ON c.id = s.course_id
  WHERE s.id = NEW.session_id;
  
  -- Calculate attendance grade
  v_attendance_grade := calculate_attendance_grade(NEW.student_id, v_course_id);
  
  -- Update or insert report card
  INSERT INTO report_cards (
    student_id,
    course_id,
    academic_period_id,
    attendance_grade
  )
  VALUES (
    NEW.student_id,
    v_course_id,
    v_period_id,
    v_attendance_grade
  )
  ON CONFLICT (student_id, course_id, academic_period_id)
  DO UPDATE SET 
    attendance_grade = v_attendance_grade,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_attendance_grade
AFTER INSERT OR UPDATE ON attendance_records
FOR EACH ROW
EXECUTE FUNCTION update_report_card_attendance();

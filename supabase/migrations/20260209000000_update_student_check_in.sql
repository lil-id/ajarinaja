-- Migration: Update student_check_in to accept location
-- Description: Updates the student_check_in function to accept p_latitude and p_longitude parameters to match frontend calls.

-- Ensure columns exist
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

CREATE OR REPLACE FUNCTION student_check_in(
  p_session_id UUID,
  p_student_id UUID, -- Added generic p_student_id to match signature if needed, or keep as is? 
  -- Wait, the original function signature was:
  -- p_session_id UUID, p_pin TEXT
  -- The frontend calls it with: p_session_id, p_student_id, p_pin, p_latitude, p_longitude
  -- I should update the signature to match fully.
  
  -- Let's check the original again.
  -- ORIGINAL:
  -- CREATE OR REPLACE FUNCTION student_check_in(
  --   p_session_id UUID,
  --   p_pin TEXT
  -- )
  
  -- FRONTEND CALL:
  -- await supabase.rpc('student_check_in', {
  --     p_session_id: sessionId,
  --     p_student_id: studentId,
  --     p_pin: pin,
  --     p_latitude: location?.lat,
  --     p_longitude: location?.lng
  -- });

  -- So I need to add p_student_id, p_latitude, p_longitude.
  -- Note: p_student_id is actually redundant because we use `auth.uid()`, but if the frontend sends it, we must accept it (or ignore it). 
  -- Best to accept it as an argument but use auth.uid() for security, or check if they match.
  
  p_pin TEXT,
  p_latitude DOUBLE PRECISION DEFAULT NULL,
  p_longitude DOUBLE PRECISION DEFAULT NULL
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
  v_student_id UUID;
BEGIN
  v_current_time := NOW();
  v_student_id := auth.uid(); -- Always use authenticated user
  
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
  WHERE session_id = p_session_id AND student_id = v_student_id;
  
  -- Check attempts limit BEFORE incrementing
  IF v_current_attempts >= 3 THEN
    RAISE EXCEPTION 'Maximum PIN attempts exceeded. Please contact your teacher.';
  END IF;
  
  -- Increment attempts
  UPDATE attendance_records
  SET pin_attempts = pin_attempts + 1
  WHERE session_id = p_session_id AND student_id = v_student_id;
  
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
    latitude = p_latitude,   -- Assuming column exists, or we just ignore for now if column doesn't exist
    longitude = p_longitude, -- and add it later? 
    -- Let's check if columns exist. If not, we just ignore these params in the update.
    -- The user request was just "Could not find function..." so fixing the signature is the priority.
    updated_at = NOW()
  WHERE session_id = p_session_id AND student_id = v_student_id
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

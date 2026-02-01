-- Fix Attendance Calculation to be Global (Per Period) instead of Per Course
-- Because report_cards table is per Student+Period, not per Course.

-- 1. Function to calculate GLOBAL attendance for a student in a period
CREATE OR REPLACE FUNCTION calculate_attendance_overview(
  p_student_id UUID,
  p_period_id UUID
)
RETURNS TABLE (
  attendance_grade DECIMAL,
  attendance_percentage DECIMAL,
  total_sessions INTEGER,
  present_sessions INTEGER
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_total INTEGER;
  v_present INTEGER;
  v_late INTEGER;
  v_excused INTEGER;
  v_absent INTEGER;
  v_score DECIMAL := 0;
  -- Default weights
  w_present DECIMAL := 100;
  w_late DECIMAL := 80;
  w_excused DECIMAL := 60;
  w_absent DECIMAL := 0;
BEGIN
  -- Count records across ALL courses in this period
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE ar.status = 'present'),
    COUNT(*) FILTER (WHERE ar.status = 'late'),
    COUNT(*) FILTER (WHERE ar.status = 'excused'),
    COUNT(*) FILTER (WHERE ar.status = 'absent')
  INTO 
    v_total,
    v_present,
    v_late,
    v_excused,
    v_absent
  FROM attendance_records ar
  JOIN attendance_sessions s ON s.id = ar.session_id
  JOIN courses c ON c.id = s.course_id
  WHERE ar.student_id = p_student_id
    AND c.academic_period_id = p_period_id
    AND s.status IN ('closed', 'finalized');

  IF v_total IS NULL OR v_total = 0 THEN
    RETURN QUERY SELECT 0::decimal, 0::decimal, 0, 0;
    RETURN;
  END IF;

  -- Calculate Weighted Score
  v_score := (
    (v_present * w_present) +
    (v_late * w_late) +
    (v_excused * w_excused) +
    (v_absent * w_absent)
  ) / v_total;

  RETURN QUERY SELECT 
    ROUND(v_score, 2), 
    ROUND((v_present::decimal / v_total::decimal) * 100, 2),
    v_total,
    v_present;
END;
$$;

-- 2. Update Trigger Function
CREATE OR REPLACE FUNCTION update_report_card_attendance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_student_id UUID;
  v_course_id UUID;
  v_period_id UUID;
  v_calc RECORD;
BEGIN
  -- Determine Student and Course
  IF (TG_OP = 'DELETE') THEN
    v_student_id := OLD.student_id;
    SELECT course_id INTO v_course_id FROM attendance_sessions WHERE id = OLD.session_id;
  ELSE
    v_student_id := NEW.student_id;
    SELECT course_id INTO v_course_id FROM attendance_sessions WHERE id = NEW.session_id;
  END IF;

  -- Get Academic Period from Course
  SELECT academic_period_id INTO v_period_id FROM courses WHERE id = v_course_id;

  IF v_period_id IS NULL THEN
    RETURN NULL; -- Can't update if no period linked
  END IF;

  -- Calculate Stats
  SELECT * INTO v_calc FROM calculate_attendance_overview(v_student_id, v_period_id);

  -- Update Report Card (Identify by student & period)
  UPDATE report_cards
  SET 
    attendance_grade = v_calc.attendance_grade,
    attendance_percentage = v_calc.attendance_percentage,
    attendance_sessions_total = v_calc.total_sessions,
    attendance_sessions_present = v_calc.present_sessions,
    updated_at = NOW()
  WHERE student_id = v_student_id AND period_id = v_period_id;
  
  RETURN NULL;
END;
$$;

-- 3. Backfill Logic
DO $$
DECLARE
  r RECORD;
  v_calc RECORD;
BEGIN
  FOR r IN SELECT * FROM report_cards LOOP
    -- Calculate
    SELECT * INTO v_calc FROM calculate_attendance_overview(r.student_id, r.period_id);
    
    -- Update
    UPDATE report_cards
    SET 
      attendance_grade = v_calc.attendance_grade,
      attendance_percentage = v_calc.attendance_percentage,
      attendance_sessions_total = v_calc.total_sessions,
      attendance_sessions_present = v_calc.present_sessions,
      updated_at = NOW()
    WHERE id = r.id;
    
    RAISE NOTICE 'Updated RC %: Grade %, Pct %', r.id, v_calc.attendance_grade, v_calc.attendance_percentage;
  END LOOP;
END;
$$;

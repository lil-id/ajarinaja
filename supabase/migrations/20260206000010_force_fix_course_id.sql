-- Force fix for notify_parents_on_absence function
-- We explicitly DROP the trigger and function first to ensure no stale version remains
-- Then we recreate them with the correct logic (getting course_id from attendance_sessions)

-- 1. Drop existing trigger and function
DROP TRIGGER IF EXISTS trigger_notify_parents_absence ON public.attendance_records;
DROP FUNCTION IF EXISTS public.notify_parents_on_absence();

-- 2. Recreate Function with CORRECT logic
CREATE OR REPLACE FUNCTION public.notify_parents_on_absence()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student_name TEXT;
  v_course_title TEXT;
  v_course_id UUID;
BEGIN
  -- Only notify if status is absent
  IF NEW.status = 'absent' THEN
    -- Get course_id from attendance_sessions (attendance_records doesn't have course_id column)
    SELECT course_id INTO v_course_id
    FROM public.attendance_sessions
    WHERE id = NEW.session_id;
    
    -- Check if we found the session (safety check)
    IF v_course_id IS NULL THEN
        RAISE WARNING 'Attendance session not found for id %', NEW.session_id;
        RETURN NEW;
    END IF;
    
    -- Get student name
    SELECT name INTO v_student_name
    FROM public.profiles 
    WHERE user_id = NEW.student_id;
    
    -- Get course title
    SELECT title INTO v_course_title
    FROM public.courses
    WHERE id = v_course_id;
    
    -- Insert notification for all active parents of this student
    INSERT INTO public.notifications (user_id, type, title, message, link, created_at)
    SELECT 
      pcr.parent_user_id,
      'announcement',
      'Absence Alert',
      v_student_name || ' was absent from ' || COALESCE(v_course_title, 'Class'),
      '/parent/children/' || NEW.student_id || '/attendance',
      now()
    FROM public.parent_child_relationships pcr
    WHERE pcr.student_user_id = NEW.student_id 
      AND pcr.is_active = true;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 3. Recreate Trigger
CREATE TRIGGER trigger_notify_parents_absence
  AFTER INSERT OR UPDATE ON public.attendance_records
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_parents_on_absence();

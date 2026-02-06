-- Override parent notification triggers to fix related_id column error
-- The previous migrations 006 and 007 were reverted
-- This migration properly fixes both triggers

-- Fix 1: Attendance absence notification
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
      v_student_name || ' was absent from ' || v_course_title,
      '/parent/children/' || NEW.student_id || '/attendance',
      now()
    FROM public.parent_child_relationships pcr
    WHERE pcr.student_user_id = NEW.student_id 
      AND pcr.is_active = true;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Fix 2: Exam result notification
CREATE OR REPLACE FUNCTION public.notify_parents_on_exam_result()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student_name TEXT;
  v_exam_title TEXT;
  v_course_title TEXT;
BEGIN
  -- Only notify when exam is newly graded
  IF NEW.graded = true AND (OLD IS NULL OR OLD.graded = false) THEN
    -- Get student name
    SELECT name INTO v_student_name
    FROM public.profiles 
    WHERE user_id = NEW.student_id;
    
    -- Get exam and course title
    SELECT e.title, c.title INTO v_exam_title, v_course_title
    FROM public.exams e
    JOIN public.courses c ON e.course_id = c.id
    WHERE e.id = NEW.exam_id;
    
    -- Insert notification for all active parents
    INSERT INTO public.notifications (user_id, type, title, message, link, created_at)
    SELECT 
      pcr.parent_user_id,
      'grade',
      'Exam Results Available',
      v_student_name || ' scored ' || NEW.score || ' in ' || v_exam_title || ' (' || v_course_title || ')',
      '/parent/children/' || NEW.student_id || '/exams',
      now()
    FROM public.parent_child_relationships pcr
    WHERE pcr.student_user_id = NEW.student_id 
      AND pcr.is_active = true;
  END IF;
  
  RETURN NEW;
END;
$$;

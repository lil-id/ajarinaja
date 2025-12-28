-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info', -- 'assignment', 'grade', 'announcement', 'deadline', 'info'
  read BOOLEAN NOT NULL DEFAULT false,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only view their own notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

-- Teachers can create notifications for students
CREATE POLICY "Teachers can create notifications"
ON public.notifications FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'teacher'));

-- Enable realtime for notifications
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Create index for faster queries
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(user_id, read);

-- Function to create notifications when assignment is graded
CREATE OR REPLACE FUNCTION public.notify_on_assignment_graded()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  assignment_title TEXT;
  course_title TEXT;
BEGIN
  IF NEW.graded = true AND (OLD.graded = false OR OLD.graded IS NULL) THEN
    SELECT a.title, c.title INTO assignment_title, course_title
    FROM assignments a
    JOIN courses c ON a.course_id = c.id
    WHERE a.id = NEW.assignment_id;
    
    INSERT INTO notifications (user_id, title, message, type, link)
    VALUES (
      NEW.student_id,
      'Assignment Graded',
      'Your assignment "' || assignment_title || '" in ' || course_title || ' has been graded. Score: ' || NEW.score,
      'grade',
      '/student/assignments'
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger for assignment grading notifications
CREATE TRIGGER on_assignment_graded
AFTER UPDATE ON public.assignment_submissions
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_assignment_graded();

-- Function to create notifications when exam is graded
CREATE OR REPLACE FUNCTION public.notify_on_exam_graded()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  exam_title TEXT;
  course_title TEXT;
BEGIN
  IF NEW.graded = true AND (OLD.graded = false OR OLD.graded IS NULL) THEN
    SELECT e.title, c.title INTO exam_title, course_title
    FROM exams e
    JOIN courses c ON e.course_id = c.id
    WHERE e.id = NEW.exam_id;
    
    INSERT INTO notifications (user_id, title, message, type, link)
    VALUES (
      NEW.student_id,
      'Exam Graded',
      'Your exam "' || exam_title || '" in ' || course_title || ' has been graded. Score: ' || NEW.score,
      'grade',
      '/student/exams'
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger for exam grading notifications
CREATE TRIGGER on_exam_graded
AFTER UPDATE ON public.exam_submissions
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_exam_graded();

-- Function to notify enrolled students about new announcements
CREATE OR REPLACE FUNCTION public.notify_on_new_announcement()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  course_title TEXT;
  student_record RECORD;
BEGIN
  SELECT title INTO course_title FROM courses WHERE id = NEW.course_id;
  
  FOR student_record IN 
    SELECT student_id FROM enrollments WHERE course_id = NEW.course_id
  LOOP
    INSERT INTO notifications (user_id, title, message, type, link)
    VALUES (
      student_record.student_id,
      'New Announcement',
      'New announcement in ' || course_title || ': ' || NEW.title,
      'announcement',
      '/student/announcements'
    );
  END LOOP;
  RETURN NEW;
END;
$$;

-- Trigger for new announcement notifications
CREATE TRIGGER on_new_announcement
AFTER INSERT ON public.announcements
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_new_announcement();
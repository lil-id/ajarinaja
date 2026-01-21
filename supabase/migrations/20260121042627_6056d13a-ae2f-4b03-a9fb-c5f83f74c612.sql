-- Add RLS policy for teachers to enroll students in their courses
CREATE POLICY "Teachers can enroll students in their courses"
ON public.enrollments
FOR INSERT
WITH CHECK (
  owns_course(auth.uid(), course_id) AND 
  has_role(auth.uid(), 'teacher'::app_role)
);
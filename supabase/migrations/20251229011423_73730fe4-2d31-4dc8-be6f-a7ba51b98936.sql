-- Drop the existing overly restrictive policy
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Create a new policy allowing users to view their own profile OR teachers to view profiles of enrolled students
CREATE POLICY "Users can view own profile or teachers view enrolled students"
ON public.profiles FOR SELECT
USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM public.enrollments e
    JOIN public.courses c ON c.id = e.course_id
    WHERE e.student_id = profiles.user_id
    AND c.teacher_id = auth.uid()
  )
);
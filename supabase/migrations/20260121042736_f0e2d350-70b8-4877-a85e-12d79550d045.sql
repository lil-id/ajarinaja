-- Drop the existing policy
DROP POLICY IF EXISTS "Users can view own profile or teachers view enrolled students" ON public.profiles;

-- Create a new policy that allows:
-- 1. Users to view their own profile
-- 2. Teachers to view student profiles (all students, not just enrolled)
CREATE POLICY "Users can view own profile or teachers view students"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = user_id 
  OR (
    has_role(auth.uid(), 'teacher'::app_role) AND 
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_roles.user_id = profiles.user_id 
      AND role = 'student'
    )
  )
);
-- Migration: Allow operators to read user_roles table
-- useSchoolStats and useSchoolStudents query user_roles to count teachers/students.
-- Without this policy, operators get 0 results due to RLS.

DROP POLICY IF EXISTS "Operators can view all user roles" ON public.user_roles;

CREATE POLICY "Operators can view all user roles"
  ON public.user_roles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'operator'
    )
  );

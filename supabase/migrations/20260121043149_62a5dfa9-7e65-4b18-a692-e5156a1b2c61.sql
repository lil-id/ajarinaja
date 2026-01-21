-- Allow teachers to view user roles (needed to find students for enrollment)
CREATE POLICY "Teachers can view all user roles"
ON public.user_roles
FOR SELECT
USING (
  has_role(auth.uid(), 'teacher'::app_role)
);
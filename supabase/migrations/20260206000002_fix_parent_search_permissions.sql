-- Migration: Fix permissions for parent search functionality
-- Description: Ensures parents can view student roles and profiles to search for children

-- 1. Allow viewing user_roles for students (needed to find student IDs)
DROP POLICY IF EXISTS "Authenticated users can view student roles" ON public.user_roles;

CREATE POLICY "Authenticated users can view student roles" 
  ON public.user_roles 
  FOR SELECT 
  USING (
    role = 'student' AND auth.uid() IS NOT NULL
  );

-- 2. Ensure profiles are viewable (needed to see student names/avatars in search)
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;

CREATE POLICY "Authenticated users can view all profiles" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

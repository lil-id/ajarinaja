-- Migration: Allow operators to update courses (for reassigning teachers)
-- Phase 6: Assign guru ke kursus

-- Drop any existing conflicting policies
DROP POLICY IF EXISTS "Operators can update courses" ON public.courses;

-- Create policy allowing operators to update courses
CREATE POLICY "Operators can update courses"
  ON public.courses
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'operator'
    )
  );

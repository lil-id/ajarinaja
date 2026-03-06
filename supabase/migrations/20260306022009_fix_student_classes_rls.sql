-- Migration: Allow students to view all classes in active academic periods
-- Purpose: Fixes the bug where students cannot see available classes during the onboarding process
-- because the original RLS policy only allowed viewing if they were already enrolled.

-- 1. Create a new policy specifically for students viewing classes
CREATE POLICY "Students can view all classes in active periods"
  ON public.classes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'student'
    )
    AND
    EXISTS (
      SELECT 1 FROM public.academic_periods
      WHERE id = academic_year_id AND is_active = true
    )
  );

-- Fix infinite recursion in academic_periods policies
-- The issue: academic_periods SELECT policy references report_cards, and report_cards policies reference academic_periods

-- Drop the problematic student policy that causes recursion
DROP POLICY IF EXISTS "Students can view periods they have report cards for" ON public.academic_periods;

-- Create a simpler policy: all authenticated users can view all academic periods
-- This is reasonable because periods are not sensitive data
CREATE POLICY "All authenticated users can view academic periods" 
ON public.academic_periods 
FOR SELECT 
USING (auth.uid() IS NOT NULL);
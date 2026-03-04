-- Migration: Operator RLS policies for academic_periods, courses, profiles, enrollments
-- Depends on: 20260304000003_add_operator_role.sql (app_role enum must already have 'operator')

-- 2. Update RLS on academic_periods
-- New model: operators manage all periods, everyone can read all periods.

-- Drop existing teacher-scoped policies (if they exist)
DROP POLICY IF EXISTS "Teachers can manage their own periods" ON public.academic_periods;
DROP POLICY IF EXISTS "Users can view academic periods they created" ON public.academic_periods;
DROP POLICY IF EXISTS "Teachers can create academic periods" ON public.academic_periods;
DROP POLICY IF EXISTS "Teachers can update their own periods" ON public.academic_periods;
DROP POLICY IF EXISTS "Teachers can delete their own periods" ON public.academic_periods;

-- Everyone (authenticated) can read all academic_periods
CREATE POLICY "All authenticated users can read periods"
  ON public.academic_periods
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Only operators can create academic_periods
CREATE POLICY "Operators can create periods"
  ON public.academic_periods
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'operator'
    )
  );

-- Only operators can update academic_periods
CREATE POLICY "Operators can update periods"
  ON public.academic_periods
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'operator'
    )
  );

-- Only operators can delete academic_periods
CREATE POLICY "Operators can delete periods"
  ON public.academic_periods
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'operator'
    )
  );

-- 3. Operators can read all courses (without teacher_id filter)
DROP POLICY IF EXISTS "Operators can view all courses" ON public.courses;
CREATE POLICY "Operators can view all courses"
  ON public.courses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'operator'
    )
  );

-- 4. Operators can read all profiles
DROP POLICY IF EXISTS "Operators can view all profiles" ON public.profiles;
CREATE POLICY "Operators can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'operator'
    )
  );

-- 5. Operators can read all enrollments
DROP POLICY IF EXISTS "Operators can view all enrollments" ON public.enrollments;
CREATE POLICY "Operators can view all enrollments"
  ON public.enrollments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'operator'
    )
  );

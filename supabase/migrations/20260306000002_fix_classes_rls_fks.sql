-- Fix foreign keys to point to public.profiles(user_id) for PostgREST joins
-- This resolves PGRST200 where PostgREST couldn't find the relationship

ALTER TABLE public.classes 
  DROP CONSTRAINT IF EXISTS classes_homeroom_teacher_id_fkey,
  ADD CONSTRAINT classes_homeroom_teacher_id_fkey 
  FOREIGN KEY (homeroom_teacher_id) REFERENCES public.profiles(user_id) ON DELETE SET NULL;

ALTER TABLE public.class_students 
  DROP CONSTRAINT IF EXISTS class_students_student_id_fkey,
  ADD CONSTRAINT class_students_student_id_fkey 
  FOREIGN KEY (student_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.class_schedules 
  DROP CONSTRAINT IF EXISTS class_schedules_teacher_id_fkey,
  ADD CONSTRAINT class_schedules_teacher_id_fkey 
  FOREIGN KEY (teacher_id) REFERENCES public.profiles(user_id) ON DELETE SET NULL;

-- Fix infinite recursion in RLS policies by allowing all teachers to view classes and schedules
-- This replaces the recursive policies that checked each other

DROP POLICY IF EXISTS "Teachers can view their classes" ON public.classes;
CREATE POLICY "Teachers can view all classes"
  ON public.classes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'teacher'
    )
  );

DROP POLICY IF EXISTS "Teachers can view schedules they teach" ON public.class_schedules;
CREATE POLICY "Teachers can view all schedules"
  ON public.class_schedules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'teacher'
    )
  );

DROP POLICY IF EXISTS "Teachers can view class_students" ON public.class_students;
CREATE POLICY "Teachers can view all class_students"
  ON public.class_students FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'teacher'
    )
  );

-- Reload schema cache to ensure PostgREST picks up the new foreign keys immediately
NOTIFY pgrst, 'reload schema';

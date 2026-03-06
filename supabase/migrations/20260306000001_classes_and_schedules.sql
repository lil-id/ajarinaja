-- Migration: Add Classes (Rombongan Belajar) and Schedules
-- Foundation for Operational Dashboard (ADR 005)

-- 1. classes table (Rombongan Belajar)
CREATE TABLE public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                    -- e.g. "X-IPA-1"
  grade_level INTEGER NOT NULL,          -- e.g. 10
  homeroom_teacher_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  academic_year_id UUID REFERENCES public.academic_periods(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_classes_academic_year_id ON public.classes(academic_year_id);
CREATE INDEX idx_classes_homeroom_teacher_id ON public.classes(homeroom_teacher_id);

-- 2. class_students table (Siswa per Kelas)
CREATE TABLE public.class_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(class_id, student_id)
);

CREATE INDEX idx_class_students_class_id ON public.class_students(class_id);
CREATE INDEX idx_class_students_student_id ON public.class_students(student_id);

-- 3. class_schedules table (Jadwal Pelajaran)
CREATE TABLE public.class_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- NULL = unassigned (triggers alert)
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 7), -- 1=Monday, 7=Sunday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  room TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_schedule_time CHECK (end_time > start_time)
);

CREATE INDEX idx_class_schedules_class_id ON public.class_schedules(class_id);
CREATE INDEX idx_class_schedules_course_id ON public.class_schedules(course_id);
CREATE INDEX idx_class_schedules_teacher_id ON public.class_schedules(teacher_id);
CREATE INDEX idx_class_schedules_day_of_week ON public.class_schedules(day_of_week);

-- Enable RLS
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_schedules ENABLE ROW LEVEL SECURITY;

-- Helper: check if user is an operator
CREATE OR REPLACE FUNCTION public.is_operator(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'operator'
  )
$$;

-- RLS Policies: classes
-- Operators can do everything; teachers & students can read their own class
CREATE POLICY "Operators can manage classes"
  ON public.classes FOR ALL
  USING (public.is_operator(auth.uid()));

CREATE POLICY "Teachers can view their classes"
  ON public.classes FOR SELECT
  USING (
    homeroom_teacher_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.class_schedules cs
      WHERE cs.class_id = id AND cs.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students can view their classes"
  ON public.classes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.class_students cstu
      WHERE cstu.class_id = id AND cstu.student_id = auth.uid()
    )
  );

-- RLS Policies: class_students
CREATE POLICY "Operators can manage class_students"
  ON public.class_students FOR ALL
  USING (public.is_operator(auth.uid()));

CREATE POLICY "Teachers can view class_students"
  ON public.class_students FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = class_id AND (
        c.homeroom_teacher_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.class_schedules cs
          WHERE cs.class_id = c.id AND cs.teacher_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Students can view own class membership"
  ON public.class_students FOR SELECT
  USING (student_id = auth.uid());

-- RLS Policies: class_schedules
CREATE POLICY "Operators can manage class_schedules"
  ON public.class_schedules FOR ALL
  USING (public.is_operator(auth.uid()));

CREATE POLICY "Teachers can view schedules they teach"
  ON public.class_schedules FOR SELECT
  USING (
    teacher_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = class_id AND c.homeroom_teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students can view their class schedules"
  ON public.class_schedules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.class_students cstu
      WHERE cstu.class_id = class_id AND cstu.student_id = auth.uid()
    )
  );

-- Auto-update timestamps
CREATE TRIGGER update_classes_updated_at
  BEFORE UPDATE ON public.classes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_class_schedules_updated_at
  BEFORE UPDATE ON public.class_schedules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('teacher', 'student');

-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);

-- Create courses table
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  thumbnail_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create exams table
CREATE TABLE public.exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  duration INTEGER NOT NULL DEFAULT 60,
  total_points INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create questions table
CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('multiple-choice', 'essay')),
  question TEXT NOT NULL,
  options JSONB,
  correct_answer INTEGER,
  points INTEGER NOT NULL DEFAULT 10,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create enrollments table
CREATE TABLE public.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, course_id)
);

-- Create exam_submissions table
CREATE TABLE public.exam_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  answers JSONB NOT NULL DEFAULT '{}',
  score INTEGER,
  graded BOOLEAN NOT NULL DEFAULT false,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(exam_id, student_id)
);

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_submissions ENABLE ROW LEVEL SECURITY;

-- Helper function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Helper function to check if user is enrolled in course
CREATE OR REPLACE FUNCTION public.is_enrolled(_user_id UUID, _course_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    -- 1. Explicit enrollment
    SELECT 1 FROM public.enrollments
    WHERE student_id = _user_id AND course_id = _course_id
    UNION
    -- 2. Implicit enrollment via class schedule
    SELECT 1 FROM public.class_students cs
    JOIN public.class_schedules sch ON cs.class_id = sch.class_id
    WHERE cs.student_id = _user_id AND sch.course_id = _course_id
  )
$$;

-- Helper function to check if user owns course
CREATE OR REPLACE FUNCTION public.owns_course(_user_id UUID, _course_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.courses
    WHERE id = _course_id AND teacher_id = _user_id
  )
$$;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User roles policies
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own role" ON public.user_roles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Courses policies
CREATE POLICY "Anyone can view published courses" ON public.courses FOR SELECT USING (status = 'published' OR teacher_id = auth.uid());
CREATE POLICY "Teachers can insert courses" ON public.courses FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'teacher') AND teacher_id = auth.uid());
CREATE POLICY "Teachers can update own courses" ON public.courses FOR UPDATE USING (teacher_id = auth.uid());
CREATE POLICY "Teachers can delete own courses" ON public.courses FOR DELETE USING (teacher_id = auth.uid());

-- Exams policies
CREATE POLICY "View exams for enrolled or owned courses" ON public.exams FOR SELECT USING (
  public.owns_course(auth.uid(), course_id) OR 
  (status = 'published' AND public.is_enrolled(auth.uid(), course_id))
);
CREATE POLICY "Teachers can insert exams" ON public.exams FOR INSERT WITH CHECK (public.owns_course(auth.uid(), course_id));
CREATE POLICY "Teachers can update own exams" ON public.exams FOR UPDATE USING (public.owns_course(auth.uid(), course_id));
CREATE POLICY "Teachers can delete own exams" ON public.exams FOR DELETE USING (public.owns_course(auth.uid(), course_id));

-- Questions policies
CREATE POLICY "View questions for accessible exams" ON public.questions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.exams e 
    WHERE e.id = exam_id AND (
      public.owns_course(auth.uid(), e.course_id) OR 
      (e.status = 'published' AND public.is_enrolled(auth.uid(), e.course_id))
    )
  )
);
CREATE POLICY "Teachers can manage questions" ON public.questions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.exams e WHERE e.id = exam_id AND public.owns_course(auth.uid(), e.course_id))
);
CREATE POLICY "Teachers can update questions" ON public.questions FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.exams e WHERE e.id = exam_id AND public.owns_course(auth.uid(), e.course_id))
);
CREATE POLICY "Teachers can delete questions" ON public.questions FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.exams e WHERE e.id = exam_id AND public.owns_course(auth.uid(), e.course_id))
);

-- Enrollments policies
CREATE POLICY "View own enrollments or teacher view" ON public.enrollments FOR SELECT USING (
  student_id = auth.uid() OR public.owns_course(auth.uid(), course_id)
);
CREATE POLICY "Students can enroll themselves" ON public.enrollments FOR INSERT WITH CHECK (
  student_id = auth.uid() AND public.has_role(auth.uid(), 'student')
);
CREATE POLICY "Students can unenroll" ON public.enrollments FOR DELETE USING (student_id = auth.uid());

-- Exam submissions policies
CREATE POLICY "View own submissions or teacher view" ON public.exam_submissions FOR SELECT USING (
  student_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM public.exams e WHERE e.id = exam_id AND public.owns_course(auth.uid(), e.course_id))
);
CREATE POLICY "Students can submit exams" ON public.exam_submissions FOR INSERT WITH CHECK (
  student_id = auth.uid() AND public.is_enrolled(auth.uid(), (SELECT course_id FROM public.exams WHERE id = exam_id))
);
CREATE POLICY "Teachers can grade submissions" ON public.exam_submissions FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.exams e WHERE e.id = exam_id AND public.owns_course(auth.uid(), e.course_id))
);

-- Function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  
  -- Insert role from user metadata
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    (NEW.raw_user_meta_data->>'role')::app_role
  );
  
  RETURN NEW;
END;
$$;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_exams_updated_at BEFORE UPDATE ON public.exams FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.courses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.exams;
ALTER PUBLICATION supabase_realtime ADD TABLE public.enrollments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.exam_submissions;

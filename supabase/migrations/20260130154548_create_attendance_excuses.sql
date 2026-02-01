-- Create Attendance Excuses Table
CREATE TABLE IF NOT EXISTS public.attendance_excuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  excuse_type TEXT DEFAULT 'excused', 
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT NOT NULL,
  attachment_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add Indexes
CREATE INDEX IF NOT EXISTS idx_attendance_excuses_student ON public.attendance_excuses(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_excuses_course ON public.attendance_excuses(course_id);
CREATE INDEX IF NOT EXISTS idx_attendance_excuses_status ON public.attendance_excuses(status);

-- Enable RLS
ALTER TABLE public.attendance_excuses ENABLE ROW LEVEL SECURITY;

-- Policies

-- 1. Students can view their own excuses
DROP POLICY IF EXISTS "Students can view own excuses" ON public.attendance_excuses;
CREATE POLICY "Students can view own excuses" ON public.attendance_excuses 
FOR SELECT USING (auth.uid() = student_id);

-- 2. Students can create excuses
DROP POLICY IF EXISTS "Students can create excuses" ON public.attendance_excuses;
CREATE POLICY "Students can create excuses" ON public.attendance_excuses 
FOR INSERT WITH CHECK (auth.uid() = student_id);

-- 3. Teachers can view excuses for their courses
DROP POLICY IF EXISTS "Teachers can view course excuses" ON public.attendance_excuses;
CREATE POLICY "Teachers can view course excuses" ON public.attendance_excuses 
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.courses WHERE id = public.attendance_excuses.course_id AND teacher_id = auth.uid())
);

-- 4. Teachers can update excuses (Approve/Reject)
DROP POLICY IF EXISTS "Teachers can update course excuses" ON public.attendance_excuses;
CREATE POLICY "Teachers can update course excuses" ON public.attendance_excuses 
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.courses WHERE id = public.attendance_excuses.course_id AND teacher_id = auth.uid())
);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance_excuses;

-- Notify
NOTIFY pgrst, 'reload config';

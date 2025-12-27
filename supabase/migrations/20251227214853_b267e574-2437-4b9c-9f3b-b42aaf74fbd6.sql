-- Add video_url column to course_materials for YouTube videos
ALTER TABLE public.course_materials 
ADD COLUMN video_url text DEFAULT NULL;

-- Update file_path and file_name to be nullable for video-only entries
ALTER TABLE public.course_materials 
ALTER COLUMN file_path DROP NOT NULL,
ALTER COLUMN file_name DROP NOT NULL,
ALTER COLUMN file_size DROP NOT NULL,
ALTER COLUMN file_type DROP NOT NULL;

-- Create badges table
CREATE TABLE public.badges (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  icon text NOT NULL DEFAULT 'award',
  color text NOT NULL DEFAULT 'gold',
  is_preset boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create student_badges table for awarded badges
CREATE TABLE public.student_badges (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid NOT NULL,
  badge_id uuid NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  exam_id uuid REFERENCES public.exams(id) ON DELETE SET NULL,
  submission_id uuid REFERENCES public.exam_submissions(id) ON DELETE SET NULL,
  awarded_by uuid NOT NULL,
  awarded_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(student_id, badge_id, exam_id)
);

-- Enable RLS
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_badges ENABLE ROW LEVEL SECURITY;

-- Badges policies
CREATE POLICY "Anyone can view badges" ON public.badges
  FOR SELECT USING (true);

CREATE POLICY "Teachers can create badges" ON public.badges
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'teacher'));

CREATE POLICY "Teachers can update own badges" ON public.badges
  FOR UPDATE USING (created_by = auth.uid() AND is_preset = false);

CREATE POLICY "Teachers can delete own badges" ON public.badges
  FOR DELETE USING (created_by = auth.uid() AND is_preset = false);

-- Student badges policies
CREATE POLICY "Students can view own badges" ON public.student_badges
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Teachers can view badges they awarded" ON public.student_badges
  FOR SELECT USING (awarded_by = auth.uid());

CREATE POLICY "Teachers can award badges" ON public.student_badges
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'teacher'));

CREATE POLICY "Teachers can revoke badges they awarded" ON public.student_badges
  FOR DELETE USING (awarded_by = auth.uid());

-- Insert preset badges
INSERT INTO public.badges (name, description, icon, color, is_preset) VALUES
  ('Perfect Score', 'Achieved 100% on an exam', 'trophy', 'gold', true),
  ('Top Performer', 'Outstanding performance on an exam', 'star', 'blue', true),
  ('Most Improved', 'Showed significant improvement', 'trending-up', 'green', true),
  ('Quick Learner', 'Completed exam with excellent speed and accuracy', 'zap', 'purple', true),
  ('Consistent Excellence', 'Maintains high performance across exams', 'award', 'orange', true);
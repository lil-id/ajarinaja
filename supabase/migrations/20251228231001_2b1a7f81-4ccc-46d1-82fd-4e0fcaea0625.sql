-- Create assignments table
CREATE TABLE public.assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  max_points INTEGER NOT NULL DEFAULT 100,
  allow_late_submissions BOOLEAN NOT NULL DEFAULT false,
  late_penalty_percent INTEGER DEFAULT 10,
  max_file_size_mb INTEGER DEFAULT 10,
  allowed_file_types TEXT[] DEFAULT ARRAY['pdf', 'doc', 'docx', 'txt', 'zip'],
  rubric JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create assignment_submissions table
CREATE TABLE public.assignment_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  file_path TEXT,
  file_name TEXT,
  file_size INTEGER,
  file_type TEXT,
  text_content TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_late BOOLEAN NOT NULL DEFAULT false,
  score INTEGER,
  graded BOOLEAN NOT NULL DEFAULT false,
  graded_at TIMESTAMP WITH TIME ZONE,
  graded_by UUID,
  feedback TEXT,
  rubric_scores JSONB DEFAULT '[]'::jsonb,
  UNIQUE(assignment_id, student_id)
);

-- Enable RLS
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;

-- Assignment policies
CREATE POLICY "View assignments for accessible courses"
ON public.assignments FOR SELECT
USING (
  owns_course(auth.uid(), course_id) OR 
  (status = 'published' AND is_enrolled(auth.uid(), course_id))
);

CREATE POLICY "Teachers can insert assignments"
ON public.assignments FOR INSERT
WITH CHECK (owns_course(auth.uid(), course_id));

CREATE POLICY "Teachers can update assignments"
ON public.assignments FOR UPDATE
USING (owns_course(auth.uid(), course_id));

CREATE POLICY "Teachers can delete assignments"
ON public.assignments FOR DELETE
USING (owns_course(auth.uid(), course_id));

-- Assignment submission policies
CREATE POLICY "View own submissions or teacher view"
ON public.assignment_submissions FOR SELECT
USING (
  student_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM assignments a 
    WHERE a.id = assignment_submissions.assignment_id 
    AND owns_course(auth.uid(), a.course_id)
  )
);

CREATE POLICY "Students can submit assignments"
ON public.assignment_submissions FOR INSERT
WITH CHECK (
  student_id = auth.uid() AND 
  is_enrolled(auth.uid(), (SELECT course_id FROM assignments WHERE id = assignment_submissions.assignment_id))
);

CREATE POLICY "Students can update own ungraded submissions"
ON public.assignment_submissions FOR UPDATE
USING (student_id = auth.uid() AND graded = false);

CREATE POLICY "Teachers can grade submissions"
ON public.assignment_submissions FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM assignments a 
    WHERE a.id = assignment_submissions.assignment_id 
    AND owns_course(auth.uid(), a.course_id)
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_assignments_updated_at
BEFORE UPDATE ON public.assignments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for assignment submissions
INSERT INTO storage.buckets (id, name, public) 
VALUES ('assignment-submissions', 'assignment-submissions', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for assignment submissions
CREATE POLICY "Students can upload their submissions"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'assignment-submissions' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Students can view their own submissions"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'assignment-submissions' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Teachers can view submissions for their courses"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'assignment-submissions' AND
  EXISTS (
    SELECT 1 FROM assignment_submissions s
    JOIN assignments a ON a.id = s.assignment_id
    WHERE s.file_path = name AND owns_course(auth.uid(), a.course_id)
  )
);
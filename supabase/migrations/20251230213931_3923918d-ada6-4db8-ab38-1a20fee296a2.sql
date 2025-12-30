-- Add KKM (minimum passing score) field to exams and assignments
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS kkm INTEGER DEFAULT 60;
ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS kkm INTEGER DEFAULT 60;

-- Add questions support to assignments (similar to exams)
-- Create assignment_questions table
CREATE TABLE IF NOT EXISTS public.assignment_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('multiple-choice', 'multi-select', 'essay')),
  options JSONB,
  correct_answer INTEGER,
  correct_answers INTEGER[],
  points INTEGER NOT NULL DEFAULT 10,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add assignment_type column to differentiate question-based vs submission-based assignments
ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS assignment_type VARCHAR(50) DEFAULT 'submission' CHECK (assignment_type IN ('submission', 'questions'));

-- Create assignment_question_submissions table for storing answers to question-based assignments
CREATE TABLE IF NOT EXISTS public.assignment_question_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  answers JSONB NOT NULL DEFAULT '{}',
  score INTEGER,
  graded BOOLEAN NOT NULL DEFAULT false,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add unique constraint on student + assignment for question submissions
ALTER TABLE public.assignment_question_submissions ADD CONSTRAINT unique_student_assignment_question 
  UNIQUE (assignment_id, student_id);

-- Enable RLS on new tables
ALTER TABLE public.assignment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_question_submissions ENABLE ROW LEVEL SECURITY;

-- RLS policies for assignment_questions
CREATE POLICY "Teachers can manage their assignment questions" 
ON public.assignment_questions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.assignments a
    JOIN public.courses c ON a.course_id = c.id
    WHERE a.id = assignment_questions.assignment_id AND c.teacher_id = auth.uid()
  )
);

CREATE POLICY "Students can view published assignment questions" 
ON public.assignment_questions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.assignments a
    WHERE a.id = assignment_questions.assignment_id 
    AND a.status = 'published'
    AND public.is_enrolled(auth.uid(), a.course_id)
  )
);

-- RLS policies for assignment_question_submissions
CREATE POLICY "Students can submit their own assignment answers" 
ON public.assignment_question_submissions FOR INSERT
WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can view their own submissions" 
ON public.assignment_question_submissions FOR SELECT
USING (student_id = auth.uid());

CREATE POLICY "Teachers can view all submissions for their assignments" 
ON public.assignment_question_submissions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.assignments a
    JOIN public.courses c ON a.course_id = c.id
    WHERE a.id = assignment_question_submissions.assignment_id AND c.teacher_id = auth.uid()
  )
);

CREATE POLICY "Teachers can grade submissions" 
ON public.assignment_question_submissions FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.assignments a
    JOIN public.courses c ON a.course_id = c.id
    WHERE a.id = assignment_question_submissions.assignment_id AND c.teacher_id = auth.uid()
  )
);
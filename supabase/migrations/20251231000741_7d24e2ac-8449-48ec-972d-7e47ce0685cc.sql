-- Add feedback column to assignment_question_submissions
ALTER TABLE public.assignment_question_submissions 
ADD COLUMN IF NOT EXISTS feedback text;
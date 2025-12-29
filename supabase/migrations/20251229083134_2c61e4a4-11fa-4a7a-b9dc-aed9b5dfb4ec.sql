-- Add correct_answers column for multi-select questions to questions table
ALTER TABLE public.questions 
ADD COLUMN correct_answers INTEGER[] DEFAULT NULL;

-- Add correct_answers column for multi-select questions to question_bank table
ALTER TABLE public.question_bank 
ADD COLUMN correct_answers INTEGER[] DEFAULT NULL;

-- Recreate the student_exam_questions view to exclude correct_answers
DROP VIEW IF EXISTS public.student_exam_questions;
CREATE VIEW public.student_exam_questions AS
SELECT 
  id,
  exam_id,
  question,
  type,
  options,
  points,
  order_index,
  created_at
FROM public.questions;
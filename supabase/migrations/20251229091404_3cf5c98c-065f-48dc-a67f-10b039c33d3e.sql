-- Allow multi-select question type in questions table
ALTER TABLE public.questions
DROP CONSTRAINT IF EXISTS questions_type_check;

ALTER TABLE public.questions
ADD CONSTRAINT questions_type_check
CHECK (type IN ('multiple-choice', 'multi-select', 'essay'));
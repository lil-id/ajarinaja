-- Add explanation column to question_bank table for AI-generated questions
-- This allows teachers to provide detailed explanations for correct answers

ALTER TABLE public.question_bank 
ADD COLUMN IF NOT EXISTS explanation TEXT;

-- Add comment to document the column
COMMENT ON COLUMN public.question_bank.explanation IS 'Detailed explanation for why the correct answer is right - especially useful for AI-generated questions';

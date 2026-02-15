-- Add image_url column to assignment_questions table
ALTER TABLE assignment_questions
ADD COLUMN IF NOT EXISTS image_url TEXT;

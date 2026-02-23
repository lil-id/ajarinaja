-- Migration: Add atomic increment function for question usage
-- Description: Creates a function to atomically increment the used_count of a question in the question_bank table.

CREATE OR REPLACE FUNCTION increment_question_usage(p_question_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE question_bank
  SET used_count = used_count + 1
  WHERE id = p_question_id;
END;
$$;

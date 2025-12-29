-- =============================================
-- FIX 1: Server-side exam score calculation
-- Create a trigger to calculate scores on the server, ignoring client-sent scores
-- =============================================

CREATE OR REPLACE FUNCTION public.calculate_exam_score()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  calculated_score INTEGER := 0;
  question_record RECORD;
  answer_value INTEGER;
BEGIN
  -- Loop through all questions for this exam
  FOR question_record IN 
    SELECT id, correct_answer, points, type
    FROM public.questions 
    WHERE exam_id = NEW.exam_id
  LOOP
    -- Only calculate score for multiple-choice questions with a correct answer
    IF question_record.type = 'multiple-choice' AND question_record.correct_answer IS NOT NULL THEN
      -- Get the student's answer from the JSONB answers field
      -- The answers are stored as {question_id: answer_index}
      IF NEW.answers ? question_record.id::text THEN
        BEGIN
          answer_value := (NEW.answers ->> question_record.id::text)::integer;
          IF answer_value = question_record.correct_answer THEN
            calculated_score := calculated_score + question_record.points;
          END IF;
        EXCEPTION WHEN OTHERS THEN
          -- If conversion fails, skip this answer (might be an essay answer)
          NULL;
        END;
      END IF;
    END IF;
  END LOOP;
  
  -- Override the client-sent score with server-calculated score
  NEW.score := calculated_score;
  RETURN NEW;
END;
$$;

-- Create trigger to auto-calculate score before insert
DROP TRIGGER IF EXISTS auto_calculate_exam_score ON public.exam_submissions;
CREATE TRIGGER auto_calculate_exam_score
  BEFORE INSERT ON public.exam_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_exam_score();

-- =============================================
-- FIX 2: Hide correct answers from students
-- Create a view for students that excludes correct_answer
-- =============================================

-- Create a view for students without correct answers
CREATE OR REPLACE VIEW public.student_exam_questions AS
SELECT 
  id,
  exam_id,
  type,
  question,
  options,
  points,
  order_index,
  created_at
  -- correct_answer is intentionally excluded
FROM public.questions;

-- Grant access to authenticated users
GRANT SELECT ON public.student_exam_questions TO authenticated;

-- =============================================
-- FIX 3: Restrict profile email visibility
-- Users can only see their own full profile (including email)
-- =============================================

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create new restrictive policy - users can only view their own profile
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create a view for public profile data (without email) for cases where you need to display other users' names/avatars
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  id,
  user_id,
  name,
  avatar_url,
  created_at
  -- email is intentionally excluded
FROM public.profiles;

-- Grant access to authenticated users
GRANT SELECT ON public.public_profiles TO authenticated;
-- Migration: Add parent access to assignment_question_submissions
-- Description: Adds RLS policies to allow parents to view their children's quiz submissions.

-- Parents can view their children's question submissions
DROP POLICY IF EXISTS "Parents can view children question submissions" ON public.assignment_question_submissions;
CREATE POLICY "Parents can view children question submissions" 
  ON public.assignment_question_submissions 
  FOR SELECT 
  USING (
    public.is_parent_of(auth.uid(), student_id)
  );

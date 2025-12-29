-- Add policy to allow students to view questions (including correct answers) 
-- ONLY after they have submitted the exam
CREATE POLICY "Students can view questions after submission"
ON public.questions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM exam_submissions es 
    WHERE es.exam_id = questions.exam_id 
    AND es.student_id = auth.uid()
  )
);
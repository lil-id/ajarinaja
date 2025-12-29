-- Drop the existing permissive policy that allows students to see correct answers
DROP POLICY IF EXISTS "View questions for accessible exams" ON public.questions;

-- Teachers can view all question details (including correct_answer)
CREATE POLICY "Teachers can view all question details" 
ON public.questions FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.exams e 
    WHERE e.id = questions.exam_id 
    AND public.owns_course(auth.uid(), e.course_id)
  )
);

-- Students cannot access questions table directly - they must use the student_exam_questions view
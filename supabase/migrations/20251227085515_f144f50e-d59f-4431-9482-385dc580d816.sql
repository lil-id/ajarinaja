-- Allow teachers to unenroll students from their courses
CREATE POLICY "Teachers can unenroll students from their courses"
ON public.enrollments
FOR DELETE
USING (owns_course(auth.uid(), course_id));
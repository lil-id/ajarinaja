-- Make course-materials bucket private to protect course materials
UPDATE storage.buckets 
SET public = false 
WHERE id = 'course-materials';

-- Drop existing select policy if it exists
DROP POLICY IF EXISTS "Authenticated users can view course materials" ON storage.objects;
DROP POLICY IF EXISTS "Enrolled users can view materials" ON storage.objects;

-- Create policy that allows enrolled students and course owners to view materials
CREATE POLICY "Enrolled users can view course materials"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'course-materials'
  AND auth.uid() IS NOT NULL
  AND (
    -- Allow if user is teacher who owns a course with this material
    EXISTS (
      SELECT 1 FROM public.course_materials cm
      JOIN public.courses c ON c.id = cm.course_id
      WHERE cm.file_path = name
      AND c.teacher_id = auth.uid()
    )
    OR
    -- Allow if user is enrolled in a course with this material
    EXISTS (
      SELECT 1 FROM public.course_materials cm
      JOIN public.enrollments e ON e.course_id = cm.course_id
      WHERE cm.file_path = name
      AND e.student_id = auth.uid()
    )
  )
);
-- Create storage bucket for AI materials
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'materials',
  'materials',
  false,
  10485760, -- 10MB
  ARRAY['application/pdf', 'text/plain']
)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for materials bucket
CREATE POLICY "Teachers can upload materials"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'materials' 
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'teacher'
  )
);

CREATE POLICY "Teachers can view their own materials"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'materials' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Teachers can delete their own materials"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'materials' 
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'teacher'
  )
);

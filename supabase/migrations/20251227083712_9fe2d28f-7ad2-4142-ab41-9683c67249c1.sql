-- Create storage bucket for course thumbnails
INSERT INTO storage.buckets (id, name, public) 
VALUES ('course-thumbnails', 'course-thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for course thumbnails
CREATE POLICY "Anyone can view course thumbnails"
ON storage.objects FOR SELECT
USING (bucket_id = 'course-thumbnails');

CREATE POLICY "Teachers can upload course thumbnails"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'course-thumbnails' 
  AND auth.uid() IS NOT NULL
  AND public.has_role(auth.uid(), 'teacher')
);

CREATE POLICY "Teachers can update their course thumbnails"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'course-thumbnails' 
  AND auth.uid() IS NOT NULL
  AND public.has_role(auth.uid(), 'teacher')
);

CREATE POLICY "Teachers can delete their course thumbnails"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'course-thumbnails' 
  AND auth.uid() IS NOT NULL
  AND public.has_role(auth.uid(), 'teacher')
);
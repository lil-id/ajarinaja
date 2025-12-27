-- Create storage bucket for course materials
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-materials', 'course-materials', true);

-- Create course materials table to track uploads
CREATE TABLE public.course_materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.course_materials ENABLE ROW LEVEL SECURITY;

-- Teachers can manage materials for their own courses
CREATE POLICY "Teachers can insert materials"
ON public.course_materials
FOR INSERT
WITH CHECK (owns_course(auth.uid(), course_id));

CREATE POLICY "Teachers can update materials"
ON public.course_materials
FOR UPDATE
USING (owns_course(auth.uid(), course_id));

CREATE POLICY "Teachers can delete materials"
ON public.course_materials
FOR DELETE
USING (owns_course(auth.uid(), course_id));

-- View materials for owned or enrolled courses
CREATE POLICY "View materials for accessible courses"
ON public.course_materials
FOR SELECT
USING (
  owns_course(auth.uid(), course_id) 
  OR is_enrolled(auth.uid(), course_id)
);

-- Storage policies for course-materials bucket
CREATE POLICY "Teachers can upload course materials"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'course-materials' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Teachers can update course materials"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'course-materials' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Teachers can delete course materials"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'course-materials' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Anyone can view course materials"
ON storage.objects
FOR SELECT
USING (bucket_id = 'course-materials');

-- Add trigger for updated_at
CREATE TRIGGER update_course_materials_updated_at
BEFORE UPDATE ON public.course_materials
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
-- Create table to track material views/downloads
CREATE TABLE public.material_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  material_id UUID NOT NULL REFERENCES public.course_materials(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(material_id, student_id)
);

-- Enable RLS
ALTER TABLE public.material_views ENABLE ROW LEVEL SECURITY;

-- Students can view their own material views
CREATE POLICY "Students can view own material views"
ON public.material_views
FOR SELECT
USING (student_id = auth.uid());

-- Students can insert their own material views
CREATE POLICY "Students can insert own material views"
ON public.material_views
FOR INSERT
WITH CHECK (student_id = auth.uid());

-- Teachers can view material views for their courses
CREATE POLICY "Teachers can view material views for their courses"
ON public.material_views
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM course_materials cm
    JOIN courses c ON c.id = cm.course_id
    WHERE cm.id = material_views.material_id
    AND c.teacher_id = auth.uid()
  )
);
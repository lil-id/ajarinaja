-- Add scheduling columns to exams table
ALTER TABLE public.exams 
ADD COLUMN start_date timestamp with time zone,
ADD COLUMN end_date timestamp with time zone;

-- Create announcements table
CREATE TABLE public.announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on announcements
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Teachers can manage announcements for their own courses
CREATE POLICY "Teachers can insert announcements"
ON public.announcements
FOR INSERT
WITH CHECK (owns_course(auth.uid(), course_id));

CREATE POLICY "Teachers can update announcements"
ON public.announcements
FOR UPDATE
USING (owns_course(auth.uid(), course_id));

CREATE POLICY "Teachers can delete announcements"
ON public.announcements
FOR DELETE
USING (owns_course(auth.uid(), course_id));

-- Anyone can view announcements for published courses or their enrolled courses
CREATE POLICY "View announcements for accessible courses"
ON public.announcements
FOR SELECT
USING (
  owns_course(auth.uid(), course_id) 
  OR is_enrolled(auth.uid(), course_id)
);

-- Add trigger for updated_at
CREATE TRIGGER update_announcements_updated_at
BEFORE UPDATE ON public.announcements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
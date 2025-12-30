-- Create a table for custom calendar events
CREATE TABLE public.calendar_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'custom',
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Teachers can view their own events" 
ON public.calendar_events 
FOR SELECT 
USING (teacher_id = auth.uid());

CREATE POLICY "Teachers can create their own events" 
ON public.calendar_events 
FOR INSERT 
WITH CHECK (teacher_id = auth.uid() AND has_role(auth.uid(), 'teacher'::app_role));

CREATE POLICY "Teachers can update their own events" 
ON public.calendar_events 
FOR UPDATE 
USING (teacher_id = auth.uid());

CREATE POLICY "Teachers can delete their own events" 
ON public.calendar_events 
FOR DELETE 
USING (teacher_id = auth.uid());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_calendar_events_updated_at
BEFORE UPDATE ON public.calendar_events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
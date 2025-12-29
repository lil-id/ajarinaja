-- Create question bank table for reusable questions
CREATE TABLE public.question_bank (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  category TEXT NOT NULL DEFAULT 'General',
  question TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'multiple_choice',
  options JSONB,
  correct_answer INTEGER,
  points INTEGER NOT NULL DEFAULT 10,
  tags TEXT[] DEFAULT '{}',
  used_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.question_bank ENABLE ROW LEVEL SECURITY;

-- Teachers can view their own questions
CREATE POLICY "Teachers can view own questions"
ON public.question_bank
FOR SELECT
USING (teacher_id = auth.uid());

-- Teachers can insert questions
CREATE POLICY "Teachers can insert questions"
ON public.question_bank
FOR INSERT
WITH CHECK (teacher_id = auth.uid() AND has_role(auth.uid(), 'teacher'::app_role));

-- Teachers can update own questions
CREATE POLICY "Teachers can update own questions"
ON public.question_bank
FOR UPDATE
USING (teacher_id = auth.uid());

-- Teachers can delete own questions
CREATE POLICY "Teachers can delete own questions"
ON public.question_bank
FOR DELETE
USING (teacher_id = auth.uid());

-- Create trigger for updated_at
CREATE TRIGGER update_question_bank_updated_at
BEFORE UPDATE ON public.question_bank
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
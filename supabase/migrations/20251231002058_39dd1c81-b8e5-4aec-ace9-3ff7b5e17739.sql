-- Add archived column to assignments table
ALTER TABLE public.assignments 
ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false;

-- Add archived column to exams table
ALTER TABLE public.exams 
ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false;

-- Create indexes for faster filtering
CREATE INDEX IF NOT EXISTS idx_assignments_archived ON public.assignments(archived);
CREATE INDEX IF NOT EXISTS idx_exams_archived ON public.exams(archived);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON public.assignments(status);
CREATE INDEX IF NOT EXISTS idx_exams_status ON public.exams(status);
-- Add separate severity columns for each risk factor in assignments
ALTER TABLE public.assignments 
ADD COLUMN risk_missed_severity text DEFAULT 'high',
ADD COLUMN risk_below_kkm_severity text DEFAULT 'medium',
ADD COLUMN risk_late_severity text DEFAULT 'low';

-- Add separate severity columns for each risk factor in exams
ALTER TABLE public.exams 
ADD COLUMN risk_missed_severity text DEFAULT 'high',
ADD COLUMN risk_below_kkm_severity text DEFAULT 'medium';

-- Remove the old single risk_severity column from assignments
ALTER TABLE public.assignments DROP COLUMN IF EXISTS risk_severity;

-- Remove the old single risk_severity column from exams
ALTER TABLE public.exams DROP COLUMN IF EXISTS risk_severity;
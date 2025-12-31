-- Add risk tracking columns to assignments table
ALTER TABLE public.assignments
ADD COLUMN risk_on_missed boolean NOT NULL DEFAULT false,
ADD COLUMN risk_on_below_kkm boolean NOT NULL DEFAULT false,
ADD COLUMN risk_on_late boolean NOT NULL DEFAULT false,
ADD COLUMN risk_severity text DEFAULT 'medium' CHECK (risk_severity IN ('high', 'medium', 'low'));

-- Add risk tracking columns to exams table
ALTER TABLE public.exams
ADD COLUMN risk_on_missed boolean NOT NULL DEFAULT false,
ADD COLUMN risk_on_below_kkm boolean NOT NULL DEFAULT false,
ADD COLUMN risk_severity text DEFAULT 'medium' CHECK (risk_severity IN ('high', 'medium', 'low'));

-- Add comment for clarity
COMMENT ON COLUMN public.assignments.risk_on_missed IS 'Flag student as at-risk if they miss this assignment deadline';
COMMENT ON COLUMN public.assignments.risk_on_below_kkm IS 'Flag student as at-risk if score is below KKM';
COMMENT ON COLUMN public.assignments.risk_on_late IS 'Flag student as at-risk if submitted late';
COMMENT ON COLUMN public.assignments.risk_severity IS 'Risk level when flagged: high, medium, or low';
COMMENT ON COLUMN public.exams.risk_on_missed IS 'Flag student as at-risk if they miss this exam';
COMMENT ON COLUMN public.exams.risk_on_below_kkm IS 'Flag student as at-risk if score is below KKM';
COMMENT ON COLUMN public.exams.risk_severity IS 'Risk level when flagged: high, medium, or low';
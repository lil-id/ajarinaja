-- Create table for teacher-customizable risk threshold settings
CREATE TABLE public.risk_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL,
  
  -- High risk thresholds
  high_risk_missed_assignments INT NOT NULL DEFAULT 3,
  high_risk_below_kkm_count INT NOT NULL DEFAULT 2,
  
  -- Medium risk thresholds
  medium_risk_missed_assignments INT NOT NULL DEFAULT 1,
  medium_risk_below_kkm_count INT NOT NULL DEFAULT 1,
  
  -- Low risk thresholds
  low_risk_late_submissions INT NOT NULL DEFAULT 1,
  low_risk_material_view_percent INT NOT NULL DEFAULT 50,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Only one settings row per teacher
  CONSTRAINT unique_teacher_risk_settings UNIQUE (teacher_id)
);

-- Enable Row Level Security
ALTER TABLE public.risk_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for teacher access
CREATE POLICY "Teachers can view their own risk settings" 
ON public.risk_settings 
FOR SELECT 
USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can create their own risk settings" 
ON public.risk_settings 
FOR INSERT 
WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers can update their own risk settings" 
ON public.risk_settings 
FOR UPDATE 
USING (auth.uid() = teacher_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_risk_settings_updated_at
BEFORE UPDATE ON public.risk_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
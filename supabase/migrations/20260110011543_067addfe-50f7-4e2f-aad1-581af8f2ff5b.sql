-- Create academic_periods table for semester management
CREATE TABLE public.academic_periods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL, -- e.g., "2024/2025 Semester 1"
  academic_year TEXT NOT NULL, -- e.g., "2024/2025"
  semester INTEGER NOT NULL CHECK (semester IN (1, 2)),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL, -- teacher who created this period
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(academic_year, semester, created_by)
);

-- Create report_cards table for student report card headers
CREATE TABLE public.report_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  period_id UUID NOT NULL REFERENCES public.academic_periods(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'finalized')),
  overall_average NUMERIC(5,2),
  overall_rank INTEGER,
  total_courses INTEGER DEFAULT 0,
  teacher_notes TEXT, -- general notes for the student
  finalized_at TIMESTAMP WITH TIME ZONE,
  finalized_by UUID, -- teacher who finalized
  teacher_signature TEXT, -- base64 signature or signature URL
  principal_signature TEXT, -- base64 signature or signature URL
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, period_id)
);

-- Create report_card_entries table for individual course grades
CREATE TABLE public.report_card_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_card_id UUID NOT NULL REFERENCES public.report_cards(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  exam_average NUMERIC(5,2), -- average of all exam scores
  assignment_average NUMERIC(5,2), -- average of all assignment scores
  final_grade NUMERIC(5,2) NOT NULL, -- final calculated grade
  kkm INTEGER NOT NULL DEFAULT 60, -- minimum passing grade
  passed BOOLEAN GENERATED ALWAYS AS (final_grade >= kkm) STORED,
  teacher_notes TEXT, -- notes specific to this course
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(report_card_id, course_id)
);

-- Enable RLS on all tables
ALTER TABLE public.academic_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_card_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for academic_periods
CREATE POLICY "Teachers can create academic periods"
ON public.academic_periods
FOR INSERT
WITH CHECK (created_by = auth.uid() AND has_role(auth.uid(), 'teacher'));

CREATE POLICY "Teachers can view their own periods"
ON public.academic_periods
FOR SELECT
USING (created_by = auth.uid());

CREATE POLICY "Students can view periods they have report cards for"
ON public.academic_periods
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.report_cards rc
  WHERE rc.period_id = academic_periods.id
  AND rc.student_id = auth.uid()
  AND rc.status = 'finalized'
));

CREATE POLICY "Teachers can update their own periods"
ON public.academic_periods
FOR UPDATE
USING (created_by = auth.uid());

CREATE POLICY "Teachers can delete their own periods"
ON public.academic_periods
FOR DELETE
USING (created_by = auth.uid());

-- RLS Policies for report_cards
CREATE POLICY "Teachers can create report cards for their students"
ON public.report_cards
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'teacher') AND
  EXISTS (
    SELECT 1 FROM public.academic_periods ap
    WHERE ap.id = period_id AND ap.created_by = auth.uid()
  )
);

CREATE POLICY "Teachers can view report cards they manage"
ON public.report_cards
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.academic_periods ap
    WHERE ap.id = report_cards.period_id AND ap.created_by = auth.uid()
  )
);

CREATE POLICY "Students can view their own finalized report cards"
ON public.report_cards
FOR SELECT
USING (student_id = auth.uid() AND status = 'finalized');

CREATE POLICY "Teachers can update report cards they manage"
ON public.report_cards
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.academic_periods ap
    WHERE ap.id = report_cards.period_id AND ap.created_by = auth.uid()
  )
);

CREATE POLICY "Teachers can delete report cards they manage"
ON public.report_cards
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.academic_periods ap
    WHERE ap.id = report_cards.period_id AND ap.created_by = auth.uid()
  )
);

-- RLS Policies for report_card_entries
CREATE POLICY "Teachers can create entries for their report cards"
ON public.report_card_entries
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.report_cards rc
    JOIN public.academic_periods ap ON ap.id = rc.period_id
    WHERE rc.id = report_card_id AND ap.created_by = auth.uid()
  )
);

CREATE POLICY "Teachers can view entries for their report cards"
ON public.report_card_entries
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.report_cards rc
    JOIN public.academic_periods ap ON ap.id = rc.period_id
    WHERE rc.id = report_card_entries.report_card_id AND ap.created_by = auth.uid()
  )
);

CREATE POLICY "Students can view their own finalized entries"
ON public.report_card_entries
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.report_cards rc
    WHERE rc.id = report_card_entries.report_card_id
    AND rc.student_id = auth.uid()
    AND rc.status = 'finalized'
  )
);

CREATE POLICY "Teachers can update entries for their report cards"
ON public.report_card_entries
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.report_cards rc
    JOIN public.academic_periods ap ON ap.id = rc.period_id
    WHERE rc.id = report_card_entries.report_card_id AND ap.created_by = auth.uid()
  )
);

CREATE POLICY "Teachers can delete entries for their report cards"
ON public.report_card_entries
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.report_cards rc
    JOIN public.academic_periods ap ON ap.id = rc.period_id
    WHERE rc.id = report_card_entries.report_card_id AND ap.created_by = auth.uid()
  )
);

-- Create updated_at triggers
CREATE TRIGGER update_academic_periods_updated_at
BEFORE UPDATE ON public.academic_periods
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_report_cards_updated_at
BEFORE UPDATE ON public.report_cards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_report_card_entries_updated_at
BEFORE UPDATE ON public.report_card_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
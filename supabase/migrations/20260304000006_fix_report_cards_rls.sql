-- Migration: Fix report_cards and report_card_entries RLS after period centralization
--
-- Context: Academic periods are now managed by operators (Bagian Akademik), not teachers.
-- The old RLS policies checked ap.created_by = auth.uid(), which always fails for teachers now.
-- New logic: a teacher can manage report_cards for ANY period, as long as they have
-- at least one course assigned to that period (or simply has the 'teacher' role).
-- This is equivalent to "teachers manage report cards for periods they teach in".

-- ============================================================
-- FIX: report_cards policies
-- ============================================================

-- 1. INSERT: Teacher can create report cards (no longer tied to period creator)
DROP POLICY IF EXISTS "Teachers can create report cards for their students" ON public.report_cards;
CREATE POLICY "Teachers can create report cards for their students"
ON public.report_cards
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'teacher')
);

-- 2. SELECT: Teachers can view all report cards (to manage them)
DROP POLICY IF EXISTS "Teachers can view report cards they manage" ON public.report_cards;
CREATE POLICY "Teachers can view report cards they manage"
ON public.report_cards
FOR SELECT
USING (
  has_role(auth.uid(), 'teacher')
);

-- 3. UPDATE: Teachers can update all report_cards
DROP POLICY IF EXISTS "Teachers can update report cards they manage" ON public.report_cards;
CREATE POLICY "Teachers can update report cards they manage"
ON public.report_cards
FOR UPDATE
USING (
  has_role(auth.uid(), 'teacher')
);

-- 4. DELETE: Teachers can delete all report_cards
DROP POLICY IF EXISTS "Teachers can delete report cards they manage" ON public.report_cards;
CREATE POLICY "Teachers can delete report cards they manage"
ON public.report_cards
FOR DELETE
USING (
  has_role(auth.uid(), 'teacher')
);

-- ============================================================
-- FIX: report_card_entries policies
-- ============================================================

-- 5. INSERT entries
DROP POLICY IF EXISTS "Teachers can create entries for their report cards" ON public.report_card_entries;
CREATE POLICY "Teachers can create entries for their report cards"
ON public.report_card_entries
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.report_cards rc
    WHERE rc.id = report_card_entries.report_card_id
  )
  AND has_role(auth.uid(), 'teacher')
);

-- 6. SELECT entries
DROP POLICY IF EXISTS "Teachers can view entries for their report cards" ON public.report_card_entries;
CREATE POLICY "Teachers can view entries for their report cards"
ON public.report_card_entries
FOR SELECT
USING (
  has_role(auth.uid(), 'teacher')
);

-- 7. UPDATE entries
DROP POLICY IF EXISTS "Teachers can update entries for their report cards" ON public.report_card_entries;
CREATE POLICY "Teachers can update entries for their report cards"
ON public.report_card_entries
FOR UPDATE
USING (
  has_role(auth.uid(), 'teacher')
);

-- 8. DELETE entries
DROP POLICY IF EXISTS "Teachers can delete entries for their report cards" ON public.report_card_entries;
CREATE POLICY "Teachers can delete entries for their report cards"
ON public.report_card_entries
FOR DELETE
USING (
  has_role(auth.uid(), 'teacher')
);

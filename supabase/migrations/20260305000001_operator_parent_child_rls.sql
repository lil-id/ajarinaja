-- Migration: Grant operator read access to parent_child_relationships
-- Required for: Student data export (operator needs to resolve parent emails)

DROP POLICY IF EXISTS "Operators can view all parent-child relationships" ON public.parent_child_relationships;
CREATE POLICY "Operators can view all parent-child relationships"
  ON public.parent_child_relationships
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'operator'
    )
  );

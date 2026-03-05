-- School-wide announcements (managed by Operator / Bagian Akademik)
-- Separate from course-scoped `announcements` table.

CREATE TABLE public.school_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  target_roles TEXT[] NOT NULL DEFAULT '{teacher,student,parent}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.school_announcements ENABLE ROW LEVEL SECURITY;

-- Operators: full CRUD on all school announcements
CREATE POLICY "Operators can manage school announcements"
  ON public.school_announcements FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'operator'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'operator'
    )
  );

-- All authenticated users: SELECT if their role is in target_roles
CREATE POLICY "Users can view targeted school announcements"
  ON public.school_announcements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role::text = ANY(school_announcements.target_roles)
    )
  );

-- Auto-update updated_at on row update
CREATE TRIGGER update_school_announcements_updated_at
  BEFORE UPDATE ON public.school_announcements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

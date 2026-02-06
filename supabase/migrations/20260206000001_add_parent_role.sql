-- Migration: Add Parent Role Support
-- Description: Adds parent role to app_role enum, creates pairing code system, and parent-child relationships

-- ============================================
-- 1. SAFELY ADD 'parent' TO app_role ENUM
-- ============================================

-- Check if 'parent' already exists in the enum before adding
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'parent' 
    AND enumtypid = 'public.app_role'::regtype
  ) THEN
    ALTER TYPE public.app_role ADD VALUE 'parent';
  END IF;
END $$;

-- ============================================
-- 2. CREATE STUDENT PAIRING CODES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.student_pairing_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code VARCHAR(11) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Constraint: Only one active code per student
  CONSTRAINT unique_active_code_per_student UNIQUE(student_user_id, is_active)
);

-- Create unique index on active codes for fast lookup
CREATE UNIQUE INDEX IF NOT EXISTS idx_pairing_code_active_lookup 
  ON public.student_pairing_codes(code) 
  WHERE is_active = true;

-- Index for student lookups
CREATE INDEX IF NOT EXISTS idx_pairing_code_student 
  ON public.student_pairing_codes(student_user_id);

-- ============================================
-- 3. CREATE PARENT-CHILD RELATIONSHIPS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.parent_child_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  verified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Each parent-child pair should be unique
  CONSTRAINT unique_parent_child_pair UNIQUE(parent_user_id, student_user_id)
);

-- Index for parents to quickly find their children
CREATE INDEX IF NOT EXISTS idx_parent_children 
  ON public.parent_child_relationships(parent_user_id) 
  WHERE is_active = true;

-- Index for students to see their parents
CREATE INDEX IF NOT EXISTS idx_child_parents 
  ON public.parent_child_relationships(student_user_id) 
  WHERE is_active = true;

-- ============================================
-- 4. FUNCTION: GENERATE PAIRING CODE
-- ============================================

CREATE OR REPLACE FUNCTION public.generate_pairing_code()
RETURNS VARCHAR(11)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code VARCHAR(11);
  code_exists BOOLEAN;
  max_attempts INTEGER := 100;
  attempt INTEGER := 0;
BEGIN
  LOOP
    -- Generate format: ABC-123-DEF
    new_code := 
      CHR(65 + floor(random() * 26)::int) ||
      CHR(65 + floor(random() * 26)::int) ||
      CHR(65 + floor(random() * 26)::int) || '-' ||
      LPAD(floor(random() * 1000)::text, 3, '0') || '-' ||
      CHR(65 + floor(random() * 26)::int) ||
      CHR(65 + floor(random() * 26)::int) ||
      CHR(65 + floor(random() * 26)::int);
    
    -- Check if code already exists (only check active codes)
    SELECT EXISTS(
      SELECT 1 FROM public.student_pairing_codes 
      WHERE code = new_code AND is_active = true
    ) INTO code_exists;
    
    EXIT WHEN NOT code_exists;
    
    -- Safety check to prevent infinite loop
    attempt := attempt + 1;
    IF attempt >= max_attempts THEN
      RAISE EXCEPTION 'Failed to generate unique pairing code after % attempts', max_attempts;
    END IF;
  END LOOP;
  
  RETURN new_code;
END;
$$;

-- ============================================
-- 5. TRIGGER: AUTO-GENERATE PAIRING CODE FOR NEW STUDENTS
-- ============================================

CREATE OR REPLACE FUNCTION public.auto_generate_student_pairing_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only generate for users with student role
  IF EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = NEW.user_id AND role = 'student'
  ) THEN
    -- Insert pairing code (handle conflicts gracefully)
    INSERT INTO public.student_pairing_codes (student_user_id, code, is_active)
    VALUES (NEW.user_id, public.generate_pairing_code(), true)
    ON CONFLICT (student_user_id, is_active) 
    WHERE is_active = true
    DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on profiles table (fires after student profile is created)
DROP TRIGGER IF EXISTS trigger_generate_pairing_code ON public.profiles;
CREATE TRIGGER trigger_generate_pairing_code
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_generate_student_pairing_code();

-- ============================================
-- 6. RPC FUNCTION: VERIFY PAIRING CODE
-- ============================================

CREATE OR REPLACE FUNCTION public.verify_pairing_code(
  p_parent_user_id UUID,
  p_student_user_id UUID,
  p_pairing_code VARCHAR
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code_valid BOOLEAN;
  v_relationship_id UUID;
  v_parent_is_parent BOOLEAN;
  v_student_is_student BOOLEAN;
BEGIN
  -- Verify caller is actually a parent
  SELECT public.has_role(p_parent_user_id, 'parent') INTO v_parent_is_parent;
  IF NOT v_parent_is_parent THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User is not registered as a parent'
    );
  END IF;
  
  -- Verify target is actually a student
  SELECT public.has_role(p_student_user_id, 'student') INTO v_student_is_student;
  IF NOT v_student_is_student THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Target user is not a student'
    );
  END IF;
  
  -- Verify code matches student and is active
  SELECT EXISTS(
    SELECT 1 FROM public.student_pairing_codes
    WHERE student_user_id = p_student_user_id
      AND code = UPPER(p_pairing_code)
      AND is_active = true
  ) INTO v_code_valid;
  
  IF NOT v_code_valid THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Invalid or inactive pairing code'
    );
  END IF;
  
  -- Create or reactivate relationship
  INSERT INTO public.parent_child_relationships (
    parent_user_id,
    student_user_id,
    is_active,
    verified_at
  )
  VALUES (p_parent_user_id, p_student_user_id, true, now())
  ON CONFLICT (parent_user_id, student_user_id)
  DO UPDATE SET 
    is_active = true,
    verified_at = now()
  RETURNING id INTO v_relationship_id;
  
  RETURN json_build_object(
    'success', true,
    'relationship_id', v_relationship_id
  );
END;
$$;

-- ============================================
-- 7. RPC FUNCTION: REGENERATE PAIRING CODE
-- ============================================

CREATE OR REPLACE FUNCTION public.regenerate_pairing_code(
  p_student_user_id UUID
)
RETURNS VARCHAR
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_code VARCHAR(11);
  v_user_is_student BOOLEAN;
BEGIN
  -- Verify caller is the student
  IF auth.uid() != p_student_user_id THEN
    RAISE EXCEPTION 'Unauthorized: Can only regenerate your own pairing code';
  END IF;
  
  -- Verify user is a student
  SELECT public.has_role(p_student_user_id, 'student') INTO v_user_is_student;
  IF NOT v_user_is_student THEN
    RAISE EXCEPTION 'User is not a student';
  END IF;
  
  -- Deactivate all existing codes for this student
  UPDATE public.student_pairing_codes
  SET is_active = false
  WHERE student_user_id = p_student_user_id;
  
  -- Generate new code
  v_new_code := public.generate_pairing_code();
  
  -- Insert new active code
  INSERT INTO public.student_pairing_codes (student_user_id, code, is_active)
  VALUES (p_student_user_id, v_new_code, true);
  
  RETURN v_new_code;
END;
$$;

-- ============================================
-- 8. RPC FUNCTION: REMOVE PARENT ACCESS
-- ============================================

CREATE OR REPLACE FUNCTION public.remove_parent_access(
  p_student_user_id UUID,
  p_parent_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify caller is the student
  IF auth.uid() != p_student_user_id THEN
    RAISE EXCEPTION 'Unauthorized: Can only remove access from your own account';
  END IF;
  
  -- Deactivate the relationship
  UPDATE public.parent_child_relationships
  SET is_active = false
  WHERE student_user_id = p_student_user_id 
    AND parent_user_id = p_parent_user_id;
  
  RETURN FOUND;
END;
$$;

-- ============================================
-- 9. HELPER FUNCTION: CHECK IF USER IS PARENT OF STUDENT
-- ============================================

CREATE OR REPLACE FUNCTION public.is_parent_of(
  p_parent_user_id UUID,
  p_student_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.parent_child_relationships
    WHERE parent_user_id = p_parent_user_id 
      AND student_user_id = p_student_user_id
      AND is_active = true
  )
$$;

-- ============================================
-- 10. ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on new tables
ALTER TABLE public.student_pairing_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_child_relationships ENABLE ROW LEVEL SECURITY;

-- === student_pairing_codes policies ===

DROP POLICY IF EXISTS "Students can view own pairing code" ON public.student_pairing_codes;
CREATE POLICY "Students can view own pairing code" 
  ON public.student_pairing_codes 
  FOR SELECT 
  USING (auth.uid() = student_user_id);

DROP POLICY IF EXISTS "Students can manage own pairing code" ON public.student_pairing_codes;
CREATE POLICY "Students can manage own pairing code" 
  ON public.student_pairing_codes 
  FOR ALL 
  USING (auth.uid() = student_user_id);

-- === parent_child_relationships policies ===

DROP POLICY IF EXISTS "Parents can view their children" ON public.parent_child_relationships;
CREATE POLICY "Parents can view their children" 
  ON public.parent_child_relationships 
  FOR SELECT 
  USING (auth.uid() = parent_user_id AND is_active = true);

DROP POLICY IF EXISTS "Students can view their parents" ON public.parent_child_relationships;
CREATE POLICY "Students can view their parents" 
  ON public.parent_child_relationships 
  FOR SELECT 
  USING (auth.uid() = student_user_id AND is_active = true);

DROP POLICY IF EXISTS "Parents can manage relationships" ON public.parent_child_relationships;
CREATE POLICY "Parents can manage relationships" 
  ON public.parent_child_relationships 
  FOR ALL 
  USING (auth.uid() = parent_user_id);

-- === Update existing tables to allow parent data access ===

-- Parents can view their children's profiles
DROP POLICY IF EXISTS "Parents can view children profiles" ON public.profiles;
CREATE POLICY "Parents can view children profiles" 
  ON public.profiles 
  FOR SELECT 
  USING (
    user_id IN (
      SELECT student_user_id 
      FROM public.parent_child_relationships 
      WHERE parent_user_id = auth.uid() AND is_active = true
    )
  );

-- Parents can view enrollments of their children
DROP POLICY IF EXISTS "Parents can view children enrollments" ON public.enrollments;
CREATE POLICY "Parents can view children enrollments" 
  ON public.enrollments 
  FOR SELECT 
  USING (
    public.is_parent_of(auth.uid(), student_id)
  );

-- Parents can view exam submissions of their children
DROP POLICY IF EXISTS "Parents can view children exam submissions" ON public.exam_submissions;
CREATE POLICY "Parents can view children exam submissions" 
  ON public.exam_submissions 
  FOR SELECT 
  USING (
    public.is_parent_of(auth.uid(), student_id)
  );

-- Allow authenticated users to view student roles (for search functionality)
DROP POLICY IF EXISTS "Authenticated users can view student roles" ON public.user_roles;
CREATE POLICY "Authenticated users can view student roles" 
  ON public.user_roles 
  FOR SELECT 
  USING (
    role = 'student' AND auth.role() = 'authenticated'
  );

-- ============================================
-- 11. NOTIFICATION TRIGGERS FOR PARENTS
-- ============================================

-- First, check if notifications table exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'notifications'
  ) THEN
    
    -- Trigger: Notify parents when child is absent
    CREATE OR REPLACE FUNCTION public.notify_parents_on_absence()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $func$
    DECLARE
      v_student_name TEXT;
      v_course_title TEXT;
      v_course_id UUID;
    BEGIN
      -- Only notify if status is absent
      IF NEW.status = 'absent' THEN
        -- Get course_id from attendance_sessions (attendance_records doesn't have course_id column)
        SELECT course_id INTO v_course_id
        FROM public.attendance_sessions
        WHERE id = NEW.session_id;
        
        -- Get student name
        SELECT name INTO v_student_name
        FROM public.profiles 
        WHERE user_id = NEW.student_id;
        
        -- Get course title
        SELECT title INTO v_course_title
        FROM public.courses
        WHERE id = v_course_id;
        
        -- Insert notification for all active parents of this student
        INSERT INTO public.notifications (user_id, type, title, message, link, created_at)
        SELECT 
          pcr.parent_user_id,
          'announcement',
          'Absence Alert',
          v_student_name || ' was absent from ' || v_course_title,
          '/parent/children/' || NEW.student_id || '/attendance',
          now()
        FROM public.parent_child_relationships pcr
        WHERE pcr.student_user_id = NEW.student_id 
          AND pcr.is_active = true;
      END IF;
      
      RETURN NEW;
    END;
    $func$;
    
    -- Check if attendance_records table exists before creating trigger
    IF EXISTS (
      SELECT FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename = 'attendance_records'
    ) THEN
      DROP TRIGGER IF EXISTS trigger_notify_parents_absence ON public.attendance_records;
      CREATE TRIGGER trigger_notify_parents_absence
        AFTER INSERT OR UPDATE ON public.attendance_records
        FOR EACH ROW
        EXECUTE FUNCTION public.notify_parents_on_absence();
    END IF;
    
    -- Trigger: Notify parents when exam results are published
    CREATE OR REPLACE FUNCTION public.notify_parents_on_exam_result()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $func$
    DECLARE
      v_student_name TEXT;
      v_exam_title TEXT;
      v_course_title TEXT;
    BEGIN
      -- Only notify when exam is newly graded
      IF NEW.graded = true AND (OLD IS NULL OR OLD.graded = false) THEN
        -- Get student name
        SELECT name INTO v_student_name
        FROM public.profiles 
        WHERE user_id = NEW.student_id;
        
        -- Get exam and course title
        SELECT e.title, c.title INTO v_exam_title, v_course_title
        FROM public.exams e
        JOIN public.courses c ON e.course_id = c.id
        WHERE e.id = NEW.exam_id;
        
        -- Insert notification for all active parents
        INSERT INTO public.notifications (user_id, type, title, message, link, created_at)
        SELECT 
          pcr.parent_user_id,
          'grade',
          'Exam Results Available',
          v_student_name || ' scored ' || NEW.score || ' in ' || v_exam_title || ' (' || v_course_title || ')',
          '/parent/children/' || NEW.student_id || '/exams',
          now()
        FROM public.parent_child_relationships pcr
        WHERE pcr.student_user_id = NEW.student_id 
          AND pcr.is_active = true;
      END IF;
      
      RETURN NEW;
    END;
    $func$;
    
    DROP TRIGGER IF EXISTS trigger_notify_parents_exam ON public.exam_submissions;
    CREATE TRIGGER trigger_notify_parents_exam
      AFTER INSERT OR UPDATE ON public.exam_submissions
      FOR EACH ROW
      EXECUTE FUNCTION public.notify_parents_on_exam_result();
      
  END IF;
END $$;

-- ============================================
-- 12. BACKFILL: GENERATE CODES FOR EXISTING STUDENTS
-- ============================================

-- Generate pairing codes for all existing students who don't have one
INSERT INTO public.student_pairing_codes (student_user_id, code, is_active)
SELECT 
  ur.user_id,
  public.generate_pairing_code(),
  true
FROM public.user_roles ur
WHERE ur.role = 'student'
  AND NOT EXISTS (
    SELECT 1 FROM public.student_pairing_codes spc
    WHERE spc.student_user_id = ur.user_id AND spc.is_active = true
  )
ON CONFLICT (student_user_id, is_active) 
WHERE is_active = true
DO NOTHING;

-- ============================================
-- 13. ENABLE REALTIME FOR NEW TABLES
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.parent_child_relationships;

-- ============================================
-- 14. GRANT PERMISSIONS
-- ============================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.student_pairing_codes TO anon, authenticated;
GRANT ALL ON public.parent_child_relationships TO anon, authenticated;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';

-- Migration: Add secure RPC for student self-enrollment (Onboarding Blocker)
-- Purpose: Allows students to join a class without needing raw INSERT privileges on class_students table.

CREATE OR REPLACE FUNCTION public.enroll_student_in_class(p_class_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the creator (postgres) to bypass RLS
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_academic_year_id UUID;
    v_already_enrolled BOOLEAN;
BEGIN
    -- 1. Get current authenticated user
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- 2. Verify the user is a student
    IF NOT EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = v_user_id AND role = 'student'
    ) THEN
        RAISE EXCEPTION 'Only students can self-enroll';
    END IF;

    -- 3. Verify the class exists and get its academic period
    SELECT academic_year_id INTO v_academic_year_id
    FROM public.classes
    WHERE id = p_class_id;

    IF v_academic_year_id IS NULL THEN
        RAISE EXCEPTION 'Class not found or has no academic period';
    END IF;

    -- 4. Verify the academic period is active
    IF NOT EXISTS (
        SELECT 1 FROM public.academic_periods
        WHERE id = v_academic_year_id AND is_active = true
    ) THEN
        RAISE EXCEPTION 'Cannot enroll in a class for an inactive academic period';
    END IF;

    -- 5. Strict Check: Ensure student is not ALREADY enrolled in another class for this same active period
    SELECT EXISTS (
        SELECT 1 
        FROM public.class_students cs
        JOIN public.classes c ON cs.class_id = c.id
        WHERE cs.student_id = v_user_id
          AND c.academic_year_id = v_academic_year_id
    ) INTO v_already_enrolled;

    IF v_already_enrolled THEN
        RAISE EXCEPTION 'Student is already enrolled in a class for this academic period';
    END IF;

    -- 6. Insert the student into the class
    INSERT INTO public.class_students (class_id, student_id)
    VALUES (p_class_id, v_user_id);

    RETURN TRUE;
END;
$$;

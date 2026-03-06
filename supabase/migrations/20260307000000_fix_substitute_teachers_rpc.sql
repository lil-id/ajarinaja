-- Migration: Fix get_available_substitute_teachers RPC
-- Purpose: Resolve type mismatch, column names, ambiguity, and UUID mismatch.

-- Drop old versions to avoid ambiguity (function overloading)
DROP FUNCTION IF EXISTS get_available_substitute_teachers(text, time without time zone, time without time zone, uuid);
DROP FUNCTION IF EXISTS get_available_substitute_teachers(integer, text, text, uuid);

CREATE OR REPLACE FUNCTION get_available_substitute_teachers(
    p_day_of_week integer,
    p_start_time text,
    p_end_time text,
    p_subject_id uuid DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    name text,
    avatar_url text,
    is_same_subject boolean
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH BUSY_TEACHERS AS (
        -- Find teachers who already have a class scheduled that overlaps with the target time slot
        SELECT DISTINCT teacher_id
        FROM class_schedules
        WHERE day_of_week = p_day_of_week
        AND (
            -- Overlap logic: A overlaps B if A.start < B.end AND A.end > B.start
            -- Cast text to time for comparison
            start_time < p_end_time::time AND end_time > p_start_time::time
        )
    ),
    TEACHER_SUBJECTS AS (
        -- Simple heuristic: if the teacher has ever taught this subject in any active class schedule
        SELECT DISTINCT cs.teacher_id, true as teaches_target_subject
        FROM class_schedules cs
        WHERE cs.course_id = p_subject_id
    )
    SELECT 
        p.user_id as id, -- RETURN user_id (auth UUID) for frontend assignment
        p.name,
        p.avatar_url,
        COALESCE(ts.teaches_target_subject, false) as is_same_subject
    FROM 
        public_profiles p
    JOIN 
        user_roles ur ON p.user_id = ur.user_id -- JOIN on user_id (not internal profile id)
    LEFT JOIN 
        BUSY_TEACHERS bt ON p.user_id = bt.teacher_id -- LEFT JOIN on user_id
    LEFT JOIN 
        TEACHER_SUBJECTS ts ON p.user_id = ts.teacher_id -- LEFT JOIN on user_id
    WHERE 
        ur.role = 'teacher'
        AND bt.teacher_id IS NULL -- Exclude busy teachers
    ORDER BY 
        -- Prioritize teachers who teach the same subject
        is_same_subject DESC, 
        p.name ASC;
END;
$$;

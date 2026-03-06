-- Migration: Function to find available substitute teachers
-- Purpose: Helps operators find teachers who are not currently scheduled to teach during a specific time slot.

CREATE OR REPLACE FUNCTION get_available_substitute_teachers(
    p_day_of_week text,
    p_start_time time without time zone,
    p_end_time time without time zone,
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
            start_time < p_end_time AND end_time > p_start_time
        )
    ),
    TEACHER_SUBJECTS AS (
        -- Simple heuristic: if the teacher has ever taught this subject in any active class schedule, 
        -- we consider them capable of teaching it. Note: in a perfect system they would have a "competencies" array.
        SELECT DISTINCT cs.teacher_id, true as teaches_target_subject
        FROM class_schedules cs
        WHERE cs.subject_id = p_subject_id
    )
    SELECT 
        p.id,
        p.name,
        p.avatar_url,
        COALESCE(ts.teaches_target_subject, false) as is_same_subject
    FROM 
        public_profiles p
    JOIN 
        user_roles ur ON p.id = ur.user_id
    LEFT JOIN 
        BUSY_TEACHERS bt ON p.id = bt.teacher_id
    LEFT JOIN 
        TEACHER_SUBJECTS ts ON p.id = ts.teacher_id
    WHERE 
        ur.role = 'teacher'
        AND bt.teacher_id IS NULL -- Exclude busy teachers
    ORDER BY 
        -- Prioritize teachers who teach the same subject
        is_same_subject DESC, 
        p.name ASC;
END;
$$;

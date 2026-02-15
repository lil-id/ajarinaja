-- Drop the existing view
DROP VIEW IF EXISTS public.student_exam_questions;

-- Recreate the view with image_url included
CREATE VIEW public.student_exam_questions AS
SELECT
    id,
    exam_id,
    type,
    question,
    image_url,
    options,
    points,
    order_index,
    created_at
FROM
    public.questions;

-- Grant access to authenticated users
GRANT SELECT ON public.student_exam_questions TO authenticated;

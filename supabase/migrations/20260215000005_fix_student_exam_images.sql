-- Ensure image_url column exists in questions table (idempotent)
ALTER TABLE IF EXISTS public.questions
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Drop the view to ensure we can recreate it with new columns
DROP VIEW IF EXISTS public.student_exam_questions;

-- Recreate the view with the image_url column clearly included
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

-- Comment for documentation
COMMENT ON VIEW public.student_exam_questions IS 'View for students to access exam questions without seeing correct answers, including image URLs.';

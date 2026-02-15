-- Drop the existing view
DROP VIEW IF EXISTS student_exam_questions;

-- Recreate the view with the image_url column included
CREATE VIEW student_exam_questions AS
SELECT
  id,
  exam_id,
  type,
  question,
  image_url,  -- Added this column
  options,
  points,
  order_index,
  created_at
FROM questions;

-- Grant permissions (optional but good practice)
GRANT SELECT ON student_exam_questions TO authenticated;

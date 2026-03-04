-- Migration: Add semester and academic_year to courses table
-- Allows filtering the ChildDashboard performance report by semester

ALTER TABLE courses
    ADD COLUMN IF NOT EXISTS semester TEXT
        CHECK (semester IN ('Gasal', 'Genap')),
    ADD COLUMN IF NOT EXISTS academic_year TEXT;

-- Both columns are nullable so existing courses are unaffected.
-- academic_year format convention: "2024/2025"

COMMENT ON COLUMN courses.semester IS 'School semester: Gasal (odd) or Genap (even)';
COMMENT ON COLUMN courses.academic_year IS 'Academic year in format YYYY/YYYY e.g. 2024/2025';

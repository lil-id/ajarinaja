-- Migration: Replace courses.semester/academic_year with period_id FK
-- Replacing the text-based semester columns with a proper FK to academic_periods
-- which already serves as the authoritative semester/period management table.

ALTER TABLE courses
    DROP COLUMN IF EXISTS semester,
    DROP COLUMN IF EXISTS academic_year,
    ADD COLUMN IF NOT EXISTS period_id UUID REFERENCES academic_periods(id) ON DELETE SET NULL;

COMMENT ON COLUMN courses.period_id IS 'FK to academic_periods — assigns this course to a specific academic period/semester';

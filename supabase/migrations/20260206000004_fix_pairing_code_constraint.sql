-- Migration: Fix student pairing code constraint
-- Description: Replaces the flawed unique constraint with a partial unique index.
-- The previous constraint UNIQUE(student_user_id, is_active) prevented multiple "is_active=false" rows,
-- which caused errors when monitoring history of old codes.

-- 1. Drop the incorrect constraint
ALTER TABLE public.student_pairing_codes 
DROP CONSTRAINT IF EXISTS unique_active_code_per_student;

-- 2. Create a partial unique index that ONLY enforces uniqueness for active codes
-- This allows multiple inactive codes (history) but only one active code per student.
DROP INDEX IF EXISTS idx_unique_active_code_per_student;
CREATE UNIQUE INDEX idx_unique_active_code_per_student 
ON public.student_pairing_codes(student_user_id) 
WHERE is_active = true;

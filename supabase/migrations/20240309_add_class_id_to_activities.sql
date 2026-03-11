-- Migration: Add class_id to activity tables for course-class partitioning
-- target tables: attendance_sessions, assignments, exams, announcements

-- 1. Add class_id to attendance_sessions
ALTER TABLE attendance_sessions ADD COLUMN class_id UUID REFERENCES classes(id) ON DELETE CASCADE;
COMMENT ON COLUMN attendance_sessions.class_id IS 'Associated class for the attendance session';

-- 2. Add class_id to assignments
ALTER TABLE assignments ADD COLUMN class_id UUID REFERENCES classes(id) ON DELETE CASCADE;
COMMENT ON COLUMN assignments.class_id IS 'Associated class for the assignment';

-- 3. Add class_id to exams
ALTER TABLE exams ADD COLUMN class_id UUID REFERENCES classes(id) ON DELETE CASCADE;
COMMENT ON COLUMN exams.class_id IS 'Associated class for the exam';

-- 4. Add class_id to announcements
ALTER TABLE announcements ADD COLUMN class_id UUID REFERENCES classes(id) ON DELETE CASCADE;
COMMENT ON COLUMN announcements.class_id IS 'Associated class for the announcement';

-- Note: In a production environment with existing data, you would need to:
-- a) Make the column nullable initially (as done above)
-- b) Populate the class_id based on class_schedules or enrollments
-- c) Once populated, you can add NOT NULL constraints:
-- ALTER TABLE attendance_sessions ALTER COLUMN class_id SET NOT NULL;

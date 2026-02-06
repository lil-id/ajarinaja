-- Migration: Fix parent data access for Assignments, Exams, and Attendance
-- Description: Adds RLS policies to allow parents to view their children's academic data.

-- 1. Assignments Access
-- Parents can view published assignments for courses their children are enrolled in
DROP POLICY IF EXISTS "Parents can view assignments" ON public.assignments;
CREATE POLICY "Parents can view assignments" 
  ON public.assignments 
  FOR SELECT 
  USING (
    status = 'published' AND
    EXISTS (
      SELECT 1 FROM public.enrollments e
      JOIN public.parent_child_relationships pcr ON pcr.student_user_id = e.student_id
      WHERE e.course_id = assignments.course_id
        AND pcr.parent_user_id = auth.uid()
        AND pcr.is_active = true
    )
  );

-- 2. Assignment Submissions Access
-- Parents can view their children's submissions
DROP POLICY IF EXISTS "Parents can view children assignment submissions" ON public.assignment_submissions;
CREATE POLICY "Parents can view children assignment submissions" 
  ON public.assignment_submissions 
  FOR SELECT 
  USING (
    public.is_parent_of(auth.uid(), student_id)
  );

-- 3. Exams Access
-- Parents can view published exams for courses their children are enrolled in
DROP POLICY IF EXISTS "Parents can view exams" ON public.exams;
CREATE POLICY "Parents can view exams" 
  ON public.exams 
  FOR SELECT 
  USING (
    status = 'published' AND
    EXISTS (
      SELECT 1 FROM public.enrollments e
      JOIN public.parent_child_relationships pcr ON pcr.student_user_id = e.student_id
      WHERE e.course_id = exams.course_id
        AND pcr.parent_user_id = auth.uid()
        AND pcr.is_active = true
    )
  );

-- 4. Attendance Sessions Access
-- Parents can view attendance sessions for courses their children are enrolled in
DROP POLICY IF EXISTS "Parents can view attendance sessions" ON public.attendance_sessions;
CREATE POLICY "Parents can view attendance sessions" 
  ON public.attendance_sessions 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.enrollments e
      JOIN public.parent_child_relationships pcr ON pcr.student_user_id = e.student_id
      WHERE e.course_id = attendance_sessions.course_id
        AND pcr.parent_user_id = auth.uid()
        AND pcr.is_active = true
    )
  );

-- 5. Attendance Records Access
-- Parents can view their children's attendance records
DROP POLICY IF EXISTS "Parents can view children attendance records" ON public.attendance_records;
CREATE POLICY "Parents can view children attendance records" 
  ON public.attendance_records 
  FOR SELECT 
  USING (
    public.is_parent_of(auth.uid(), student_id)
  );

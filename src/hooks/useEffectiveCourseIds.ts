import { useMemo } from 'react';
import { useEnrollments } from './useEnrollments';
import { useStudentClasses } from './useStudentClasses';

/**
 * Custom hook to get all effective course IDs for a student.
 * This includes courses they explicitly enrolled in via `enrollments` table,
 * AND courses assigned to them implicitly via `class_schedules` matching their enrolled classes.
 * 
 * @returns {object} Object containing effectiveCourseIds array and a combined isLoading state.
 */
export function useEffectiveCourseIds() {
    const { enrollments, isLoading: enrollmentsLoading } = useEnrollments();
    const { data: studentClassesData, isLoading: studentClassesLoading } = useStudentClasses();

    const effectiveCourseIds = useMemo(() => {
        // 1. Explicit enrollments
        const explicitCourseIds = enrollments.map((e) => e.course_id);

        // 2. Implicit enrollments (via class_schedules)
        const implicitCourseIds = studentClassesData?.studentClassInfos.map((info) => info.course_id) || [];

        // 3. Combine and remove duplicates
        return Array.from(new Set([...explicitCourseIds, ...implicitCourseIds]));
    }, [enrollments, studentClassesData]);

    return {
        effectiveCourseIds,
        enrollments,
        enrolledClassIds: studentClassesData?.enrolledClassIds || [],
        isLoading: enrollmentsLoading || studentClassesLoading,
    };
}

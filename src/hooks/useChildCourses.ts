/**
 * @fileoverview Hook for fetching a specific child's enrolled courses
 * @description Allows parents to view all courses their child is enrolled in
 * 
 * @module hooks/useChildCourses
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to fetch courses for a specific child, including their academic period info.
 * 
 * @param {string | undefined} childUserId - The user ID of the child
 * @returns {Object} Courses data and state
 * @returns {Array} courses - Array of enrolled courses with period details
 * @returns {boolean} isLoading - Loading state
 * @returns {Error | null} error - Error object if fetch failed
 * 
 * @example
 * ```tsx
 * const { courses, isLoading } = useChildCourses(childId);
 * 
 * return (
 *   <div>
 *     {courses.map(course => (
 *       <CourseCard key={course.id} course={course} />
 *     ))}
 *   </div>
 * );
 * ```
 */
export function useChildCourses(childUserId: string | undefined) {
    const { data: courses = [], isLoading, error } = useQuery({
        queryKey: ['child-courses', childUserId],
        queryFn: async () => {
            if (!childUserId) return [];

            const { data: enrollments, error } = await supabase
                .from('enrollments')
                .select(`
          id,
          enrolled_at,
          status,
          courses (
            id,
            title,
            description,
            status,
            thumbnail_url,
            teacher_id,
            period_id,
            created_at
          )
        `)
                .eq('student_id', childUserId)
                .order('enrolled_at', { ascending: false });

            if (error) throw error;
            if (!enrollments || enrollments.length === 0) return [];

            // Get unique teacher IDs
            const teacherIds = [...new Set(
                enrollments.map((e: any) => e.courses.teacher_id)
            )];

            // Get unique period IDs (filter nulls)
            const periodIds = [...new Set(
                enrollments
                    .map((e: any) => e.courses.period_id)
                    .filter(Boolean)
            )];

            // Fetch teacher profiles
            const { data: teachers, error: teacherError } = await supabase
                .from('profiles')
                .select('user_id, name, email')
                .in('user_id', teacherIds);

            if (teacherError) throw teacherError;

            // Fetch academic periods
            let periodMap = new Map<string, any>();
            if (periodIds.length > 0) {
                const { data: periods } = await supabase
                    .from('academic_periods')
                    .select('id, name, semester, academic_year')
                    .in('id', periodIds);

                periodMap = new Map(periods?.map(p => [p.id, p]) || []);
            }

            // Create teacher map
            const teacherMap = new Map(
                teachers?.map(t => [t.user_id, t]) || []
            );

            return enrollments.map((enrollment: any) => {
                const teacher = teacherMap.get(enrollment.courses.teacher_id);
                const period = enrollment.courses.period_id
                    ? periodMap.get(enrollment.courses.period_id)
                    : null;
                return {
                    enrollment_id: enrollment.id,
                    enrolled_at: enrollment.enrolled_at,
                    enrollment_status: enrollment.status,
                    ...enrollment.courses,
                    teacher_name: teacher?.name || 'Unknown',
                    teacher_email: teacher?.email || '',
                    period_id: enrollment.courses.period_id ?? null,
                    period_name: period?.name ?? null,
                    period_semester: period?.semester ?? null,
                    period_academic_year: period?.academic_year ?? null,
                };
            });
        },
        enabled: !!childUserId,
    });

    return {
        courses,
        isLoading,
        error,
    };
}

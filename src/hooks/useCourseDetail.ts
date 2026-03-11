import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useEffect } from 'react';
import { Exam } from './useExams';
import { Assignment } from './useAssignments';
import { CourseMaterial } from './useCourseMaterials';
import { Announcement } from './useAnnouncements';
import { Course } from './useCourses';

export interface CourseDetail extends Course {
    exams: Exam[];
    assignments: Assignment[];
    course_materials: CourseMaterial[];
    announcements: Announcement[];
}

/**
 * Custom hook to fetch a course with all its related content using a single joined query.
 * This prevents data leaks by ensuring all content returned belongs to the specified courseId.
 * 
 * @param {string} courseId - The ID of the course to fetch.
 * @returns {object} The course detail, loading state, and error.
 */
export function useCourseDetail(courseId: string | undefined) {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const { data: courseDetail, isLoading, error } = useQuery({
        queryKey: ['course-detail', courseId],
        queryFn: async () => {
            if (!courseId) return null;

            const { data, error } = await supabase
                .from('courses')
                .select(`
          *,
          exams (*, class:classes(name)),
          assignments (*, class:classes(name)),
          course_materials (*),
          announcements (*)
        `)
                .eq('id', courseId)
                .maybeSingle();

            if (error) throw error;
            if (!data) return null;

            // Fetch teacher profile separately to match useCourse pattern
            let teacherProfile = null;
            if (data.teacher_id) {
                const { data: teacherData, error: teacherError } = await supabase
                    .from('public_profiles')
                    .select('user_id, name, avatar_url, bio')
                    .eq('user_id', data.teacher_id)
                    .maybeSingle();

                if (teacherData && !teacherError) {
                    teacherProfile = {
                        ...teacherData,
                        email: null,
                    };
                }
            }

            // Ensure data structure matches CourseDetail interface
            const courseData = data as unknown as CourseDetail;

            const formattedAssignments = (courseData.assignments || []).map((a) => ({
                ...a,
                rubric: a.rubric || [],
            })) as Assignment[];

            return {
                ...courseData,
                teacher: teacherProfile,
                assignments: formattedAssignments,
            } as unknown as CourseDetail;
        },
        enabled: !!user && !!courseId,
    });

    // Real-time subscriptions for all related tables
    useEffect(() => {
        if (!user || !courseId) return;

        const tables = ['courses', 'exams', 'assignments', 'course_materials', 'announcements'];
        const channels = tables.map(table => {
            return supabase
                .channel(`${table}-detail-changes-${courseId}`)
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: table,
                        filter: table === 'courses' ? `id=eq.${courseId}` : `course_id=eq.${courseId}`
                    },
                    () => {
                        queryClient.invalidateQueries({ queryKey: ['course-detail', courseId] });
                    }
                )
                .subscribe();
        });

        return () => {
            channels.forEach(channel => supabase.removeChannel(channel));
        };
    }, [user, courseId, queryClient]);

    return { courseDetail, isLoading, error };
}

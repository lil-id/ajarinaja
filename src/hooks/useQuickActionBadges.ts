import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface QuickActionBadge {
    calendar: number; // upcoming deadlines count
    students: number; // total UNIQUE students count
    analytics: number; // total courses count (or active courses)
}

export function useQuickActionBadges() {
    return useQuery({
        queryKey: ['quickActionBadges'],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // Get teacher's courses
            const { data: courses } = await supabase
                .from('courses')
                .select('id')
                .eq('teacher_id', user.id);

            const courseIds = courses?.map(c => c.id) || [];

            if (courseIds.length === 0) {
                return {
                    calendar: 0,
                    students: 0,
                    analytics: 0,
                };
            }

            // Calendar badge: Count upcoming deadlines (assignments + exams)
            const { data: upcomingAssignments } = await supabase
                .from('assignments')
                .select('id')
                .in('course_id', courseIds)
                .gte('due_date', new Date().toISOString());

            const { data: upcomingExams } = await supabase
                .from('exams')
                .select('id')
                .in('course_id', courseIds)
                .gte('end_date', new Date().toISOString());

            const upcomingDeadlines =
                (upcomingAssignments?.length || 0) + (upcomingExams?.length || 0);

            // Students badge: Count UNIQUE students across all courses
            // Use distinct to avoid counting same student multiple times
            const { data: enrollments } = await supabase
                .from('enrollments')
                .select('student_id')
                .in('course_id', courseIds);

            // Get unique student IDs
            const uniqueStudentIds = new Set(enrollments?.map(e => e.student_id) || []);
            const totalUniqueStudents = uniqueStudentIds.size;

            // Analytics badge: Number of active/published courses
            const { count: activeCourses } = await supabase
                .from('courses')
                .select('*', { count: 'exact', head: true })
                .eq('teacher_id', user.id)
                .eq('status', 'published');

            return {
                calendar: upcomingDeadlines,
                students: totalUniqueStudents,
                analytics: activeCourses || 0,
            };
        },
    });
}

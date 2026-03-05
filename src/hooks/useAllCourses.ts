/**
 * @fileoverview Hook for fetching all courses across all teachers (operator only)
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { toast } from 'sonner';
import i18next from 'i18next';

export interface CourseWithTeacher {
    id: string;
    title: string;
    description: string | null;
    status: string;
    thumbnail_url: string | null;
    teacher_id: string;
    period_id: string | null;
    created_at: string;
    teacher_name: string | null;
    teacher_email: string | null;
    period_name: string | null;
    enrollment_count: number;
}

/**
 * Fetches all courses from all teachers. Operator-only.
 * Casts Supabase query result to `any` because period_id migration may not
 * yet be reflected in generated types.
 */
export function useAllCourses() {
    const { role } = useAuth();

    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ['all-courses-operator'],
        queryFn: async (): Promise<CourseWithTeacher[]> => {
            const { data: rawCourses, error } = await supabase
                .from('courses')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            const courses = (rawCourses || []) as unknown as {
                id: string; title: string; description: string | null; status: string;
                thumbnail_url: string | null; teacher_id: string; period_id: string | null;
                created_at: string;
            }[];
            if (courses.length === 0) return [];

            const teacherIds = [...new Set<string>(courses.map(c => c.teacher_id))];
            const periodIds = [...new Set<string>(courses.map(c => c.period_id).filter(Boolean))];

            const [{ data: teachers }, periodsResult, { data: enrollments }] = await Promise.all([
                supabase.from('profiles').select('user_id, name, email').in('user_id', teacherIds),
                periodIds.length > 0
                    ? supabase.from('academic_periods').select('id, name').in('id', periodIds)
                    : Promise.resolve({ data: [] as { id: string; name: string }[] }),
                supabase.from('enrollments').select('course_id'),
            ]);

            const teacherMap = new Map<string, { name: string | null; email: string | null }>(
                teachers?.map(t => [t.user_id, { name: t.name, email: t.email }]) || []
            );
            const periodMap = new Map<string, { name: string }>(
                (periodsResult.data || []).map((p: { id: string; name: string }) => [p.id, { name: p.name }])
            );

            // Count enrollments per course
            const enrollmentCount = new Map<string, number>();
            enrollments?.forEach(e => {
                enrollmentCount.set(e.course_id, (enrollmentCount.get(e.course_id) || 0) + 1);
            });

            return courses.map(course => ({
                id: course.id,
                title: course.title,
                description: course.description,
                status: course.status,
                thumbnail_url: course.thumbnail_url,
                teacher_id: course.teacher_id,
                period_id: course.period_id ?? null,
                created_at: course.created_at,
                teacher_name: teacherMap.get(course.teacher_id)?.name ?? null,
                teacher_email: teacherMap.get(course.teacher_id)?.email ?? null,
                period_name: course.period_id ? (periodMap.get(course.period_id)?.name ?? null) : null,
                enrollment_count: enrollmentCount.get(course.id) || 0,
            }));
        },
        enabled: role === 'operator',
    });

    const reassignCourseTeacher = useMutation({
        mutationFn: async ({ courseId, teacherId }: { courseId: string; teacherId: string }) => {
            const { data, error } = await supabase
                .from('courses')
                .update({ teacher_id: teacherId })
                .eq('id', courseId)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['all-courses-operator'] });
            toast.success(i18next.t('toast.courseTeacherUpdated'));
        },
        onError: (error: Error) => {
            console.error('[useAllCourses] reassignCourseTeacher error:', error);
            toast.error(error.message || i18next.t('toast.errorOccurred'));
        },
    });

    return {
        courses: query.data || [],
        isLoading: query.isLoading,
        error: query.error,
        reassignCourseTeacher,
    };
}

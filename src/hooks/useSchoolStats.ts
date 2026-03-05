/**
 * @fileoverview Hook for fetching school-wide aggregate statistics (operator only)
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/hooks/useAuth';

export interface SchoolStats {
    totalTeachers: number;
    totalStudents: number;
    totalCourses: number;
    totalEnrollments: number;
    activePeriodName: string | null;
}

/**
 * Fetches aggregate school-wide statistics. Operator-only.
 */
export function useSchoolStats() {
    const { role } = useAuth();

    const query = useQuery({
        queryKey: ['school-stats-operator'],
        queryFn: async (): Promise<SchoolStats> => {
            const [
                { data: teacherRoles },
                { data: studentRoles },
                { count: courseCount },
                { count: enrollmentCount },
                { data: periods },
            ] = await Promise.all([
                supabase.from('user_roles').select('user_id').eq('role', 'teacher'),
                supabase.from('user_roles').select('user_id').eq('role', 'student'),
                supabase.from('courses').select('id', { count: 'exact', head: true }),
                supabase.from('enrollments').select('id', { count: 'exact', head: true }),
                supabase.from('academic_periods').select('name').eq('is_active', true).limit(1),
            ]);

            return {
                totalTeachers: teacherRoles?.length ?? 0,
                totalStudents: studentRoles?.length ?? 0,
                totalCourses: courseCount ?? 0,
                totalEnrollments: enrollmentCount ?? 0,
                activePeriodName: periods?.[0]?.name ?? null,
            };
        },
        enabled: role === 'operator',
    });

    return {
        stats: query.data,
        isLoading: query.isLoading,
        error: query.error,
    };
}

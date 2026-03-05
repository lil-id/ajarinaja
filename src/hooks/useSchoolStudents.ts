/**
 * @fileoverview Hook for fetching all student profiles (operator only)
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/hooks/useAuth';

export interface SchoolStudent {
    user_id: string;
    name: string;
    email: string;
    avatar_url: string | null;
    enrollment_count: number;
}

/**
 * Fetches all student profiles for the school. Operator-only.
 */
export function useSchoolStudents() {
    const { role } = useAuth();

    const query = useQuery({
        queryKey: ['school-students-operator'],
        queryFn: async (): Promise<SchoolStudent[]> => {
            // Get all student user IDs
            const { data: studentRoles, error: rolesError } = await supabase
                .from('user_roles')
                .select('user_id')
                .eq('role', 'student');

            if (rolesError) throw rolesError;
            if (!studentRoles || studentRoles.length === 0) return [];

            const studentIds = studentRoles.map(r => r.user_id);

            const [{ data: profiles }, { data: enrollments }] = await Promise.all([
                supabase
                    .from('profiles')
                    .select('user_id, name, email, avatar_url')
                    .in('user_id', studentIds),
                supabase
                    .from('enrollments')
                    .select('student_id')
                    .in('student_id', studentIds),
            ]);

            const enrollmentCount = new Map<string, number>();
            enrollments?.forEach(e => {
                enrollmentCount.set(e.student_id, (enrollmentCount.get(e.student_id) || 0) + 1);
            });

            return (profiles || []).map(p => ({
                ...p,
                enrollment_count: enrollmentCount.get(p.user_id) || 0,
            }));
        },
        enabled: role === 'operator',
    });

    return {
        students: query.data || [],
        isLoading: query.isLoading,
        error: query.error,
    };
}

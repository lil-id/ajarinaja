import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useSchoolStats } from './useSchoolStats';
import { toast } from 'sonner';
import i18next from 'i18next';
import type { SchoolClass } from './useClasses';

/**
 * Hook to manage the student's self-enrollment status and process.
 * Used primarily for the Onboarding Blocker.
 */
export function useStudentEnrolledClass() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // Re-use existing logic to find the active period (useSchoolStats usually fetches active period ID, 
    // but a targeted query is safer since useSchoolStats is meant for dashboard).
    // Let's query academic_periods for the active one directly.
    const activePeriodQuery = useQuery({
        queryKey: ['active-period'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('academic_periods')
                .select('id, name')
                .eq('is_active', true)
                .single();

            if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
            return data;
        },
    });

    const activePeriodId = activePeriodQuery.data?.id;

    // Fetch classes for the active period to populate the onboarding dropdown
    const availableClassesQuery = useQuery({
        queryKey: ['available-classes', activePeriodId],
        queryFn: async () => {
            if (!activePeriodId) return [];
            const { data, error } = await supabase
                .from('classes')
                .select('*')
                .eq('academic_year_id', activePeriodId)
                .order('name', { ascending: true });

            if (error) throw error;
            return data as SchoolClass[];
        },
        enabled: !!activePeriodId,
    });

    // Check if the current student is already enrolled in a class for the active period
    const enrolledStatusQuery = useQuery({
        queryKey: ['student-enrolled-status', user?.id, activePeriodId],
        queryFn: async () => {
            if (!user?.id || !activePeriodId) return null;

            const { data, error } = await supabase
                .from('class_students')
                .select(`
                    id,
                    class_id,
                    classes!inner(academic_year_id, name)
                `)
                .eq('student_id', user.id)
                .eq('classes.academic_year_id', activePeriodId)
                .maybeSingle();

            if (error) throw error;
            return data;
        },
        enabled: !!user?.id && !!activePeriodId,
    });

    const enrollMutation = useMutation({
        mutationFn: async (classId: string) => {
            // Call the secure RPC function to bypass RLS restrictions
            const { error: rpcError } = await supabase.rpc('enroll_student_in_class', {
                p_class_id: classId
            });

            if (rpcError) throw rpcError;
            return true;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['student-enrolled-status'] });
            toast.success(i18next.t('onboarding.successTitle'), {
                description: i18next.t('onboarding.successDesc')
            });
        },
        onError: (error: Error) => {
            toast.error(i18next.t('onboarding.errorTitle'), {
                description: error.message
            });
        }
    });

    const isLoading = activePeriodQuery.isLoading || availableClassesQuery.isLoading || enrolledStatusQuery.isLoading;

    return {
        activePeriod: activePeriodQuery.data,
        availableClasses: availableClassesQuery.data || [],
        isEnrolled: !!enrolledStatusQuery.data,
        enrollmentData: enrolledStatusQuery.data,
        isLoading,
        enrollInClass: enrollMutation
    };
}

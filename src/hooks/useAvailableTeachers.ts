import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AvailableTeacher {
    id: string;
    name: string;
    avatar_url: string | null;
    is_same_subject: boolean;
}

interface UseAvailableTeachersArgs {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    subjectId?: string | null;
    enabled?: boolean;
}

/**
 * Hook to fetch available substitute teachers who do not have an overlapping class schedule
 * at the specified time slot.
 * 
 * Note: startTime and endTime must be in 'HH:mm:ss' or 'HH:mm' format compatible with Postgres TIME.
 */
export function useAvailableTeachers({
    dayOfWeek,
    startTime,
    endTime,
    subjectId,
    enabled = true
}: UseAvailableTeachersArgs) {
    return useQuery({
        queryKey: ['available-teachers', dayOfWeek, startTime, endTime, subjectId],
        queryFn: async () => {
            if (dayOfWeek === undefined || !startTime || !endTime) return [];

            const { data, error } = await supabase.rpc('get_available_substitute_teachers', {
                p_day_of_week: dayOfWeek as any,
                p_start_time: startTime,
                p_end_time: endTime,
                p_subject_id: (subjectId || null) as any
            });

            if (error) throw error;
            return data as AvailableTeacher[];
        },
        enabled: enabled && !!dayOfWeek && !!startTime && !!endTime,
        staleTime: 60 * 1000, // Cache for 1 minute before refetching availability
    });
}

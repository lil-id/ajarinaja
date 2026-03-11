import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { toast } from 'sonner';
import i18next from 'i18next';

export const DAY_LABELS: Record<number, string> = {
    1: 'common.days.monday',
    2: 'common.days.tuesday',
    3: 'common.days.wednesday',
    4: 'common.days.thursday',
    5: 'common.days.friday',
    6: 'common.days.saturday',
    7: 'common.days.sunday',
};

export interface ClassSchedule {
    id: string;
    class_id: string;
    course_id: string;
    teacher_id: string | null; // null = UNASSIGNED (triggers alert)
    day_of_week: number;
    start_time: string;
    end_time: string;
    room: string | null;
    created_at: string;
    updated_at: string;
    // Joined
    class?: { name: string; grade_level: number };
    course?: { title: string };
    teacher?: { name: string; email: string } | null;
}

export interface CreateScheduleData {
    class_id: string;
    course_id: string;
    teacher_id?: string | null;
    day_of_week: number;
    start_time: string;
    end_time: string;
    room?: string | null;
}

export interface UpdateScheduleData extends Partial<CreateScheduleData> {
    id: string;
}

/**
 * Hook to manage class schedules (Jadwal Pelajaran).
 * Supports filtering by class or fetching all for operator view.
 */
export function useSchedules(classId?: string) {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const schedulesQuery = useQuery({
        queryKey: ['class-schedules', classId],
        queryFn: async () => {
            let query = supabase
                .from('class_schedules')
                .select(`
          *,
          class:class_id(name, grade_level),
          course:course_id(title),
          teacher:teacher_id(name, email)
        `)
                .order('day_of_week', { ascending: true })
                .order('start_time', { ascending: true });

            if (classId) {
                query = query.eq('class_id', classId);
            }

            const { data, error } = await query;
            if (error) throw error;
            return (data || []) as ClassSchedule[];
        },
        enabled: !!user,
    });

    const createSchedule = useMutation({
        mutationFn: async (scheduleData: CreateScheduleData) => {
            const { data, error } = await supabase
                .from('class_schedules')
                .insert(scheduleData)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['class-schedules'] });
            toast.success(i18next.t('operator.schedules.scheduleCreated'));
        },
        onError: (error: Error) => {
            toast.error(`${i18next.t('operator.schedules.failedToCreateSchedule')}: ${error.message}`);
        },
    });

    const updateSchedule = useMutation({
        mutationFn: async ({ id, ...updates }: UpdateScheduleData) => {
            const { data, error } = await supabase
                .from('class_schedules')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['class-schedules'] });
            toast.success(i18next.t('operator.schedules.scheduleUpdated'));
        },
        onError: (error: Error) => {
            toast.error(`${i18next.t('operator.schedules.failedToUpdateSchedule')}: ${error.message}`);
        },
    });

    const deleteSchedule = useMutation({
        mutationFn: async (scheduleId: string) => {
            const { error } = await supabase
                .from('class_schedules')
                .delete()
                .eq('id', scheduleId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['class-schedules'] });
            toast.success(i18next.t('operator.schedules.scheduleDeleted'));
        },
        onError: (error: Error) => {
            toast.error(`${i18next.t('operator.schedules.failedToDeleteSchedule')}: ${error.message}`);
        },
    });

    return {
        schedules: schedulesQuery.data || [],
        isLoading: schedulesQuery.isLoading,
        error: schedulesQuery.error,
        createSchedule,
        updateSchedule,
        deleteSchedule,
    };
}

/**
 * Hook to fetch unassigned schedules (teacher_id IS NULL) for operational alerts.
 */
export function useUnassignedSchedules() {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['unassigned-schedules'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('class_schedules')
                .select(`
          *,
          class:class_id(name, grade_level),
          course:course_id(title)
        `)
                .is('teacher_id', null)
                .order('day_of_week', { ascending: true });

            if (error) throw error;
            return (data || []) as ClassSchedule[];
        },
        enabled: !!user,
    });
}

/**
 * Hook to update an existing class schedule (e.g., assigning a substitute teacher).
 */
export function useUpdateSchedule() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<UpdateScheduleData> }) => {
            const { data, error } = await supabase
                .from('class_schedules')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['class-schedules'] });
            queryClient.invalidateQueries({ queryKey: ['unassigned-schedules'] });
            queryClient.invalidateQueries({ queryKey: ['teacher-availability'] });
        },
    });
}

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ClassSchedule } from './useSchedules';

/**
 * Hook to manage class schedules (Jadwal Mengajar) specifically for the logged-in teacher.
 * This filters the `class_schedules` table by `teacher_id = user.id`.
 */
export function useTeacherSchedules() {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['teacher-schedules', user?.id],
        queryFn: async () => {
            if (!user?.id) throw new Error("No user ID found");

            const { data, error } = await supabase
                .from('class_schedules')
                .select(`
                    *,
                    class:class_id(name, grade_level),
                    course:course_id(title)
                `)
                .eq('teacher_id', user.id)
                .order('day_of_week', { ascending: true })
                .order('start_time', { ascending: true });

            if (error) throw error;
            return (data || []) as ClassSchedule[];
        },
        enabled: !!user,
    });
}

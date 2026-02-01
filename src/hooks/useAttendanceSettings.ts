import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { AttendanceSettings } from '@/types/attendance';

// Get attendance settings for a course
export function useAttendanceSettings(courseId: string) {
    return useQuery({
        queryKey: ['attendance-settings', courseId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('course_attendance_settings')
                .select('*')
                .eq('course_id', courseId)
                .single();

            if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found, which is ok
            return data as AttendanceSettings | null;
        },
        enabled: !!courseId,
    });
}

// Create or update attendance settings
export function useUpdateAttendanceSettings() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (settings: AttendanceSettings) => {
            const { data, error } = await supabase
                .from('course_attendance_settings')
                .upsert(settings)
                .select()
                .single();

            if (error) throw error;
            return data as AttendanceSettings;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['attendance-settings', data.course_id] });
        },
    });
}

// Get default settings
export function getDefaultAttendanceSettings(courseId: string): AttendanceSettings {
    return {
        course_id: courseId,
        grace_period_minutes: 5,
        late_window_minutes: 10,
        weight_in_grade: 10.0,
        minimum_percentage: 75.0,
        calculation_method: 'simple',
        scoring: {
            present: 100,
            late: 80,
            excused: 60,
            sick: 60,
            absent: 0,
        },
    };
}

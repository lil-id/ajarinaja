import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CourseSchedule {
    course_id: string;
    class_id: string;
}

/**
 * Fetches all class_schedules to determine which courses are restricted to which classes.
 */
export function useAllCourseSchedules() {
    return useQuery({
        queryKey: ['all-course-schedules'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('class_schedules')
                .select('course_id, class_id');

            if (error) throw error;
            return (data || []) as CourseSchedule[];
        },
        // Cache for a long time since schedules don't change by the second
        staleTime: 1000 * 60 * 5,
    });
}

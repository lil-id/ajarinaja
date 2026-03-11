import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/hooks/useAuth';

export interface TeacherClass {
    id: string;
    name: string;
    grade_level: number;
}

/**
 * Hook to fetch all classes associated with the current teacher for a specific course.
 * Uses the class_schedules table to find the mapping.
 */
export function useTeacherCourseClasses(courseId?: string) {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['teacher-course-classes', user?.id, courseId],
        queryFn: async () => {
            if (!user?.id || !courseId) return [];

            const { data, error } = await supabase
                .from('class_schedules')
                .select(`
          class:class_id (
            id,
            name,
            grade_level
          )
        `)
                .eq('course_id', courseId)
                .eq('teacher_id', user.id);

            if (error) throw error;

            // Deduplicate classes (a teacher might have multiple schedules for the same class/course)
            const classesMap = new Map<string, TeacherClass>();

            (data || []).forEach((item: any) => {
                if (item.class) {
                    classesMap.set(item.class.id, item.class);
                }
            });

            return Array.from(classesMap.values());
        },
        enabled: !!user?.id && !!courseId,
    });
}

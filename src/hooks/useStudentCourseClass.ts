import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/hooks/useAuth';

export function useStudentCourseClass(courseId?: string) {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['student-course-class', user?.id, courseId],
        queryFn: async () => {
            if (!user?.id || !courseId) return null;

            // 1. Get all classes the student is in
            const { data: studentClasses, error: studentError } = await supabase
                .from('class_students')
                .select('class_id')
                .eq('student_id', user.id);

            if (studentError) throw studentError;
            if (!studentClasses || studentClasses.length === 0) return null;

            const classIds = studentClasses.map(sc => sc.class_id);

            // 2. Find which of these classes is for this course
            const { data: schedule, error: scheduleError } = await supabase
                .from('class_schedules')
                .select(`
          class_id,
          class:classes (
            id,
            name,
            grade_level
          )
        `)
                .in('class_id', classIds)
                .eq('course_id', courseId)
                .maybeSingle();

            if (scheduleError) throw scheduleError;

            return schedule?.class || null;
        },
        enabled: !!user?.id && !!courseId,
    });
}

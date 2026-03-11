import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/hooks/useAuth';

export interface StudentClassInfo {
    class_id: string;
    course_id: string;
    class_name: string;
}

export function useStudentClasses() {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['student-classes', user?.id],
        queryFn: async () => {
            if (!user?.id) return { studentClassInfos: [], enrolledClassIds: [] };

            // 1. Get all classes the student is in
            const { data: studentClasses, error: studentError } = await supabase
                .from('class_students')
                .select('class_id')
                .eq('student_id', user.id);

            if (studentError) throw studentError;
            if (!studentClasses || studentClasses.length === 0) return { studentClassInfos: [], enrolledClassIds: [] };

            const enrolledClassIds = studentClasses.map(sc => sc.class_id);

            // 2. Map these classes to courses (via schedules)
            const { data: schedules, error: scheduleError } = await supabase
                .from('class_schedules')
                .select(`
          class_id,
          course_id,
          class:classes (
            name
          )
        `)
                .in('class_id', enrolledClassIds);

            if (scheduleError) throw scheduleError;

            const studentClassInfos = (schedules || []).map((s) => ({
                class_id: s.class_id,
                course_id: s.course_id,
                class_name: (s.class as { name: string })?.name || 'Unknown Class'
            }));

            return { studentClassInfos, enrolledClassIds };
        },
        enabled: !!user?.id,
    });
}

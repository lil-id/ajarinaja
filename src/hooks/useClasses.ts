import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { toast } from 'sonner';
import i18next from 'i18next';

export interface SchoolClass {
    id: string;
    name: string;
    grade_level: number;
    homeroom_teacher_id: string | null;
    academic_year_id: string | null;
    created_at: string;
    updated_at: string;
    // Joined fields (optional)
    homeroom_teacher?: { name: string; email: string };
    academic_period?: { name: string };
    student_count?: number;
}

export interface CreateClassData {
    name: string;
    grade_level: number;
    homeroom_teacher_id?: string | null;
    academic_year_id?: string | null;
}

export interface UpdateClassData extends Partial<CreateClassData> {
    id: string;
}

/**
 * Hook to manage school classes (Rombongan Belajar).
 * Provides CRUD operations and list of all classes scoped to the operator.
 */
export function useClasses(academic_year_id?: string) {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const classesQuery = useQuery({
        queryKey: ['classes', academic_year_id],
        queryFn: async () => {
            let query = supabase
                .from('classes')
                .select(`
          *,
          homeroom_teacher:homeroom_teacher_id(name, email),
          academic_period:academic_year_id(name),
          student_count:class_students(count)
        `)
                .order('grade_level', { ascending: true })
                .order('name', { ascending: true });

            if (academic_year_id) {
                query = query.eq('academic_year_id', academic_year_id);
            }

            const { data, error } = await query;
            if (error) throw error;

            return (data || []).map((c) => ({
                ...c,
                student_count: (c.student_count as unknown as { count: number }[])?.[0]?.count ?? 0,
            })) as SchoolClass[];
        },
        enabled: !!user,
    });

    const createClass = useMutation({
        mutationFn: async (classData: CreateClassData) => {
            const { data, error } = await supabase
                .from('classes')
                .insert(classData)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['classes'] });
            toast.success(i18next.t('operator.classes.classCreated'));
        },
        onError: (error: Error) => {
            toast.error(`${i18next.t('operator.classes.failedToCreateClass')}: ${error.message}`);
        },
    });

    const updateClass = useMutation({
        mutationFn: async ({ id, ...updates }: UpdateClassData) => {
            const { data, error } = await supabase
                .from('classes')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['classes'] });
            toast.success(i18next.t('operator.classes.classUpdated'));
        },
        onError: (error: Error) => {
            toast.error(`${i18next.t('operator.classes.failedToUpdateClass')}: ${error.message}`);
        },
    });

    const deleteClass = useMutation({
        mutationFn: async (classId: string) => {
            const { error } = await supabase
                .from('classes')
                .delete()
                .eq('id', classId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['classes'] });
            toast.success(i18next.t('operator.classes.classDeleted'));
        },
        onError: (error: Error) => {
            toast.error(`${i18next.t('operator.classes.failedToDeleteClass')}: ${error.message}`);
        },
    });

    return {
        classes: classesQuery.data || [],
        isLoading: classesQuery.isLoading,
        error: classesQuery.error,
        createClass,
        updateClass,
        deleteClass,
    };
}

// ─── Class Students ───────────────────────────────────────────────────────────

export interface ClassStudent {
    id: string;
    class_id: string;
    student_id: string;
    created_at: string;
    // Joined
    student?: { name: string; email: string; avatar_url: string | null };
}

/**
 * Hook to manage student membership within a class.
 */
export function useClassStudents(classId?: string) {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const studentsQuery = useQuery({
        queryKey: ['class-students', classId],
        queryFn: async () => {
            if (!classId) return [];
            const { data, error } = await supabase
                .from('class_students')
                .select(`
          *,
          student:student_id(name, email, avatar_url)
        `)
                .eq('class_id', classId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            return (data || []) as ClassStudent[];
        },
        enabled: !!user && !!classId,
    });

    const addStudent = useMutation({
        mutationFn: async ({ classId: cid, studentId }: { classId: string; studentId: string }) => {
            const { data, error } = await supabase
                .from('class_students')
                .insert({ class_id: cid, student_id: studentId })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['class-students', classId] });
            queryClient.invalidateQueries({ queryKey: ['classes'] });
            toast.success(i18next.t('operator.classes.studentAdded'));
        },
        onError: (error: Error) => {
            toast.error(`${i18next.t('operator.classes.failedToAddStudent')}: ${error.message}`);
        },
    });

    const removeStudent = useMutation({
        mutationFn: async (membershipId: string) => {
            const { error } = await supabase
                .from('class_students')
                .delete()
                .eq('id', membershipId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['class-students', classId] });
            queryClient.invalidateQueries({ queryKey: ['classes'] });
            toast.success(i18next.t('operator.classes.studentRemoved'));
        },
        onError: (error: Error) => {
            toast.error(`${i18next.t('operator.classes.failedToRemoveStudent')}: ${error.message}`);
        },
    });

    return {
        students: studentsQuery.data || [],
        isLoading: studentsQuery.isLoading,
        addStudent,
        removeStudent,
    };
}

/**
 * Hook to check if current teacher is a homeroom teacher (Wali Kelas)
 * for any class in the active period.
 */
export function useHomeroomClass() {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['homeroom-class', user?.id],
        queryFn: async () => {
            if (!user) return null;

            const { data, error } = await supabase
                .from('classes')
                .select('*')
                .eq('homeroom_teacher_id', user.id)
                .maybeSingle();

            if (error) throw error;
            return data as SchoolClass | null;
        },
        enabled: !!user,
    });
}

/**
 * Hook to get all classes where current teacher is a homeroom teacher (Wali Kelas)
 * for a specific academic period.
 */
export function useHomeroomClassesByPeriod(periodId: string) {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['homeroom-classes', user?.id, periodId],
        queryFn: async () => {
            if (!user || !periodId) return [];

            const { data, error } = await supabase
                .from('classes')
                .select('*')
                .eq('homeroom_teacher_id', user.id)
                .eq('academic_year_id', periodId);

            if (error) throw error;
            return data as SchoolClass[];
        },
        enabled: !!user && !!periodId,
    });
}

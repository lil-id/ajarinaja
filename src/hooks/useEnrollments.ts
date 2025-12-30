import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

export interface Enrollment {
  id: string;
  student_id: string;
  course_id: string;
  enrolled_at: string;
}

export interface EnrollmentWithStudent extends Enrollment {
  student: {
    user_id: string;
    name: string;
    email: string;
    avatar_url: string | null;
  };
}

export function useEnrollments() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: enrollments = [], isLoading, error } = useQuery({
    queryKey: ['enrollments', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('enrollments')
        .select('*')
        .eq('student_id', user.id);
      
      if (error) throw error;
      return data as Enrollment[];
    },
    enabled: !!user,
  });

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('enrollments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'enrollments',
          filter: `student_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['enrollments', user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  return { enrollments, isLoading, error };
}

export function useCourseEnrollments(courseId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: enrollments = [], isLoading, error } = useQuery({
    queryKey: ['course-enrollments', courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          id,
          student_id,
          course_id,
          enrolled_at
        `)
        .eq('course_id', courseId)
        .order('enrolled_at', { ascending: false });
      
      if (error) throw error;

      // Fetch student profiles
      if (data.length === 0) return [];
      
      const studentIds = data.map(e => e.student_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, name, email, avatar_url')
        .in('user_id', studentIds);
      
      if (profilesError) throw profilesError;

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      
      return data.map(enrollment => ({
        ...enrollment,
        student: profileMap.get(enrollment.student_id) || {
          user_id: enrollment.student_id,
          name: 'Unknown Student',
          email: '',
          avatar_url: null
        }
      })) as EnrollmentWithStudent[];
    },
    enabled: !!user && !!courseId,
  });

  // Real-time subscription
  useEffect(() => {
    if (!user || !courseId) return;

    const channel = supabase
      .channel(`course-enrollments-${courseId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'enrollments',
          filter: `course_id=eq.${courseId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['course-enrollments', courseId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, courseId, queryClient]);

  return { enrollments, isLoading, error };
}

export function useAllStudents() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['all-students'],
    queryFn: async () => {
      // Get all profiles that have a student role
      const { data: studentRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'student');
      
      if (rolesError) throw rolesError;
      
      if (!studentRoles || studentRoles.length === 0) return [];
      
      const studentUserIds = studentRoles.map(r => r.user_id);
      
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, name, email, avatar_url')
        .in('user_id', studentUserIds);
      
      if (profilesError) throw profilesError;
      
      return profiles || [];
    },
    enabled: !!user,
  });
}

export function useEnroll() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (courseId: string) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('enrollments')
        .insert({
          student_id: user.id,
          course_id: courseId,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
}

export function useTeacherEnrollStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ studentId, courseId }: { studentId: string; courseId: string }) => {
      const { data, error } = await supabase
        .from('enrollments')
        .insert({
          student_id: studentId,
          course_id: courseId,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['course-enrollments', variables.courseId] });
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
    },
  });
}

export function useTeacherUnenrollStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ enrollmentId, courseId }: { enrollmentId: string; courseId: string }) => {
      const { error } = await supabase
        .from('enrollments')
        .delete()
        .eq('id', enrollmentId);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['course-enrollments', variables.courseId] });
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
    },
  });
}

export function useTeacherUnenrollAllStudents() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (courseId: string) => {
      const { error } = await supabase
        .from('enrollments')
        .delete()
        .eq('course_id', courseId);
      
      if (error) throw error;
    },
    onSuccess: (_, courseId) => {
      queryClient.invalidateQueries({ queryKey: ['course-enrollments', courseId] });
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
    },
  });
}

export function useUnenroll() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (courseId: string) => {
      if (!user) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('enrollments')
        .delete()
        .eq('student_id', user.id)
        .eq('course_id', courseId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
    },
  });
}

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

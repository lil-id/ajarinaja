import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

export interface Badge {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  is_preset: boolean;
  created_by: string | null;
  created_at: string;
}

export interface StudentBadge {
  id: string;
  student_id: string;
  badge_id: string;
  exam_id: string | null;
  submission_id: string | null;
  awarded_by: string;
  awarded_at: string;
  badge?: Badge;
}

export function useBadges() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['badges'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('badges')
        .select('*')
        .order('is_preset', { ascending: false })
        .order('name');
      
      if (error) throw error;
      return data as Badge[];
    },
    enabled: !!user,
  });
}

export function useStudentBadges(studentId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['student-badges', studentId],
    queryFn: async () => {
      let query = supabase
        .from('student_badges')
        .select('*, badge:badges(*)');
      
      if (studentId) {
        query = query.eq('student_id', studentId);
      }
      
      const { data, error } = await query.order('awarded_at', { ascending: false });
      
      if (error) throw error;
      return data as (StudentBadge & { badge: Badge })[];
    },
    enabled: !!user,
  });
}

export function useMyBadges() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-badges'],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('student_badges')
        .select('*, badge:badges(*)')
        .eq('student_id', user.id)
        .order('awarded_at', { ascending: false });
      
      if (error) throw error;
      return data as (StudentBadge & { badge: Badge })[];
    },
    enabled: !!user,
  });
}

export function useCreateBadge() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      name, 
      description, 
      icon, 
      color 
    }: { 
      name: string; 
      description?: string; 
      icon: string; 
      color: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('badges')
        .insert({
          name,
          description,
          icon,
          color,
          is_preset: false,
          created_by: user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['badges'] });
    },
  });
}

export function useAwardBadge() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      studentId, 
      badgeId, 
      examId,
      submissionId,
    }: { 
      studentId: string; 
      badgeId: string; 
      examId?: string;
      submissionId?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('student_badges')
        .insert({
          student_id: studentId,
          badge_id: badgeId,
          exam_id: examId,
          submission_id: submissionId,
          awarded_by: user.id,
        })
        .select('*, badge:badges(*)')
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-badges'] });
    },
  });
}

export function useRevokeBadge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (badgeAwardId: string) => {
      const { error } = await supabase
        .from('student_badges')
        .delete()
        .eq('id', badgeAwardId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-badges'] });
    },
  });
}

export function useDeleteBadge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (badgeId: string) => {
      const { error } = await supabase
        .from('badges')
        .delete()
        .eq('id', badgeId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['badges'] });
    },
  });
}

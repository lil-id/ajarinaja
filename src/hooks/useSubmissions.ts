import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

export interface ExamSubmission {
  id: string;
  exam_id: string;
  student_id: string;
  answers: Record<string, string | number>;
  score: number | null;
  graded: boolean;
  submitted_at: string;
}

export function useSubmissions(examId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: submissions = [], isLoading, error } = useQuery({
    queryKey: ['submissions', examId, user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      let query = supabase.from('exam_submissions').select('*');
      
      if (examId) {
        query = query.eq('exam_id', examId);
      }
      
      const { data, error } = await query.order('submitted_at', { ascending: false });
      
      if (error) throw error;
      return data as ExamSubmission[];
    },
    enabled: !!user,
  });

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('submissions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'exam_submissions',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['submissions'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  return { submissions, isLoading, error };
}

export function useMySubmission(examId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-submission', examId, user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('exam_submissions')
        .select('*')
        .eq('exam_id', examId)
        .eq('student_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as ExamSubmission | null;
    },
    enabled: !!user && !!examId,
  });
}

export function useSubmitExam() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      examId, 
      answers,
      score 
    }: { 
      examId: string; 
      answers: Record<string, string | number>;
      score?: number;
    }) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('exam_submissions')
        .insert({
          exam_id: examId,
          student_id: user.id,
          answers,
          score,
          graded: score !== undefined,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      queryClient.invalidateQueries({ queryKey: ['my-submission'] });
    },
  });
}

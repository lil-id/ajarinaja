import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Json } from '@/integrations/supabase/types';

export interface AssignmentQuestion {
  id: string;
  assignment_id: string;
  type: string;
  question: string;
  options: string[] | null;
  correct_answer: number | null;
  correct_answers: number[] | null;
  points: number;
  order_index: number;
  created_at: string;
}

export function useAssignmentQuestions(assignmentId: string) {
  return useQuery({
    queryKey: ['assignment-questions', assignmentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assignment_questions')
        .select('*')
        .eq('assignment_id', assignmentId)
        .order('order_index', { ascending: true });
      
      if (error) throw error;
      return (data || []).map(q => ({
        ...q,
        options: q.options as string[] | null,
      })) as AssignmentQuestion[];
    },
    enabled: !!assignmentId,
  });
}

export function useAddAssignmentQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      assignmentId,
      type,
      question,
      options,
      correct_answer,
      correct_answers,
      points,
      order_index,
    }: {
      assignmentId: string;
      type: string;
      question: string;
      options: string[] | null;
      correct_answer: number | null;
      correct_answers: number[] | null;
      points: number;
      order_index: number;
    }) => {
      const { data, error } = await supabase
        .from('assignment_questions')
        .insert({
          assignment_id: assignmentId,
          type,
          question,
          options: options as unknown as Json,
          correct_answer,
          correct_answers,
          points,
          order_index,
        })
        .select()
        .single();
      
      if (error) throw error;
      return {
        ...data,
        options: data.options as string[] | null,
      } as AssignmentQuestion;
    },
    onSuccess: (_, { assignmentId }) => {
      queryClient.invalidateQueries({ queryKey: ['assignment-questions', assignmentId] });
    },
  });
}

export function useUpdateAssignmentQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      assignmentId,
      ...updates
    }: Partial<AssignmentQuestion> & { id: string; assignmentId: string }) => {
      const { data, error } = await supabase
        .from('assignment_questions')
        .update({
          ...updates,
          options: updates.options as unknown as Json,
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, { assignmentId }) => {
      queryClient.invalidateQueries({ queryKey: ['assignment-questions', assignmentId] });
    },
  });
}

export function useDeleteAssignmentQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, assignmentId }: { id: string; assignmentId: string }) => {
      const { error } = await supabase
        .from('assignment_questions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: (_, { assignmentId }) => {
      queryClient.invalidateQueries({ queryKey: ['assignment-questions', assignmentId] });
    },
  });
}

import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Question } from './useExams';

/**
 * Mutation hook to update a specific question in an exam.
 * 
 * @returns {UseMutationResult} The mutation result.
 */
export function useUpdateQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      question,
      options,
      correct_answer,
      correct_answers,
      points,
      type
    }: Partial<Question> & { id: string }) => {
      const { data, error } = await supabase
        .from('questions')
        .update({ question, options, correct_answer, correct_answers, points, type })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['exam'] });
      queryClient.invalidateQueries({ queryKey: ['exams'] });
    },
  });
}

/**
 * Mutation hook to delete a question from an exam.
 * 
 * @returns {UseMutationResult} The mutation result.
 */
export function useDeleteQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam'] });
      queryClient.invalidateQueries({ queryKey: ['exams'] });
    },
  });
}

/**
 * Mutation hook to add a new question to an exam.
 * 
 * @returns {UseMutationResult} The mutation result.
 */
export function useAddQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      examId,
      question,
      options,
      correct_answer,
      correct_answers,
      points,
      type,
      order_index
    }: Omit<Question, 'id'> & { examId: string }) => {
      const { data, error } = await supabase
        .from('questions')
        .insert({
          exam_id: examId,
          question,
          options,
          correct_answer,
          correct_answers,
          points,
          type,
          order_index
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam'] });
      queryClient.invalidateQueries({ queryKey: ['exams'] });
    },
  });
}

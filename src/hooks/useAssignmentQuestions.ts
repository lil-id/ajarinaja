import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Json } from '@/integrations/supabase/types';

import { QuestionOption } from './useExams';

export interface AssignmentQuestion {
  id: string;
  assignment_id: string;
  type: string;
  question: string;
  image_url?: string | null;
  options: string[] | QuestionOption[] | null;
  correct_answer: number | null;
  correct_answers: number[] | null;
  points: number;
  order_index: number;
  created_at: string;
}

/**
 * Custom hook to fetch questions for a specific assignment.
 * 
 * @param {string} assignmentId - The ID of the assignment.
 * @returns {UseQueryResult} The query result containing assignment questions.
 */
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
        options: q.options as string[] | QuestionOption[] | null,
      })) as AssignmentQuestion[];
    },
    enabled: !!assignmentId,
  });
}

/**
 * Mutation hook to add a new question to an assignment.
 * 
 * @returns {UseMutationResult} The mutation result.
 */
export function useAddAssignmentQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      assignmentId,
      type,
      question,
      image_url,
      options,
      correct_answer,
      correct_answers,
      points,
      order_index,
    }: {
      assignmentId: string;
      type: string;
      question: string;
      image_url?: string | null;
      options: string[] | QuestionOption[] | null;
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
          image_url,
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
        options: data.options as string[] | QuestionOption[] | null,
      } as AssignmentQuestion;
    },
    onSuccess: (_, { assignmentId }) => {
      queryClient.invalidateQueries({ queryKey: ['assignment-questions', assignmentId] });
    },
  });
}

/**
 * Mutation hook to update an existing assignment question.
 * 
 * @returns {UseMutationResult} The mutation result.
 */
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
          image_url: updates.image_url,
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

/**
 * Mutation hook to delete an assignment question.
 * 
 * @returns {UseMutationResult} The mutation result.
 */
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

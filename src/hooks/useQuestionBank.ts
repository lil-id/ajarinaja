import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Json } from "@/integrations/supabase/types";
import { logger, generateCorrelationId } from "@/lib/logger";

import { QuestionOption } from './useExams';

export interface QuestionBankItem {
  id: string;
  teacher_id: string;
  course_id: string | null;
  category: string;
  question: string;
  image_url?: string | null;
  type: string;
  options: string[] | QuestionOption[] | null;
  correct_answer: number | null;
  correct_answers: number[] | null;
  points: number;
  tags: string[];
  used_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * Custom hook to fetch questions from the question bank.
 * 
 * @param {string} [courseId] - Filter by course ID.
 * @returns {UseQueryResult} The query result containing question bank items.
 */
export function useQuestionBank(courseId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["question-bank", courseId],
    queryFn: async () => {
      let query = supabase
        .from("question_bank")
        .select("*")
        .order("created_at", { ascending: false });

      if (courseId) {
        query = query.eq("course_id", courseId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(q => ({
        ...q,
        options: q.options as string[] | QuestionOption[] | null,
      })) as QuestionBankItem[];
    },
    enabled: !!user,
  });
}

/**
 * Custom hook to fetch unique categories from the question bank.
 * 
 * @returns {UseQueryResult} The query result containing categories.
 */
export function useQuestionBankCategories() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["question-bank-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("question_bank")
        .select("category");

      if (error) throw error;
      const categories = [...new Set(data.map((q) => q.category))];
      return categories.sort();
    },
    enabled: !!user,
  });
}

/**
 * Mutation hook to create a new question bank item.
 * 
 * @returns {UseMutationResult} The mutation result.
 */
export function useCreateQuestionBankItem() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (
      question: Omit<QuestionBankItem, "id" | "teacher_id" | "created_at" | "updated_at" | "used_count">
    ) => {
      const { data, error } = await supabase
        .from("question_bank")
        .insert({
          ...question,
          image_url: question.image_url,
          options: question.options as unknown as Json,
          teacher_id: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return {
        ...data,
        options: data.options as string[] | QuestionOption[] | null,
      } as QuestionBankItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["question-bank"] });
      queryClient.invalidateQueries({ queryKey: ["question-bank-categories"] });
    },
  });
}

/**
 * Mutation hook to update an existing question bank item.
 * 
 * @returns {UseMutationResult} The mutation result.
 */
export function useUpdateQuestionBankItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<QuestionBankItem> & { id: string }) => {
      const { data, error } = await supabase
        .from("question_bank")
        .update({
          ...updates,
          image_url: updates.image_url,
          options: updates.options as unknown as Json,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["question-bank"] });
      queryClient.invalidateQueries({ queryKey: ["question-bank-categories"] });
    },
  });
}

/**
 * Mutation hook to delete a question bank item.
 * 
 * @returns {UseMutationResult} The mutation result.
 */
export function useDeleteQuestionBankItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("question_bank")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["question-bank"] });
      queryClient.invalidateQueries({ queryKey: ["question-bank-categories"] });
    },
  });
}

/**
 * Mutation hook to increment the usage count of a question bank item.
 * 
 * @returns {UseMutationResult} The mutation result.
 */
export function useIncrementQuestionUsage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const correlationId = generateCorrelationId();
      const startTime = Date.now();

      logger.info('increment_question_usage', {
        correlationId,
        questionId: id
      }, 'Operation start');

      const { error } = await supabase.rpc('increment_question_usage', {
        p_question_id: id,
      });

      if (error) {
        logger.error('increment_question_usage', {
          correlationId,
          questionId: id,
          error: error.message,
          duration: Date.now() - startTime
        }, 'Operation failure');
        throw error;
      }

      logger.info('increment_question_usage', {
        correlationId,
        questionId: id,
        duration: Date.now() - startTime
      }, 'Operation success');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["question-bank"] });
    },
  });
}

/**
 * Mutation hook to save exam questions to the question bank.
 * 
 * @returns {UseMutationResult} The mutation result.
 */
export function useSaveExamQuestionsToBank() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      questions,
      courseId,
      category,
    }: {
      questions: Array<{
        question: string;
        image_url?: string | null;
        type: string;
        options?: string[] | QuestionOption[] | null;
        correct_answer?: number;
        correct_answers?: number[];
        points: number;
      }>;
      courseId: string;
      category: string;
    }) => {
      const correlationId = generateCorrelationId();
      const startTime = Date.now();

      logger.info('save_exam_questions_to_bank', {
        correlationId,
        userId: user?.id,
        courseId,
        questionCount: questions.length
      }, 'Operation start');

      const bankItems = questions.map((q) => ({
        teacher_id: user?.id,
        course_id: courseId,
        category,
        question: q.question,
        image_url: q.image_url,
        type: q.type,
        options: q.options ? (q.options as unknown as Json) : null,
        correct_answer: q.correct_answer ?? null,
        correct_answers: q.correct_answers ?? null,
        points: q.points,
        tags: [],
      }));

      const { data, error } = await supabase
        .from("question_bank")
        .insert(bankItems)
        .select();

      if (error) {
        logger.error('save_exam_questions_to_bank', {
          correlationId,
          userId: user?.id,
          error: error.message,
          duration: Date.now() - startTime
        }, 'Operation failure');
        throw error;
      }

      logger.info('save_exam_questions_to_bank', {
        correlationId,
        userId: user?.id,
        duration: Date.now() - startTime
      }, 'Operation success');

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["question-bank"] });
      queryClient.invalidateQueries({ queryKey: ["question-bank-categories"] });
    },
  });
}

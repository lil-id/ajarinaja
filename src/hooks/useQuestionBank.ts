import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface QuestionBankItem {
  id: string;
  teacher_id: string;
  course_id: string | null;
  category: string;
  question: string;
  type: string;
  options: string[] | null;
  correct_answer: number | null;
  correct_answers: number[] | null;
  points: number;
  tags: string[];
  used_count: number;
  created_at: string;
  updated_at: string;
}

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
      return data as QuestionBankItem[];
    },
    enabled: !!user,
  });
}

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
          teacher_id: user?.id,
        })
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

export function useUpdateQuestionBankItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<QuestionBankItem> & { id: string }) => {
      const { data, error } = await supabase
        .from("question_bank")
        .update(updates)
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

export function useIncrementQuestionUsage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: current, error: fetchError } = await supabase
        .from("question_bank")
        .select("used_count")
        .eq("id", id)
        .single();

      if (fetchError) throw fetchError;

      const { error } = await supabase
        .from("question_bank")
        .update({ used_count: (current?.used_count || 0) + 1 })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["question-bank"] });
    },
  });
}

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
        type: string;
        options?: string[];
        correct_answer?: number;
        correct_answers?: number[];
        points: number;
      }>;
      courseId: string;
      category: string;
    }) => {
      const bankItems = questions.map((q) => ({
        teacher_id: user?.id,
        course_id: courseId,
        category,
        question: q.question,
        type: q.type,
        options: q.options || null,
        correct_answer: q.correct_answer ?? null,
        correct_answers: q.correct_answers ?? null,
        points: q.points,
        tags: [],
      }));

      const { data, error } = await supabase
        .from("question_bank")
        .insert(bankItems)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["question-bank"] });
      queryClient.invalidateQueries({ queryKey: ["question-bank-categories"] });
    },
  });
}

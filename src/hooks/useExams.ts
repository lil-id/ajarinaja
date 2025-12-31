import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

export interface Exam {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  duration: number;
  total_points: number;
  status: string;
  start_date: string | null;
  end_date: string | null;
  kkm: number | null;
  risk_on_missed: boolean;
  risk_on_below_kkm: boolean;
  risk_severity: 'high' | 'medium' | 'low' | null;
  created_at: string;
  updated_at: string;
}

export interface Question {
  id: string;
  exam_id: string;
  type: string;
  question: string;
  options: string[] | null;
  correct_answer: number | null;
  correct_answers: number[] | null;
  points: number;
  order_index: number;
}

export function useExams(courseId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: exams = [], isLoading, error } = useQuery({
    queryKey: ['exams', courseId],
    queryFn: async () => {
      let query = supabase.from('exams').select('*');
      
      if (courseId) {
        query = query.eq('course_id', courseId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Exam[];
    },
    enabled: !!user,
  });

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('exams-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'exams',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['exams'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  return { exams, isLoading, error };
}

export function useExamWithQuestions(examId: string) {
  const { user, role } = useAuth();
  const isTeacher = role === 'teacher';

  return useQuery({
    queryKey: ['exam', examId, role],
    queryFn: async () => {
      const { data: exam, error: examError } = await supabase
        .from('exams')
        .select('*')
        .eq('id', examId)
        .single();
      
      if (examError) throw examError;

      // Teachers query questions table (with correct_answer), students query filtered view (without correct_answer)
      let questions: Question[];
      
      if (isTeacher) {
        const { data, error } = await supabase
          .from('questions')
          .select('*')
          .eq('exam_id', examId)
          .order('order_index');
        
        if (error) throw error;
        questions = data as Question[];
      } else {
        const { data, error } = await supabase
          .from('student_exam_questions')
          .select('*')
          .eq('exam_id', examId)
          .order('order_index');
        
        if (error) throw error;
        // Student view doesn't include correct_answer or correct_answers
        questions = (data ?? []).map(q => ({
          id: q.id!,
          exam_id: q.exam_id!,
          type: q.type!,
          question: q.question!,
          options: q.options as string[] | null,
          correct_answer: null,
          correct_answers: null,
          points: q.points!,
          order_index: q.order_index!,
        }));
      }

      return {
        ...exam,
        questions,
      };
    },
    enabled: !!user && !!examId,
  });
}

export function useCreateExam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      courseId, 
      title, 
      description, 
      duration,
      kkm,
      questions 
    }: { 
      courseId: string; 
      title: string; 
      description?: string; 
      duration: number;
      kkm?: number;
      questions: Omit<Question, 'id' | 'exam_id'>[];
    }) => {
      // Create exam
      const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
      
      const { data: exam, error: examError } = await supabase
        .from('exams')
        .insert({
          course_id: courseId,
          title,
          description,
          duration,
          total_points: totalPoints,
          status: 'draft',
          kkm: kkm || 60,
        })
        .select()
        .single();
      
      if (examError) throw examError;

      // Create questions
      if (questions.length > 0) {
        const questionsToInsert = questions.map((q, index) => ({
          exam_id: exam.id,
          type: q.type,
          question: q.question,
          options: q.options,
          correct_answer: q.correct_answer,
          points: q.points,
          order_index: index,
        }));

        const { error: questionsError } = await supabase
          .from('questions')
          .insert(questionsToInsert);
        
        if (questionsError) throw questionsError;
      }

      return exam;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
    },
  });
}

export function useUpdateExam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Exam> & { id: string }) => {
      const { data, error } = await supabase
        .from('exams')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
    },
  });
}

export function useDeleteExam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('exams')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
    },
  });
}

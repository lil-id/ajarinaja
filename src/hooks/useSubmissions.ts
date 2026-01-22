import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

export interface ExamSubmission {
  id: string;
  exam_id: string;
  student_id: string;
  answers: Record<string, string | number | number[]>;
  score: number | null;
  graded: boolean;
  submitted_at: string;
}

/**
 * Custom hook to fetch exam submissions.
 * 
 * @param {string} [examId] - The ID of the exam.
 * @returns {object} The submissions, loading state, and error.
 */
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

/**
 * Custom hook to fetch the current user's submission for an exam.
 * 
 * @param {string} examId - The ID of the exam.
 * @returns {UseQueryResult} The query result containing the submission.
 */
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

/**
 * Mutation hook to submit an exam.
 * 
 * @returns {UseMutationResult} The mutation result.
 */
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
      answers: Record<string, string | number | number[]>;
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

/**
 * Mutation hook to grade an exam submission.
 * 
 * @returns {UseMutationResult} The mutation result.
 */
export function useGradeSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      submissionId,
      score,
      essayScores
    }: {
      submissionId: string;
      score: number;
      essayScores?: Record<string, number>;
    }) => {
      const { data, error } = await supabase
        .from('exam_submissions')
        .update({
          score,
          graded: true,
        })
        .eq('id', submissionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
    },
  });
}

export interface SubmissionWithStudent extends ExamSubmission {
  student: {
    name: string;
    email: string;
  } | null;
}

/**
 * Custom hook to fetch exam submissions with student details.
 * 
 * @param {string} examId - The ID of the exam.
 * @returns {object} The submissions with student data, loading state, and error.
 */
export function useSubmissionsWithStudents(examId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: submissions = [], isLoading, error } = useQuery({
    queryKey: ['submissions-with-students', examId],
    queryFn: async () => {
      if (!user || !examId) return [];

      // First fetch submissions
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('exam_submissions')
        .select('*')
        .eq('exam_id', examId)
        .order('submitted_at', { ascending: false });

      if (submissionsError) throw submissionsError;
      if (!submissionsData || submissionsData.length === 0) return [];

      // Get unique student IDs
      const studentIds = [...new Set(submissionsData.map(s => s.student_id))];

      // Fetch profiles for these students
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, name, email')
        .in('user_id', studentIds);

      if (profilesError) throw profilesError;

      // Create a map for quick lookup
      const profilesMap = new Map(
        (profilesData || []).map(p => [p.user_id, { name: p.name, email: p.email }])
      );

      // Combine submissions with student data
      return submissionsData.map(submission => ({
        ...submission,
        student: profilesMap.get(submission.student_id) || null,
      })) as SubmissionWithStudent[];
    },
    enabled: !!user && !!examId,
  });

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('submissions-grading-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'exam_submissions',
          filter: `exam_id=eq.${examId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['submissions-with-students', examId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, examId, queryClient]);

  return { submissions, isLoading, error };
}

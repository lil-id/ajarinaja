import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Question } from './useExams';

export interface ExamWithResults {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  duration: number;
  total_points: number;
  status: string;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
  questions: Question[];
}

// This hook fetches exam data with correct answers for a student who has already submitted
// It verifies the student has a submission before returning correct answers
export function useExamResults(examId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['exam-results', examId, user?.id],
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');

      // First verify the student has submitted this exam
      const { data: submission, error: submissionError } = await supabase
        .from('exam_submissions')
        .select('id')
        .eq('exam_id', examId)
        .eq('student_id', user.id)
        .single();

      if (submissionError || !submission) {
        throw new Error('No submission found - cannot view results');
      }

      // Fetch exam details
      const { data: exam, error: examError } = await supabase
        .from('exams')
        .select('*')
        .eq('id', examId)
        .single();

      if (examError) throw examError;

      // Fetch questions WITH correct answers (since student has submitted)
      const { data: questions, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('exam_id', examId)
        .order('order_index');

      if (questionsError) throw questionsError;

      return {
        ...exam,
        questions: questions as Question[],
      } as ExamWithResults;
    },
    enabled: !!user && !!examId,
  });
}

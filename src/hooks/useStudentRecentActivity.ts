import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface StudentActivityItem {
  id: string;
  submissionId?: string;
  type: 'assignment' | 'exam';
  title: string;
  courseName: string;
  submittedAt: string;
  status: 'submitted' | 'graded';
  score?: number;
  maxPoints?: number;
}

export function useStudentRecentActivity(limit: number = 5) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['student-recent-activity', user?.id, limit],
    queryFn: async () => {
      if (!user) return [];

      // 1. Fetch File-based Assignment Submissions
      const { data: fileSubmissions } = await supabase
        .from('assignment_submissions')
        .select(`
          id,
          submitted_at,
          score,
          assignments:assignments!inner (
            id,
            title,
            max_points,
            courses:courses (
              title
            )
          )
        `)
        .eq('student_id', user.id)
        .order('submitted_at', { ascending: false })
        .limit(limit);

      // 2. Fetch Question-based Assignment Submissions
      const { data: questionSubmissions } = await supabase
        .from('assignment_question_submissions')
        .select(`
          id,
          submitted_at,
          score,
          graded,
          assignments:assignments!inner (
            id,
            title,
            max_points,
            courses:courses (
              title
            )
          )
        `)
        .eq('student_id', user.id)
        .order('submitted_at', { ascending: false })
        .limit(limit);

      // 3. Fetch Exam Submissions
      const { data: examSubmissions } = await supabase
        .from('exam_submissions')
        .select(`
          id,
          submitted_at,
          score,
          exams:exams!inner (
            id,
            title,
            total_points,
            courses:courses (
              title
            )
          )
        `)
        .eq('student_id', user.id)
        .order('submitted_at', { ascending: false })
        .limit(limit);

      const activities: StudentActivityItem[] = [];

      // Process File Submissions
      fileSubmissions?.forEach(sub => {
        const assignment = sub.assignments as any;
        const course = assignment?.courses as any;
        activities.push({
          id: assignment?.id,
          submissionId: sub.id,
          type: 'assignment',
          title: assignment?.title || 'Unknown Assignment',
          courseName: course?.title || 'Unknown Course',
          submittedAt: sub.submitted_at,
          status: sub.score !== null ? 'graded' : 'submitted',
          score: sub.score || undefined,
          maxPoints: assignment?.max_points || undefined
        });
      });

      // Process Question Submissions
      questionSubmissions?.forEach(sub => {
        const assignment = sub.assignments as any;
        const course = assignment?.courses as any;
        activities.push({
          id: assignment?.id,
          submissionId: sub.id,
          type: 'assignment',
          title: assignment?.title || 'Unknown Assignment',
          courseName: course?.title || 'Unknown Course',
          submittedAt: sub.submitted_at,
          status: (sub.graded || sub.score !== null) ? 'graded' : 'submitted',
          score: sub.score || undefined,
          maxPoints: assignment?.max_points || undefined
        });
      });

      // Process Exam Submissions
      examSubmissions?.forEach(sub => {
        const exam = sub.exams as any;
        const course = exam?.courses as any;
        activities.push({
          id: exam?.id,
          submissionId: sub.id,
          type: 'exam',
          title: exam?.title || 'Unknown Exam',
          courseName: course?.title || 'Unknown Course',
          submittedAt: sub.submitted_at,
          status: sub.score !== null ? 'graded' : 'submitted',
          score: sub.score || undefined,
          maxPoints: exam?.total_points || undefined
        });
      });

      // Sort combined results by date descending
      return activities
        .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
        .slice(0, limit);
    },
    enabled: !!user,
  });
}

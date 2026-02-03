import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface WaitingGradingItem {
    id: string; // submission id
    title: string;
    type: 'assignment' | 'exam';
    courseName: string;
    submittedAt: string;
}

export function useStudentWaitingGrading() {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['student-waiting-grading', user?.id],
        queryFn: async () => {
            if (!user) return { total: 0, items: [] };

            // 1. Fetch File-based Assignment Submissions (ungraded)
            const { data: fileSubmissions } = await supabase
                .from('assignment_submissions')
                .select(`
                    id,
                    submitted_at,
                    assignment_id,
                    assignments:assignments!inner (
                        title,
                        courses:courses (
                            title
                        )
                    )
                `)
                .eq('student_id', user.id)
                .is('score', null);

            // 2. Fetch Question-based Assignment Submissions (ungraded)
            const { data: questionSubmissions } = await supabase
                .from('assignment_question_submissions')
                .select(`
                    id,
                    submitted_at,
                    assignment_id,
                    assignments:assignments!inner (
                        title,
                        courses:courses (
                            title
                        )
                    )
                `)
                .eq('student_id', user.id)
                .is('score', null)
                .eq('graded', false);

            // 3. Fetch Exam Submissions (ungraded)
            const { data: examSubmissions } = await supabase
                .from('exam_submissions')
                .select(`
                    id,
                    submitted_at,
                    exam_id,
                    exams:exams!inner (
                        title,
                        courses:courses (
                            title
                        )
                    )
                `)
                .eq('student_id', user.id)
                .is('score', null);

            const items: WaitingGradingItem[] = [];

            fileSubmissions?.forEach(sub => {
                const assignment = sub.assignments as any;
                const course = assignment?.courses as any;
                items.push({
                    id: sub.assignment_id, // Use assignment_id instead of submission id
                    title: assignment?.title || 'Unknown',
                    type: 'assignment',
                    courseName: course?.title || 'Unknown',
                    submittedAt: sub.submitted_at,
                });
            });

            questionSubmissions?.forEach(sub => {
                const assignment = sub.assignments as any;
                const course = assignment?.courses as any;
                items.push({
                    id: sub.assignment_id, // Use assignment_id
                    title: assignment?.title || 'Unknown',
                    type: 'assignment',
                    courseName: course?.title || 'Unknown',
                    submittedAt: sub.submitted_at,
                });
            });

            examSubmissions?.forEach(sub => {
                const exam = sub.exams as any;
                const course = exam?.courses as any;
                items.push({
                    id: sub.exam_id, // Use exam_id
                    title: exam?.title || 'Unknown',
                    type: 'exam',
                    courseName: course?.title || 'Unknown',
                    submittedAt: sub.submitted_at,
                });
            });

            // Sort by submitted_at (oldest first - waiting longest)
            items.sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime());

            return {
                total: items.length,
                items,
            };
        },
        enabled: !!user,
    });
}

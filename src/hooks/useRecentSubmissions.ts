import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface RecentSubmission {
    id: string;
    student_id: string;
    student_name: string;
    assignment_id?: string;
    exam_id?: string;
    item_title: string;
    item_type: 'assignment' | 'exam';
    submitted_at: string;
    graded: boolean;
    score?: number;
}

export function useRecentSubmissions(limit: number = 10) {
    return useQuery({
        queryKey: ['recentSubmissions', limit],
        queryFn: async () => {
            // Get current user's courses
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data: courses } = await supabase
                .from('courses')
                .select('id')
                .eq('teacher_id', user.id);

            if (!courses || courses.length === 0) return [];

            const courseIds = courses.map(c => c.id);

            // Fetch BOTH types of assignment submissions
            // 1. File-based assignment submissions
            const { data: fileAssignmentSubs } = await supabase
                .from('assignment_submissions')
                .select(`
          id,
          student_id,
          assignment_id,
          submitted_at,
          score,
          assignments!inner(
            id,
            title,
            course_id
          )
        `)
                .in('assignments.course_id', courseIds)
                .order('submitted_at', { ascending: false })
                .limit(limit);

            // 2. Question-based assignment submissions
            const { data: questionAssignmentSubs } = await supabase
                .from('assignment_question_submissions')
                .select(`
          id,
          student_id,
          assignment_id,
          submitted_at,
          score,
          graded,
          assignments!inner(
            id,
            title,
            course_id
          )
        `)
                .in('assignments.course_id', courseIds)
                .order('submitted_at', { ascending: false })
                .limit(limit);

            // Fetch exam submissions with profiles
            const { data: examSubs } = await supabase
                .from('exam_submissions')
                .select(`
          id,
          student_id,
          exam_id,
          submitted_at,
          score,
          exams!inner(
            id,
            title,
            course_id
          )
        `)
                .in('exams.course_id', courseIds)
                .order('submitted_at', { ascending: false })
                .limit(limit);

            // Get all unique student IDs from all submission types
            const studentIds = new Set<string>();
            fileAssignmentSubs?.forEach(sub => studentIds.add(sub.student_id));
            questionAssignmentSubs?.forEach(sub => studentIds.add(sub.student_id));
            examSubs?.forEach(sub => studentIds.add(sub.student_id));

            // Fetch student profiles separately
            const { data: profiles } = await supabase
                .from('profiles')
                .select('user_id, name')
                .in('user_id', Array.from(studentIds));

            const profileMap = new Map(profiles?.map(p => [p.user_id, p.name]) || []);

            // Combine and format
            const allSubmissions: RecentSubmission[] = [];

            // File-based assignment submissions
            if (fileAssignmentSubs) {
                fileAssignmentSubs.forEach(sub => {
                    allSubmissions.push({
                        id: sub.id,
                        student_id: sub.student_id,
                        student_name: profileMap.get(sub.student_id) || 'Unknown',
                        assignment_id: sub.assignment_id,
                        item_title: (sub.assignments as any)?.title || 'Unknown',
                        item_type: 'assignment',
                        submitted_at: sub.submitted_at,
                        graded: sub.score !== null,
                        score: sub.score || undefined,
                    });
                });
            }

            // Question-based assignment submissions
            if (questionAssignmentSubs) {
                questionAssignmentSubs.forEach(sub => {
                    allSubmissions.push({
                        id: sub.id,
                        student_id: sub.student_id,
                        student_name: profileMap.get(sub.student_id) || 'Unknown',
                        assignment_id: sub.assignment_id,
                        item_title: (sub.assignments as any)?.title || 'Unknown',
                        item_type: 'assignment',
                        submitted_at: sub.submitted_at,
                        graded: sub.graded ?? (sub.score !== null), // Use graded column if available
                        score: sub.score || undefined,
                    });
                });
            }

            if (examSubs) {
                examSubs.forEach(sub => {
                    allSubmissions.push({
                        id: sub.id,
                        student_id: sub.student_id,
                        student_name: profileMap.get(sub.student_id) || 'Unknown',
                        exam_id: sub.exam_id,
                        item_title: (sub.exams as any)?.title || 'Unknown',
                        item_type: 'exam',
                        submitted_at: sub.submitted_at,
                        graded: sub.score !== null,
                        score: sub.score || undefined,
                    });
                });
            }

            // Sort by submitted_at and limit
            return allSubmissions
                .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())
                .slice(0, limit);
        },
    });
}

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PendingGradingItem {
    id: string;
    title: string;
    type: 'assignment' | 'exam';
    course_id: string;
    course_title: string;
    pending_count: number;
    due_date?: string;
    is_overdue: boolean;
}

export function usePendingGrading() {
    return useQuery({
        queryKey: ['pendingGrading'],
        queryFn: async () => {
            // Get current user's courses
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data: courses } = await supabase
                .from('courses')
                .select('id, title')
                .eq('teacher_id', user.id);

            if (!courses || courses.length === 0) return { total: 0, items: [] };

            const courseIds = courses.map(c => c.id);
            const pendingItems: PendingGradingItem[] = [];

            // Get assignments for teacher's courses
            const { data: assignments } = await supabase
                .from('assignments')
                .select('id, title, course_id, due_date')
                .in('course_id', courseIds);

            if (assignments && assignments.length > 0) {
                const assignmentIds = assignments.map(a => a.id);

                // Get ungraded submissions for these assignments
                const { data: ungradedSubs } = await supabase
                    .from('assignment_submissions')
                    .select('assignment_id')
                    .in('assignment_id', assignmentIds)
                    .is('score', null);

                // Count ungraded per assignment
                const ungradedCounts = new Map<string, number>();
                ungradedSubs?.forEach(sub => {
                    const count = ungradedCounts.get(sub.assignment_id) || 0;
                    ungradedCounts.set(sub.assignment_id, count + 1);
                });

                // Build pending items
                assignments.forEach(assignment => {
                    const ungradedCount = ungradedCounts.get(assignment.id) || 0;
                    if (ungradedCount > 0) {
                        const course = courses.find(c => c.id === assignment.course_id);
                        const dueDate = assignment.due_date ? new Date(assignment.due_date) : null;
                        const isOverdue = dueDate ? dueDate < new Date() : false;

                        pendingItems.push({
                            id: assignment.id,
                            title: assignment.title,
                            type: 'assignment',
                            course_id: assignment.course_id,
                            course_title: course?.title || 'Unknown',
                            pending_count: ungradedCount,
                            due_date: assignment.due_date,
                            is_overdue: isOverdue,
                        });
                    }
                });
            }

            // Get exams for teacher's courses
            const { data: exams } = await supabase
                .from('exams')
                .select('id, title, course_id, end_date')
                .in('course_id', courseIds);

            if (exams && exams.length > 0) {
                const examIds = exams.map(e => e.id);

                // Get ungraded submissions for these exams
                const { data: ungradedSubs } = await supabase
                    .from('exam_submissions')
                    .select('exam_id')
                    .in('exam_id', examIds)
                    .is('score', null);

                // Count ungraded per exam
                const ungradedCounts = new Map<string, number>();
                ungradedSubs?.forEach(sub => {
                    const count = ungradedCounts.get(sub.exam_id) || 0;
                    ungradedCounts.set(sub.exam_id, count + 1);
                });

                // Build pending items
                exams.forEach(exam => {
                    const ungradedCount = ungradedCounts.get(exam.id) || 0;
                    if (ungradedCount > 0) {
                        const course = courses.find(c => c.id === exam.course_id);
                        const endDate = exam.end_date ? new Date(exam.end_date) : null;
                        const isOverdue = endDate ? endDate < new Date() : false;

                        pendingItems.push({
                            id: exam.id,
                            title: exam.title,
                            type: 'exam',
                            course_id: exam.course_id,
                            course_title: course?.title || 'Unknown',
                            pending_count: ungradedCount,
                            due_date: exam.end_date,
                            is_overdue: isOverdue,
                        });
                    }
                });
            }

            // Sort by overdue first, then by pending count
            pendingItems.sort((a, b) => {
                if (a.is_overdue && !b.is_overdue) return -1;
                if (!a.is_overdue && b.is_overdue) return 1;
                return b.pending_count - a.pending_count;
            });

            const totalPending = pendingItems.reduce((sum, item) => sum + item.pending_count, 0);

            return {
                total: totalPending,
                items: pendingItems,
            };
        },
    });
}

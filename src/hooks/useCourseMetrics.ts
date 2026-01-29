import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface CourseMetrics {
    course_id: string;
    student_count: number;
    assignment_count: number;
    exam_count: number;
    pending_grading_count: number;
    avg_progress: number;
    upcoming_deadline?: {
        title: string;
        date: string;
        type: 'assignment' | 'exam';
    };
}

export function useCourseMetrics(courseIds: string[]) {
    return useQuery({
        queryKey: ['courseMetrics', courseIds],
        queryFn: async () => {
            if (courseIds.length === 0) return [];

            const metrics: CourseMetrics[] = [];

            for (const courseId of courseIds) {
                // Get student count (enrollments)
                const { count: studentCount } = await supabase
                    .from('enrollments')
                    .select('*', { count: 'exact', head: true })
                    .eq('course_id', courseId);

                // Get assignment count
                const { count: assignmentCount } = await supabase
                    .from('assignments')
                    .select('*', { count: 'exact', head: true })
                    .eq('course_id', courseId);

                // Get exam count
                const { count: examCount } = await supabase
                    .from('exams')
                    .select('*', { count: 'exact', head: true })
                    .eq('course_id', courseId);

                // Get pending grading count
                // For assignments
                const { data: assignments } = await supabase
                    .from('assignments')
                    .select('id')
                    .eq('course_id', courseId);

                const assignmentIds = assignments?.map(a => a.id) || [];

                let pendingAssignmentCount = 0;
                if (assignmentIds.length > 0) {
                    const { count } = await supabase
                        .from('assignment_submissions')
                        .select('*', { count: 'exact', head: true })
                        .in('assignment_id', assignmentIds)
                        .is('score', null);
                    pendingAssignmentCount = count || 0;
                }

                // For exams
                const { data: exams } = await supabase
                    .from('exams')
                    .select('id')
                    .eq('course_id', courseId);

                const examIds = exams?.map(e => e.id) || [];

                let pendingExamCount = 0;
                if (examIds.length > 0) {
                    const { count } = await supabase
                        .from('exam_submissions')
                        .select('*', { count: 'exact', head: true })
                        .in('exam_id', examIds)
                        .is('score', null);
                    pendingExamCount = count || 0;
                }

                const totalPending = pendingAssignmentCount + pendingExamCount;

                // Get upcoming deadline (next assignment or exam)
                const { data: upcomingAssignments } = await supabase
                    .from('assignments')
                    .select('title, due_date')
                    .eq('course_id', courseId)
                    .gte('due_date', new Date().toISOString())
                    .order('due_date', { ascending: true })
                    .limit(1);

                const { data: upcomingExams } = await supabase
                    .from('exams')
                    .select('title, end_date')
                    .eq('course_id', courseId)
                    .gte('end_date', new Date().toISOString())
                    .order('end_date', { ascending: true })
                    .limit(1);

                let upcomingDeadline: CourseMetrics['upcoming_deadline'];

                if (upcomingAssignments?.[0] && upcomingExams?.[0]) {
                    // Compare which is sooner
                    const assignmentDate = new Date(upcomingAssignments[0].due_date);
                    const examDate = new Date(upcomingExams[0].end_date);

                    if (assignmentDate < examDate) {
                        upcomingDeadline = {
                            title: upcomingAssignments[0].title,
                            date: upcomingAssignments[0].due_date,
                            type: 'assignment',
                        };
                    } else {
                        upcomingDeadline = {
                            title: upcomingExams[0].title,
                            date: upcomingExams[0].end_date,
                            type: 'exam',
                        };
                    }
                } else if (upcomingAssignments?.[0]) {
                    upcomingDeadline = {
                        title: upcomingAssignments[0].title,
                        date: upcomingAssignments[0].due_date,
                        type: 'assignment',
                    };
                } else if (upcomingExams?.[0]) {
                    upcomingDeadline = {
                        title: upcomingExams[0].title,
                        date: upcomingExams[0].end_date,
                        type: 'exam',
                    };
                }

                // Calculate average progress (simplified - based on submission rate)
                let avgProgress = 0;
                if (studentCount && studentCount > 0) {
                    const totalItems = (assignmentCount || 0) + (examCount || 0);
                    if (totalItems > 0) {
                        // Get total submissions
                        const { count: assignmentSubs } = await supabase
                            .from('assignment_submissions')
                            .select('*', { count: 'exact', head: true })
                            .in('assignment_id', assignmentIds);

                        const { count: examSubs } = await supabase
                            .from('exam_submissions')
                            .select('*', { count: 'exact', head: true })
                            .in('exam_id', examIds);

                        const totalSubmissions = (assignmentSubs || 0) + (examSubs || 0);
                        const expectedSubmissions = studentCount * totalItems;
                        avgProgress = expectedSubmissions > 0
                            ? Math.round((totalSubmissions / expectedSubmissions) * 100)
                            : 0;
                    }
                }

                metrics.push({
                    course_id: courseId,
                    student_count: studentCount || 0,
                    assignment_count: assignmentCount || 0,
                    exam_count: examCount || 0,
                    pending_grading_count: totalPending,
                    avg_progress: Math.min(avgProgress, 100), // Cap at 100%
                    upcoming_deadline: upcomingDeadline,
                });
            }

            return metrics;
        },
        enabled: courseIds.length > 0,
    });
}

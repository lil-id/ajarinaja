import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subDays, format, startOfDay } from 'date-fns';

interface DayActivity {
    date: string;
    assignment_submissions: number;
    exam_submissions: number;
    total: number;
}

export function useActivityStats(days: number = 7) {
    return useQuery({
        queryKey: ['activityStats', days],
        queryFn: async () => {
            // Get current user's courses
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data: courses } = await supabase
                .from('courses')
                .select('id')
                .eq('teacher_id', user.id);

            if (!courses || courses.length === 0) {
                // Return empty data for the days
                const emptyData: DayActivity[] = [];
                for (let i = days - 1; i >= 0; i--) {
                    const date = subDays(new Date(), i);
                    emptyData.push({
                        date: format(date, 'MMM dd'),
                        assignment_submissions: 0,
                        exam_submissions: 0,
                        total: 0,
                    });
                }
                return emptyData;
            }

            const courseIds = courses.map(c => c.id);
            const startDate = startOfDay(subDays(new Date(), days - 1));

            // Fetch from BOTH assignment submission tables
            // 1. assignment_submissions (file-based)
            const { data: fileAssignmentSubs } = await supabase
                .from('assignment_submissions')
                .select(`
          submitted_at,
          assignments!inner(
            course_id
          )
        `)
                .in('assignments.course_id', courseIds)
                .gte('submitted_at', startDate.toISOString());

            // 2. assignment_question_submissions (question-based)
            const { data: questionAssignmentSubs } = await supabase
                .from('assignment_question_submissions')
                .select(`
          submitted_at,
          assignments!inner(
            course_id
          )
        `)
                .in('assignments.course_id', courseIds)
                .gte('submitted_at', startDate.toISOString());

            // Fetch exam submissions
            const { data: examSubs } = await supabase
                .from('exam_submissions')
                .select(`
          submitted_at,
          exams!inner(
            course_id
          )
        `)
                .in('exams.course_id', courseIds)
                .gte('submitted_at', startDate.toISOString());

            // Merge both assignment submission types
            const allAssignmentSubs = [
                ...(fileAssignmentSubs || []),
                ...(questionAssignmentSubs || [])
            ];

            // Group by date
            const activityMap = new Map<string, DayActivity>();

            // Initialize all days
            for (let i = days - 1; i >= 0; i--) {
                const date = subDays(new Date(), i);
                const dateKey = format(date, 'yyyy-MM-dd');
                const displayDate = format(date, 'MMM dd');
                activityMap.set(dateKey, {
                    date: displayDate,
                    assignment_submissions: 0,
                    exam_submissions: 0,
                    total: 0,
                });
            }

            // Count assignment submissions by day (from both tables)
            if (allAssignmentSubs && allAssignmentSubs.length > 0) {
                allAssignmentSubs.forEach(sub => {
                    const dateKey = format(new Date(sub.submitted_at), 'yyyy-MM-dd');
                    const activity = activityMap.get(dateKey);
                    if (activity) {
                        activity.assignment_submissions += 1;
                        activity.total += 1;
                    }
                });
            }

            // Count exam submissions by day
            if (examSubs) {
                examSubs.forEach(sub => {
                    const dateKey = format(new Date(sub.submitted_at), 'yyyy-MM-dd');
                    const activity = activityMap.get(dateKey);
                    if (activity) {
                        activity.exam_submissions += 1;
                        activity.total += 1;
                    }
                });
            }

            // Convert map to sorted array
            return Array.from(activityMap.values());
        },
    });
}

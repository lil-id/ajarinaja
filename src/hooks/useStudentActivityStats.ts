import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subDays, format, startOfDay } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

interface DayActivity {
    date: string;
    assignment_submissions: number;
    exam_submissions: number;
    total: number;
}

export function useStudentActivityStats(days: number = 7) {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['studentActivityStats', user?.id, days],
        queryFn: async () => {
            if (!user) return [];

            const startDate = startOfDay(subDays(new Date(), days - 1));

            // Fetch from BOTH assignment submission tables
            // 1. assignment_submissions (file-based)
            const { data: fileAssignmentSubs } = await supabase
                .from('assignment_submissions')
                .select('submitted_at')
                .eq('student_id', user.id)
                .gte('submitted_at', startDate.toISOString());

            // 2. assignment_question_submissions (question-based)
            const { data: questionAssignmentSubs } = await supabase
                .from('assignment_question_submissions')
                .select('submitted_at')
                .eq('student_id', user.id)
                .gte('submitted_at', startDate.toISOString());

            // Fetch exam submissions
            const { data: examSubs } = await supabase
                .from('exam_submissions')
                .select('submitted_at')
                .eq('student_id', user.id)
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

            // Count assignment submissions by day
            allAssignmentSubs.forEach(sub => {
                const dateKey = format(new Date(sub.submitted_at), 'yyyy-MM-dd');
                const activity = activityMap.get(dateKey);
                if (activity) {
                    activity.assignment_submissions += 1;
                    activity.total += 1;
                }
            });

            // Count exam submissions by day
            examSubs?.forEach(sub => {
                const dateKey = format(new Date(sub.submitted_at), 'yyyy-MM-dd');
                const activity = activityMap.get(dateKey);
                if (activity) {
                    activity.exam_submissions += 1;
                    activity.total += 1;
                }
            });

            // Convert map to sorted array
            return Array.from(activityMap.values());
        },
        enabled: !!user,
    });
}

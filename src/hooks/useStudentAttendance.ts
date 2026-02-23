import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger, generateCorrelationId } from '@/lib/logger';
import type { AttendanceSession, AttendanceRecord, CheckInResponse } from '@/types/attendance';

export function useStudentAttendance(courseId: string) {
    return useQuery({
        queryKey: ['student-attendance', courseId],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // 1. Get all sessions for this course
            const { data: sessions, error: sessionsError } = await supabase
                .from('attendance_sessions' as any)
                .select('*')
                .eq('course_id', courseId)
                .order('session_date', { ascending: false });

            if (sessionsError) throw sessionsError;

            // 2. Get my attendance records for these sessions
            const sessionIds = sessions.map((s: any) => s.id);
            const { data: records, error: recordsError } = await supabase
                .from('attendance_records' as any)
                .select('*')
                .in('session_id', sessionIds)
                .eq('student_id', user.id);

            if (recordsError) throw recordsError;

            // 3. Identify active session (if any) that needs check-in
            const activeSession = sessions.find((s: any) => s.status === 'open');

            // Map records to session IDs for easy lookup
            const recordMap = new Map(records.map((r: any) => [r.session_id, r]));

            return {
                sessions: sessions as unknown as AttendanceSession[],
                records: recordMap,
                activeSession: activeSession as unknown as AttendanceSession | undefined,
                userId: user.id
            };
        },
        enabled: !!courseId,
    });
}

export function useStudentCheckIn() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            sessionId,
            studentId,
            pin,
            location
        }: {
            sessionId: string;
            studentId: string;
            pin?: string;
            location?: { lat: number; lng: number }
        }) => {
            const correlationId = generateCorrelationId();
            const startTime = Date.now();

            logger.info('student_check_in', {
                correlationId,
                userId: studentId,
                sessionId
            }, 'Operation start');

            try {
                const { data, error } = await supabase.rpc('student_check_in' as any, {
                    p_session_id: sessionId,
                    p_student_id: studentId,
                    p_pin: pin,
                    p_latitude: location?.lat,
                    p_longitude: location?.lng
                });

                if (error) {
                    logger.error('student_check_in', {
                        correlationId,
                        userId: studentId,
                        error: error.message,
                        duration: Date.now() - startTime
                    }, 'Operation failure');
                    throw error;
                }

                logger.info('student_check_in', {
                    correlationId,
                    userId: studentId,
                    duration: Date.now() - startTime
                }, 'Operation success');

                return data as unknown as CheckInResponse;
            } catch (err: any) {
                if (!(err instanceof Error) || !err.message.includes('student_check_in')) {
                    logger.error('student_check_in', {
                        correlationId,
                        userId: studentId,
                        error: err.message || 'Unknown error',
                        duration: Date.now() - startTime
                    }, 'Operation failure');
                }
                throw err;
            }
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['student-attendance'] });
            queryClient.invalidateQueries({ queryKey: ['attendance-session', variables.sessionId] });
            queryClient.invalidateQueries({ queryKey: ['student-active-sessions'] });
            queryClient.invalidateQueries({ queryKey: ['attendance-matrix'] });
            queryClient.invalidateQueries({ queryKey: ['active-course-session'] });
        },
    });
}

export function useStudentActiveSessions() {
    return useQuery({
        queryKey: ['student-active-sessions'],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // 1. Get open sessions (RLS filters by enrollment automatically)
            const { data: sessions, error } = await supabase
                .from('attendance_sessions' as any)
                .select(`
                    *,
                    course:courses(title)
                `)
                .eq('status', 'open')
                .order('close_time', { ascending: true });

            if (error) throw error;

            if (!sessions || sessions.length === 0) return [];

            // 2. Get my records to exclude already checked-in ones (if desired)
            const sessionIds = sessions.map((s: any) => s.id);
            const { data: records, error: recordsError } = await supabase
                .from('attendance_records' as any)
                .select('*')
                .in('session_id', sessionIds)
                .eq('student_id', user.id);

            if (recordsError) throw recordsError;

            const recordMap = new Map(records.map((r: any) => [r.session_id, r]));

            // Filter logic: Show if NO record OR record status is 'absent'
            // If checking in is allowed even if 'late', we show it.
            // If already 'present' or 'late' (checked in), hide it from "Active Actions".
            const relevantSessions = sessions.filter((s: any) => {
                const rec = recordMap.get(s.id);
                if (!rec) return true;
                // Only show if status is 'absent' (meaning hasn't successfully checked in yet)
                return rec.status === 'absent';
            });

            const now = new Date();
            const activeRelevantSessions = relevantSessions.filter((s: any) => {
                const closeTime = new Date(s.close_time);
                return closeTime > now;
            });

            return activeRelevantSessions as any[];
        }
    });
}

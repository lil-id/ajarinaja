import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger, generateCorrelationId } from '@/lib/logger';
import type { AttendanceSession, AttendanceRecord, CheckInResponse } from '@/types/attendance';

export function useStudentAttendance(courseId: string) {
    const queryClient = useQueryClient();
    return useQuery({
        queryKey: ['student-attendance', courseId],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // 1. Get all sessions for this course
            let query = supabase
                .from('attendance_sessions' as any)
                .select('*')
                .eq('course_id', courseId);

            // Fetch specific class if provided
            const classId = (queryClient.getQueryData(['student-course-class', courseId]) as any)?.class_id;
            if (classId) {
                query = query.eq('class_id', classId);
            }

            const { data: sessions, error: sessionsError } = await query
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
            const { data: allSessions, error: sessionsError } = await supabase
                .from('attendance_sessions' as any)
                .select(`
                    *,
                    course:courses(title)
                `)
                .eq('status', 'open')
                .order('close_time', { ascending: true });

            if (sessionsError) throw sessionsError;

            if (!allSessions || allSessions.length === 0) return [];

            // 2. Get the student's assigned classes to filter sessions
            const { data: studentClasses } = await supabase
                .from('class_students')
                .select('class_id')
                .eq('student_id', user.id);

            const studentClassIds = studentClasses?.map(c => c.class_id) || [];

            // Filter sessions by student's classes
            const mySessions = (allSessions as any[]).filter((s: any) =>
                !s.class_id || studentClassIds.includes(s.class_id)
            );

            if (mySessions.length === 0) return [];

            // 3. Get my records to exclude already checked-in ones
            const sessionIds = mySessions.map((s: any) => s.id);
            const { data: records, error: recordsError } = await supabase
                .from('attendance_records' as any)
                .select('*')
                .in('session_id', sessionIds)
                .eq('student_id', user.id);

            if (recordsError) throw recordsError;

            const recordMap = new Map(records.map((r: any) => [r.session_id, r]));

            // Filter logic: Show if NO record OR record status is 'absent'
            const relevantSessions = mySessions.filter((s: any) => {
                const rec = recordMap.get(s.id);
                if (!rec) return true;
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

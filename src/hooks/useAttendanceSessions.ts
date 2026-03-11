import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type {
    AttendanceSession,
    AttendanceSessionWithCourse,
    AttendanceRecordWithStudent,
    OpenSessionResponse,
} from '@/types/attendance';

// Get all sessions for a course
export function useAttendanceSessions(courseId: string, classId?: string) {
    return useQuery({
        queryKey: ['attendance-sessions', courseId, classId],
        queryFn: async () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let query: any = supabase
                .from('attendance_sessions')
                .select('*, course:courses(id, title)')
                .eq('course_id', courseId);

            if (classId) {
                query = query.eq('class_id', classId);
            }

            const { data, error } = await query
                .order('session_date', { ascending: false })
                .order('session_number', { ascending: false });

            if (error) throw error;
            return data as AttendanceSessionWithCourse[];
        },
        enabled: !!courseId,
    });
}

// Get single session with records
export function useAttendanceSession(sessionId: string) {
    return useQuery({
        queryKey: ['attendance-session', sessionId],
        queryFn: async () => {
            const [sessionResult, recordsResult] = await Promise.all([
                supabase
                    .from('attendance_sessions')
                    .select('*, course:courses(id, title)')
                    .eq('id', sessionId)
                    .single(),
                supabase
                    .from('attendance_records')
                    .select(`
            *,
            student:profiles!fk_attendance_student_profile(
              id,
              name,
              email,
              avatar_url
            )
          `)
                    .eq('session_id', sessionId)
                    .order('student_id'),
            ]);

            if (sessionResult.error) throw sessionResult.error;
            if (recordsResult.error) throw recordsResult.error;

            // Transform records to flatten student data
            const records = recordsResult.data.map((record: { student_id: string; student?: { name?: string; email?: string; avatar_url?: string } | null;[key: string]: unknown }) => ({
                ...record,
                student: {
                    id: record.student_id,
                    name: record.student?.name || 'Unknown Student',
                    email: record.student?.email || '',
                    avatar_url: record.student?.avatar_url,
                },
            }));

            // Sort by name manually since we can't easily order by JSONB/relation
            records.sort((a, b) => String(a.student.name).localeCompare(String(b.student.name)));

            return {
                session: sessionResult.data as AttendanceSessionWithCourse,
                records: records as AttendanceRecordWithStudent[],
            };
        },
        enabled: !!sessionId,
    });
}

// Create new session
export function useCreateSession() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (session: Partial<AttendanceSession> & { class_id: string }) => {
            const { data, error } = await supabase
                .from('attendance_sessions')
                // Cast is required because Supabase types require session_date but it
                // is auto-populated by the DB trigger; the rest of the required fields
                // are passed by the caller.
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .insert(session as any)
                .select()
                .single();

            if (error) throw error;
            return data as AttendanceSession;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['attendance-sessions', data.course_id] });
        },
    });
}

// Open session (calls RPC)
export function useOpenSession() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            sessionId,
            duration = 15,
        }: {
            sessionId: string;
            duration?: number;
        }) => {
            const { data, error } = await supabase.rpc('open_attendance_session', {
                p_session_id: sessionId,
                p_duration_minutes: duration,
            });

            if (error) throw error;
            return (data as unknown) as OpenSessionResponse;
        },
        onSuccess: (_, variables) => {
            // Invalidate session queries
            queryClient.invalidateQueries({ queryKey: ['attendance-session', variables.sessionId] });
            queryClient.invalidateQueries({ queryKey: ['attendance-sessions'] });
            queryClient.invalidateQueries({ queryKey: ['active-teacher-session'] });
        },
    });
}

// Close session manually
export function useCloseSession() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (sessionId: string) => {
            const { data, error } = await supabase
                .from('attendance_sessions')
                .update({ status: 'closed', updated_at: new Date().toISOString() })
                .eq('id', sessionId)
                .select()
                .single();

            if (error) throw error;
            return data as AttendanceSession;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['attendance-session', data.id] });
            queryClient.invalidateQueries({ queryKey: ['attendance-sessions', data.course_id] });
            queryClient.invalidateQueries({ queryKey: ['active-teacher-session'] });
        },
    });
}

// Delete session (Hard Delete)
export function useDeleteSession() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (sessionId: string) => {
            const { error } = await supabase
                .from('attendance_sessions')
                .delete()
                .eq('id', sessionId);

            if (error) throw error;
        },
        onSuccess: (_, sessionId) => {
            queryClient.invalidateQueries({ queryKey: ['attendance-sessions'] });
            queryClient.invalidateQueries({ queryKey: ['attendance-session', sessionId] });
            queryClient.invalidateQueries({ queryKey: ['active-teacher-session'] });
            queryClient.invalidateQueries({ queryKey: ['course-attendance-stats'] });
        },
    });
}

// Manual update attendance record
export function useUpdateAttendanceManual() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            recordId,
            newStatus,
            notes,
        }: {
            recordId: string;
            newStatus: string;
            notes?: string;
        }) => {
            const { data, error } = await supabase.rpc('update_attendance_manual', {
                p_record_id: recordId,
                p_new_status: newStatus,
                p_notes: notes,
            });

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            // Invalidate all attendance queries including matrix
            queryClient.invalidateQueries({ queryKey: ['attendance-session'] });
            queryClient.invalidateQueries({ queryKey: ['attendance-sessions'] });
            queryClient.invalidateQueries({ queryKey: ['attendance-matrix'] });
        },
    });
}

// Get active session for the current teacher (for dashboard widget)
export function useActiveTeacherSession() {
    return useQuery({
        queryKey: ['active-teacher-session'],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return null;

            const { data, error } = await supabase
                .from('attendance_sessions')
                .select('*, course:courses(id, title)')
                .eq('teacher_id', user.id)
                .eq('status', 'open')
                .order('open_time', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (error) throw error;
            return data as AttendanceSessionWithCourse | null;
        },
        refetchInterval: 10000, // Refresh every 10 seconds to keep stats updated
    });
}

// Get aggregated attendance stats for all students in a course
export function useCourseAttendanceStats(courseId: string, classId?: string, dateRange?: { from?: Date; to?: Date }) {
    return useQuery({
        queryKey: ['course-attendance-stats', courseId, classId, dateRange],
        queryFn: async () => {
            // 1. Fetch Sessions (to calculate total sessions so far)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let query: any = supabase
                .from('attendance_sessions')
                .select('id')
                .eq('course_id', courseId)
                .neq('status', 'open'); // Only count closed/finalized sessions for stats

            if (classId) {
                query = query.eq('class_id', classId);
            }

            // Apply date filters if present
            if (dateRange?.from) {
                query = query.gte('session_date', dateRange.from.toISOString().split('T')[0]);
            }
            if (dateRange?.to) {
                query = query.lte('session_date', dateRange.to.toISOString().split('T')[0]);
            }

            const { data: sessions, error: sessionError } = await query;

            if (sessionError) throw sessionError;

            // 2. Fetch Students
            // When classId is provided, use class_students (the ground truth for class rosters).
            // Fall back to enrollments for courses without a class context.
            let studentsData: { student_id: string; student: { id: string; name: string | null; email: string | null } | null }[] = [];

            if (classId) {
                const { data: classStudents, error: classError } = await supabase
                    .from('class_students')
                    .select('student_id, student:profiles!class_students_student_id_fkey(id, name, email)')
                    .eq('class_id', classId);

                if (classError) throw classError;
                studentsData = classStudents || [];
            } else {
                const { data: enrollments, error: enrollError } = await supabase
                    .from('enrollments')
                    .select('student_id, student:profiles!fk_enrollments_profiles(id, name, email)')
                    .eq('course_id', courseId);

                if (enrollError) throw enrollError;
                studentsData = enrollments || [];
            }

            // 3. Fetch Records
            const sessionIds = sessions.map(s => s.id);
            const { data: records, error: recordsError } = await supabase
                .from('attendance_records')
                .select('student_id, status')
                .in('session_id', sessionIds);

            if (recordsError) throw recordsError;

            // 4. Aggregate
            interface StudentStat {
                id: string;
                name: string;
                email: string;
                present: number;
                late: number;
                excused: number;
                sick: number;
                absent: number;
                sessionsCalculated: number;
                attendancePercentage: number;
            }

            const statsMap = new Map<string, StudentStat>();
            const totalSessions = sessions.length;

            // Initialize
            studentsData.forEach((enr) => {
                statsMap.set(enr.student_id, {
                    id: enr.student_id,
                    name: enr.student?.name ?? 'Unknown',
                    email: enr.student?.email ?? '',
                    present: 0,
                    late: 0,
                    excused: 0,
                    sick: 0,
                    absent: 0,
                    sessionsCalculated: 0,
                    attendancePercentage: 0
                });
            });

            // Count
            (records || []).forEach((rec: { student_id: string; status: string }) => {
                const student = statsMap.get(rec.student_id);
                if (student) {
                    if (rec.status === 'present') student.present++;
                    else if (rec.status === 'late') student.late++;
                    else if (rec.status === 'excused') student.excused++;
                    else if (rec.status === 'sick') student.sick++;
                    else if (rec.status === 'absent') student.absent++;

                    student.sessionsCalculated++;
                }
            });

            const stats = Array.from(statsMap.values()).map((s) => {
                const missing = totalSessions - s.sessionsCalculated;
                if (missing > 0) {
                    s.absent += missing;
                }

                s.attendancePercentage = totalSessions > 0
                    ? Math.round(((s.present + (s.late * 0.5)) / totalSessions) * 100)
                    : 0;

                return s;
            });

            // Sort by name
            return stats.sort((a, b) => a.name.localeCompare(b.name));

        },
        enabled: !!courseId
    });
}

// Student: Get Active Session for a specific Course
export function useActiveCourseSession(courseId: string) {
    return useQuery({
        queryKey: ['active-course-session', courseId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('attendance_sessions')
                .select('*, course:courses(id, title)')
                .eq('course_id', courseId)
                .eq('status', 'open')
                .order('open_time', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (error) throw error;
            return data as AttendanceSessionWithCourse | null;
        },
        enabled: !!courseId,
        refetchInterval: 5000, // Refresh frequently to catch new sessions
    });
}


// Sync attendance grades to report card
export function useSyncAttendanceGrades() {
    return useMutation({
        mutationFn: async (courseId: string) => {
            const { data, error } = await supabase.rpc('sync_course_attendance_grades', {
                p_course_id: courseId
            });

            if (error) throw error;
            return data;
        },
        onSuccess: (data: { success: boolean; updated_count?: number; message?: string }) => {
            if (data.success) {
                toast.success(`Attendance grades synced for ${data.updated_count} students`);
            } else {
                toast.error(data.message || 'Failed to sync grades');
            }
        },
        onError: (error: Error) => {
            console.error('Error syncing grades:', error);
            toast.error('Failed to sync attendance grades');
        }
    });
}


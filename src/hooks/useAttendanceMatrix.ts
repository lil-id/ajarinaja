import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AttendanceSession } from '@/types/attendance';
import { DateRange } from 'react-day-picker';
import { startOfMonth, endOfMonth, format, parseISO } from 'date-fns';

export interface AttendanceStatus {
    status: 'present' | 'absent' | 'late' | 'excused' | 'sick' | 'pending';
    check_in_time?: string;
    notes?: string;
    record_id?: string;
}

export interface StudentAttendanceRow {
    student_id: string;
    student_name: string;
    student_email: string;
    attendance: Record<string, AttendanceStatus>; // date string (YYYY-MM-DD) -> status
    stats: {
        present: number;
        late: number;
        excused: number;
        absent: number;
        total: number;
        percentage: number;
    };
}

export interface AttendanceSessionInfo {
    id: string;
    date: string;
    status: string;
    topic?: string;
}

interface UseAttendanceMatrixProps {
    courseId: string | undefined;
    classId?: string; // Added for class-based partitioning
    month: Date;
}

export const useAttendanceMatrix = ({ courseId, classId, month }: UseAttendanceMatrixProps) => {
    const startDate = startOfMonth(month);
    const endDate = endOfMonth(month);
    const startDateStr = format(startDate, 'yyyy-MM-dd');
    const endDateStr = format(endDate, 'yyyy-MM-dd');

    return useQuery({
        queryKey: ['attendance-matrix', courseId, classId, startDateStr, endDateStr],
        enabled: !!courseId,
        queryFn: async () => {
            // 1. Fetch Students
            // If classId is provided, we fetch students FROM that class
            let studentsData: any[] = [];
            if (classId) {
                const { data: classStudents, error: classError } = await supabase
                    .from('class_students')
                    .select(`
                        student_id,
                        student:profiles (
                            id,
                            name,
                            email
                        )
                    `)
                    .eq('class_id', classId);

                if (classError) throw classError;
                studentsData = classStudents || [];
            } else {
                // Fallback to enrollments if no classId (legacy or global view)
                const { data: enrollments, error: enrollError } = await supabase
                    .from('enrollments')
                    .select(`
                        student_id,
                        student:profiles (
                            id,
                            name,
                            email
                        )
                    `)
                    .eq('course_id', courseId);

                if (enrollError) throw enrollError;
                studentsData = enrollments || [];
            }

            const students = studentsData;

            // 2. Fetch Sessions in range
            let sessionsQuery = supabase
                .from('attendance_sessions')
                .select('*')
                .eq('course_id', courseId);

            if (classId) {
                sessionsQuery = sessionsQuery.eq('class_id', classId);
            }

            const { data: sessionsData, error: sessionError } = await sessionsQuery
                .gte('session_date', startDateStr)
                .lte('session_date', endDateStr)
                .order('session_date', { ascending: true });

            if (sessionError) throw sessionError;

            // Cast to typed array to handle Supabase type inference limits
            const sessions = sessionsData as AttendanceSession[];

            // 3. Fetch Records for these sessions
            const sessionIds = sessions.map(s => s.id);
            let records: any[] = [];

            if (sessionIds.length > 0) {
                const { data: attRecords, error: recordError } = await supabase
                    .from('attendance_records')
                    .select('*')
                    .in('session_id', sessionIds);

                if (recordError) throw recordError;
                records = attRecords;
            }

            // 4. Transform to Matrix
            // Map session ID to Date
            const sessionDateMap = new Map<string, string>(); // sessionId -> YYYY-MM-DD
            const dateSessionMap = new Map<string, AttendanceSessionInfo>(); // YYYY-MM-DD -> SessionInfo

            sessions.forEach(s => {
                sessionDateMap.set(s.id, s.session_date);
                dateSessionMap.set(s.session_date, {
                    id: s.id,
                    date: s.session_date,
                    status: s.status,
                    topic: s.topic
                });
            });

            // 5. Build Unified Student List
            // Collect all unique student IDs from students data AND records
            const studentIdsFromSource = new Set(students?.map((e: any) => e.student_id) || []);
            const recordStudentIds = new Set(records?.map((r: any) => r.student_id) || []);
            const allStudentIds = Array.from(new Set([...studentIdsFromSource, ...recordStudentIds]));

            // Identify students who are in records but NOT in class list (Ghost students)
            const missingProfileIds = allStudentIds.filter(id => !studentIdsFromSource.has(id));

            // Fetch profiles for ghost students if any
            let additionalProfiles: any[] = [];
            if (missingProfileIds.length > 0) {
                const { data: profiles, error: profileError } = await supabase
                    .from('profiles')
                    .select('id, name, email')
                    .in('id', missingProfileIds);

                if (!profileError && profiles) {
                    additionalProfiles = profiles;
                }
            }

            // Create a map of student ID -> Student Info
            const studentMap = new Map<string, { name: string; email: string }>();

            // Populate from students source
            students?.forEach((e: any) => {
                if (e.student) {
                    studentMap.set(e.student_id, {
                        name: e.student.name || 'Unknown',
                        email: e.student.email || ''
                    });
                }
            });

            // Populate from additional profiles (overrides or adds)
            additionalProfiles.forEach((p: any) => {
                studentMap.set(p.id, {
                    name: p.name || 'Unknown',
                    email: p.email || ''
                });
            });

            // Prepare Rows using ALL student IDs
            const rows: StudentAttendanceRow[] = allStudentIds.map((studentId) => {
                const studentInfo = studentMap.get(studentId) || { name: 'Unknown Student', email: '' };
                const studentName = studentInfo.name;
                const studentEmail = studentInfo.email;

                // Find records for this student
                const studentRecords = records.filter(r => r.student_id === studentId);

                const attendanceMap: Record<string, AttendanceStatus> = {};
                let present = 0;
                let late = 0;
                let excused = 0;
                let absent = 0;
                let sick = 0;

                // Iterate through ALL sessions for this month to ensure we cover every column
                sessions.forEach(session => {
                    const date = session.session_date;

                    // Find record for this specific session
                    const record = studentRecords.find(r => r.session_id === session.id);

                    if (record) {
                        // We have a record
                        attendanceMap[date] = {
                            status: record.status as any,
                            check_in_time: record.check_in_time,
                            notes: record.notes,
                            record_id: record.id
                        };

                        if (record.status === 'present') present++;
                        else if (record.status === 'late') late++;
                        else if (record.status === 'excused') excused++;
                        else if (record.status === 'sick') sick++;
                        else if (record.status === 'absent') absent++;
                    } else {
                        // No record logic...
                    }
                });

                const total = present + late + excused + sick + absent;
                const effectivePresent = present + late;
                const percentage = total > 0 ? (effectivePresent / total) * 100 : 0;

                return {
                    student_id: studentId,
                    student_name: studentName,
                    student_email: studentEmail,
                    attendance: attendanceMap,
                    stats: {
                        present,
                        late,
                        excused,
                        absent,
                        total,
                        percentage
                    }
                };
            });

            // Sort rows by name
            rows.sort((a, b) => a.student_name.localeCompare(b.student_name));

            return {
                rows,
                sessions: Array.from(dateSessionMap.values()).sort((a, b) => a.date.localeCompare(b.date))
            };
        }
    });
};

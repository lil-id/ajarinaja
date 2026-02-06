/**
 * @fileoverview Hook for fetching a specific child's attendance records
 * @description Allows parents to view their child's attendance history
 * 
 * @module hooks/useChildAttendance
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to fetch attendance records for a specific child
 * 
 * @param {string | undefined} childUserId - The user ID of the child
 * @param {string | undefined} courseId - Optional course ID to filter by specific course
 * @returns {Object} Attendance data and state
 * @returns {Array} attendanceRecords - Array of attendance records
 * @returns {Object} summary - Summary statistics (present, absent, excused, percentage)
 * @returns {boolean} isLoading - Loading state
 * @returns {Error | null} error - Error object if fetch failed
 * 
 * @example
 * ```tsx
 * const { attendanceRecords, summary, isLoading } = useChildAttendance(childId);
 * 
 * return (
 *   <div>
 *     <p>Attendance: {summary.percentage}%</p>
 *     {attendanceRecords.map(record => (
 *       <AttendanceRow key={record.id} record={record} />
 *     ))}
 *   </div>
 * );
 * ```
 */
export function useChildAttendance(
    childUserId: string | undefined,
    courseId?: string | undefined
) {
    const { data, isLoading, error } = useQuery({
        queryKey: ['child-attendance', childUserId, courseId],
        queryFn: async () => {
            if (!childUserId) return { records: [], summary: null };

            let query = supabase
                .from('attendance_records')
                .select(`
          id,
          status,
          notes,
          created_at,
            attendance_sessions (
              id,
              topic,
              session_number,
              session_date,
              course_id,
              courses (
                id,
                title
              )
            )
          `)
                .eq('student_id', childUserId)
                .order('created_at', { ascending: false });

            // Filter by course if provided
            if (courseId) {
                query = query.eq('attendance_sessions.course_id', courseId);
            }

            const { data: records, error: recordsError } = await query;

            if (recordsError) throw recordsError;

            // Calculate summary statistics
            const summary = {
                total: records.length,
                // Include 'late' in the present count as requested by user logic (since it counts towards 100%)
                present: records.filter((r: any) => r.status === 'present' || r.status === 'late').length,
                absent: records.filter((r: any) => r.status === 'absent').length,
                excused: records.filter((r: any) => r.status === 'excused').length,
                late: records.filter((r: any) => r.status === 'late').length,
                percentage: records.length > 0
                    ? Math.round(
                        (records.filter((r: any) => r.status === 'present' || r.status === 'late').length /
                            records.length) *
                        100
                    )
                    : 0,
            };

            return {
                records: records.map((record: any) => ({
                    id: record.id,
                    status: record.status,
                    session_date: record.attendance_sessions?.session_date,
                    excuse_note: record.notes,
                    created_at: record.created_at,
                    session_title: record.attendance_sessions?.topic || `Session ${record.attendance_sessions?.session_number}`,
                    course_id: record.attendance_sessions?.courses?.id,
                    course_title: record.attendance_sessions?.courses?.title,
                })),
                summary,
            };
        },
        enabled: !!childUserId,
    });

    return {
        attendanceRecords: data?.records || [],
        summary: data?.summary || {
            total: 0,
            present: 0,
            absent: 0,
            excused: 0,
            late: 0,
            percentage: 0,
        },
        isLoading,
        error,
    };
}

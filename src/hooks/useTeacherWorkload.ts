/**
 * @fileoverview Hook for analyzing teacher workload (operator only)
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useMemo } from 'react';

export interface TeacherWorkload {
    teacherId: string;
    teacherName: string;
    avatarUrl: string | null;
    totalWeeklyHours: number;
    studentCount: number;
    courseCount: number;
    utilizationIndex: number; // Percentage based on standard (e.g., 24h)
}

/** Standard weekly teaching load in hours */
const STANDARD_WORKLOAD_HOURS = 24;

/**
 * Parses time string (HH:mm:ss) into hours as a decimal
 */
function parseTimeToHours(timeStr: string): number {
    const [hours, minutes, seconds = 0] = timeStr.split(':').map(Number);
    return hours + minutes / 60 + seconds / 3600;
}

/**
 * Fetches and aggregates workload metrics for all teachers.
 */
export function useTeacherWorkload() {
    const { role } = useAuth();

    // 1. Fetch all teachers
    const teachersQuery = useQuery({
        queryKey: ['teachers-workload-base'],
        queryFn: async () => {
            const { data: userRoles, error: rolesError } = await supabase
                .from('user_roles')
                .select('user_id')
                .eq('role', 'teacher');
            if (rolesError) throw rolesError;

            const userIds = userRoles.map(ur => ur.user_id);
            if (userIds.length === 0) return [];

            const { data: profiles, error: profilesError } = await supabase
                .from('profiles')
                .select('user_id, name, avatar_url')
                .in('user_id', userIds);
            if (profilesError) throw profilesError;

            return profiles;
        },
        enabled: role === 'operator',
    });

    // 2. Fetch all schedules
    const schedulesQuery = useQuery({
        queryKey: ['all-class-schedules-workload'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('class_schedules')
                .select('teacher_id, start_time, end_time');
            if (error) throw error;
            return data;
        },
        enabled: role === 'operator',
    });

    // 3. Fetch all courses (to get course count and potentially student sum)
    const coursesQuery = useQuery({
        queryKey: ['all-courses-workload'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('courses')
                .select('id, teacher_id');
            if (error) throw error;
            return data;
        },
        enabled: role === 'operator',
    });

    // 4. Fetch enrollment counts per course
    const enrollmentsQuery = useQuery({
        queryKey: ['all-enrollments-count-workload'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('enrollments')
                .select('course_id');
            if (error) throw error;
            return data;
        },
        enabled: role === 'operator',
    });

    // Aggregate Data
    const workloadData = useMemo(() => {
        if (!teachersQuery.data || !schedulesQuery.data || !coursesQuery.data || !enrollmentsQuery.data) {
            return [];
        }

        const teachers = teachersQuery.data;
        const schedules = schedulesQuery.data;
        const courses = coursesQuery.data;
        const enrollments = enrollmentsQuery.data;

        // Map enrollments to courses
        const enrollmentMap = new Map<string, number>();
        enrollments.forEach(e => {
            enrollmentMap.set(e.course_id, (enrollmentMap.get(e.course_id) || 0) + 1);
        });

        // Map stats to teachers
        const teacherStats = new Map<string, { hours: number; students: number; courses: number }>();

        // Init map
        teachers.forEach(t => {
            teacherStats.set(t.user_id, { hours: 0, students: 0, courses: 0 });
        });

        // 1. Calculate hours from schedules
        schedules.forEach(s => {
            if (!s.teacher_id || !teacherStats.has(s.teacher_id)) return;
            const start = parseTimeToHours(s.start_time);
            const end = parseTimeToHours(s.end_time);
            const duration = Math.max(0, end - start);
            const current = teacherStats.get(s.teacher_id)!;
            current.hours += duration;
        });

        // 2. Calculate course and student counts
        courses.forEach(c => {
            if (!c.teacher_id || !teacherStats.has(c.teacher_id)) return;
            const current = teacherStats.get(c.teacher_id)!;
            current.courses += 1;
            current.students += enrollmentMap.get(c.id) || 0;
        });

        return teachers.map(t => {
            const stats = teacherStats.get(t.user_id)!;
            return {
                teacherId: t.user_id,
                teacherName: t.name,
                avatarUrl: t.avatar_url,
                totalWeeklyHours: Number(stats.hours.toFixed(1)),
                studentCount: stats.students,
                courseCount: stats.courses,
                utilizationIndex: Math.round((stats.hours / STANDARD_WORKLOAD_HOURS) * 100),
            };
        }).sort((a, b) => b.totalWeeklyHours - a.totalWeeklyHours);
    }, [teachersQuery.data, schedulesQuery.data, coursesQuery.data, enrollmentsQuery.data]);

    return {
        workload: workloadData,
        isLoading: teachersQuery.isLoading || schedulesQuery.isLoading || coursesQuery.isLoading || enrollmentsQuery.isLoading,
        error: teachersQuery.error || schedulesQuery.error || coursesQuery.error || enrollmentsQuery.error,
    };
}

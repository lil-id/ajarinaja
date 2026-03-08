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
    totalWeeklyHours: number; // Total JTM = Base + Additional
    baseWeeklyHours: number; // Base JTM from schedules
    additionalHours: number; // Additional JP (e.g. 2 JP for Homeroom)
    studentCount: number;
    courseCount: number;
    complianceStatus: 'underload' | 'ideal' | 'overload';
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

    // 5. Fetch classes to determine homeroom teacher assignments
    const classesQuery = useQuery({
        queryKey: ['all-classes-workload'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('classes')
                .select('id, homeroom_teacher_id');
            if (error) throw error;
            return data;
        },
        enabled: role === 'operator',
    });

    // Aggregate Data
    const workloadData = useMemo(() => {
        if (!teachersQuery.data || !schedulesQuery.data || !coursesQuery.data || !enrollmentsQuery.data || !classesQuery.data) {
            return [];
        }

        const teachers = teachersQuery.data;
        const schedules = schedulesQuery.data;
        const courses = coursesQuery.data;
        const enrollments = enrollmentsQuery.data;
        const classesInfo = classesQuery.data;

        // Map enrollments to courses
        const enrollmentMap = new Map<string, number>();
        enrollments.forEach(e => {
            enrollmentMap.set(e.course_id, (enrollmentMap.get(e.course_id) || 0) + 1);
        });

        // Map homeroom duties to teachers
        const homeroomClassCount = new Map<string, number>();
        classesInfo.forEach(c => {
            if (c.homeroom_teacher_id) {
                homeroomClassCount.set(c.homeroom_teacher_id, (homeroomClassCount.get(c.homeroom_teacher_id) || 0) + 1);
            }
        });

        // Map stats to teachers
        const teacherStats = new Map<string, { baseHours: number; additionalHours: number; students: number; courses: number }>();

        // Init map
        teachers.forEach(t => {
            // Assign 2 JP (hours) for each homeroom class they manage
            const additionalJp = (homeroomClassCount.get(t.user_id) || 0) * 2;
            teacherStats.set(t.user_id, { baseHours: 0, additionalHours: additionalJp, students: 0, courses: 0 });
        });

        // 1. Calculate Base JTM from schedules
        schedules.forEach(s => {
            if (!s.teacher_id || !teacherStats.has(s.teacher_id)) return;
            const start = parseTimeToHours(s.start_time);
            const end = parseTimeToHours(s.end_time);
            const duration = Math.max(0, end - start);
            const current = teacherStats.get(s.teacher_id)!;
            current.baseHours += duration;
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
            const totalHours = Number((stats.baseHours + stats.additionalHours).toFixed(1));

            // Compliance logic based on Permendikdasmen No.11 2025
            // 0-23: Underload
            // 24-40: Ideal
            // >40: Overload
            let status: 'underload' | 'ideal' | 'overload' = 'ideal';
            if (totalHours < 24) status = 'underload';
            else if (totalHours > 40) status = 'overload';

            return {
                teacherId: t.user_id,
                teacherName: t.name,
                avatarUrl: t.avatar_url,
                totalWeeklyHours: totalHours,
                baseWeeklyHours: Number(stats.baseHours.toFixed(1)),
                additionalHours: stats.additionalHours,
                studentCount: stats.students,
                courseCount: stats.courses,
                complianceStatus: status,
            };
        }).sort((a, b) => b.totalWeeklyHours - a.totalWeeklyHours);
    }, [teachersQuery.data, schedulesQuery.data, coursesQuery.data, enrollmentsQuery.data, classesQuery.data]);

    return {
        workload: workloadData,
        isLoading: teachersQuery.isLoading || schedulesQuery.isLoading || coursesQuery.isLoading || enrollmentsQuery.isLoading || classesQuery.isLoading,
        error: teachersQuery.error || schedulesQuery.error || coursesQuery.error || enrollmentsQuery.error || classesQuery.error,
    };
}

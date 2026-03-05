/**
 * @fileoverview Hook for exporting teacher data as CSV
 * @description Fetches teacher profiles with their course titles and exports to CSV.
 * Operator-only functionality.
 */

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toCsv, downloadCsv } from '@/utils/csvExport';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface TeacherExportRow {
    [key: string]: unknown;
    name: string;
    courses: string;
    email: string;
}

/**
 * Hook that provides a function to export teacher data as CSV.
 * Fetches teacher profiles and their associated courses on demand.
 */
export function useExportTeachers() {
    const { t } = useTranslation();
    const [isExporting, setIsExporting] = useState(false);

    const exportTeachers = async () => {
        setIsExporting(true);
        try {
            // 1. Get all teacher user IDs
            const { data: teacherRoles, error: rolesError } = await supabase
                .from('user_roles')
                .select('user_id')
                .eq('role', 'teacher' as unknown as 'teacher');

            if (rolesError) throw rolesError;
            if (!teacherRoles || teacherRoles.length === 0) {
                toast.info(t('operator.users.exportEmpty'));
                return;
            }

            const teacherIds = teacherRoles.map(r => r.user_id);

            // 2. Fetch profiles and courses in parallel
            const [{ data: profiles, error: profilesError }, { data: courses, error: coursesError }] = await Promise.all([
                supabase
                    .from('profiles')
                    .select('user_id, name, email')
                    .in('user_id', teacherIds),
                supabase
                    .from('courses')
                    .select('teacher_id, title')
                    .in('teacher_id', teacherIds),
            ]);

            if (profilesError) throw profilesError;
            if (coursesError) throw coursesError;

            // 3. Build course map: teacher_id -> comma-separated course titles
            const courseMap = new Map<string, string[]>();
            courses?.forEach(c => {
                const existing = courseMap.get(c.teacher_id) || [];
                existing.push(c.title);
                courseMap.set(c.teacher_id, existing);
            });

            // 4. Build export rows
            const rows: TeacherExportRow[] = (profiles || []).map(p => ({
                name: p.name,
                courses: (courseMap.get(p.user_id) || []).join(', '),
                email: p.email,
            }));

            // 5. Generate and download CSV
            const csv = toCsv<TeacherExportRow>(
                [
                    { key: 'name', label: 'Nama' },
                    { key: 'courses', label: 'Mata Pelajaran' },
                    { key: 'email', label: 'Email' },
                ],
                rows,
            );

            const date = new Date().toISOString().slice(0, 10);
            downloadCsv(csv, `data-guru_${date}.csv`);
            toast.success(t('operator.users.exportSuccess'));
        } catch (error) {
            console.error('Failed to export teachers:', error);
            toast.error(t('toast.genericError'));
        } finally {
            setIsExporting(false);
        }
    };

    return { exportTeachers, isExporting };
}

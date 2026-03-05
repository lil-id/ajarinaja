/**
 * @fileoverview Hook for exporting student data as CSV
 * @description Fetches student profiles with linked parent email and exports to CSV.
 * Operator-only functionality.
 */

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toCsv, downloadCsv } from '@/utils/csvExport';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface StudentExportRow {
    [key: string]: unknown;
    name: string;
    email: string;
    parent_email: string;
}

/**
 * Hook that provides a function to export student data as CSV.
 * Fetches student profiles and their linked parent emails on demand.
 */
export function useExportStudents() {
    const { t } = useTranslation();
    const [isExporting, setIsExporting] = useState(false);

    const exportStudents = async () => {
        setIsExporting(true);
        try {
            // 1. Get all student user IDs
            const { data: studentRoles, error: rolesError } = await supabase
                .from('user_roles')
                .select('user_id')
                .eq('role', 'student' as unknown as 'student');

            if (rolesError) throw rolesError;
            if (!studentRoles || studentRoles.length === 0) {
                toast.info(t('operator.users.exportEmpty'));
                return;
            }

            const studentIds = studentRoles.map(r => r.user_id);

            // 2. Fetch student profiles
            const { data: profiles, error: profilesError } = await supabase
                .from('profiles')
                .select('user_id, name, email')
                .in('user_id', studentIds);

            if (profilesError) throw profilesError;

            // 3. Fetch parent-child relationships + parent profiles
            const { data: parentLinks, error: linksError } = await supabase
                .from('parent_child_relationships')
                .select('student_user_id, parent_user_id')
                .in('student_user_id', studentIds);

            if (linksError) throw linksError;

            // Get parent profile emails
            const parentIds = [...new Set((parentLinks || []).map(l => l.parent_user_id))];
            const parentEmailMap = new Map<string, string>();

            if (parentIds.length > 0) {
                const { data: parentProfiles, error: parentError } = await supabase
                    .from('profiles')
                    .select('user_id, email')
                    .in('user_id', parentIds);

                if (parentError) throw parentError;

                // Build child_id -> parent email map
                const parentIdToEmail = new Map<string, string>();
                parentProfiles?.forEach(p => parentIdToEmail.set(p.user_id, p.email));

                parentLinks?.forEach(link => {
                    const email = parentIdToEmail.get(link.parent_user_id);
                    if (email) {
                        parentEmailMap.set(link.student_user_id, email);
                    }
                });
            }

            // 4. Build export rows
            const rows: StudentExportRow[] = (profiles || []).map(p => ({
                name: p.name,
                email: p.email,
                parent_email: parentEmailMap.get(p.user_id) || '',
            }));

            // 5. Generate and download CSV
            const csv = toCsv<StudentExportRow>(
                [
                    { key: 'name', label: 'Nama' },
                    { key: 'email', label: 'Email' },
                    { key: 'parent_email', label: 'Email Orang Tua' },
                ],
                rows,
            );

            const date = new Date().toISOString().slice(0, 10);
            downloadCsv(csv, `data-siswa_${date}.csv`);
            toast.success(t('operator.users.exportSuccess'));
        } catch (error) {
            console.error('Failed to export students:', error);
            toast.error(t('toast.genericError'));
        } finally {
            setIsExporting(false);
        }
    };

    return { exportStudents, isExporting };
}

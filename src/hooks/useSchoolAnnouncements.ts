/**
 * @fileoverview Hooks for school-wide announcements (operator-managed).
 * @description CRUD operations and realtime subscription for announcements
 * visible to the entire school, separate from course-scoped announcements.
 */

import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useEffect } from 'react';

export interface SchoolAnnouncement {
    id: string;
    author_id: string;
    title: string;
    content: string;
    is_pinned: boolean;
    target_roles: string[];
    created_at: string;
    updated_at: string;
}

const QUERY_KEY = 'school-announcements';

/**
 * Fetches all school-wide announcements.
 * Ordered by pinned first, then newest.
 * RLS ensures users only see announcements targeting their role.
 */
export function useSchoolAnnouncements() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const { data: announcements = [], isLoading, error } = useQuery({
        queryKey: [QUERY_KEY],
        queryFn: async (): Promise<SchoolAnnouncement[]> => {
            const { data, error } = await supabase
                .from('school_announcements')
                .select('*')
                .order('is_pinned', { ascending: false })
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as SchoolAnnouncement[];
        },
        enabled: !!user,
    });

    // Realtime subscription for live updates
    useEffect(() => {
        if (!user) return;

        const channel = supabase
            .channel('school-announcements-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'school_announcements',
                },
                () => {
                    queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, queryClient]);

    return { announcements, isLoading, error };
}

/**
 * Mutation hook to create a new school-wide announcement.
 */
export function useCreateSchoolAnnouncement() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            title,
            content,
            is_pinned = false,
            target_roles = ['teacher', 'student', 'parent'],
        }: {
            title: string;
            content: string;
            is_pinned?: boolean;
            target_roles?: string[];
        }) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const { data, error } = await supabase
                .from('school_announcements')
                .insert({
                    author_id: user.id,
                    title,
                    content,
                    is_pinned,
                    target_roles,
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
        },
    });
}

/**
 * Mutation hook to delete a school-wide announcement.
 */
export function useDeleteSchoolAnnouncement() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('school_announcements')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
        },
    });
}

/**
 * Mutation hook to toggle the pin status of a school-wide announcement.
 */
export function useToggleSchoolAnnouncementPin() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, is_pinned }: { id: string; is_pinned: boolean }) => {
            const { data, error } = await supabase
                .from('school_announcements')
                .update({ is_pinned })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
        },
    });
}

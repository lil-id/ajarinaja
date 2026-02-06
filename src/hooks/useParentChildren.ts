/**
 * @fileoverview Hook for managing parent's children list
 * @description Fetches and manages the list of children linked to a parent account
 * 
 * @module hooks/useParentChildren
 */


import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { ChildProfile } from '@/types';

/**
 * Hook to fetch all children linked to the current parent
 * 
 * @returns {Object} Children data and state
 * @returns {ChildProfile[]} children - Array of child profiles
 * @returns {boolean} isLoading - Loading state
 * @returns {Error | null} error - Error object if fetch failed
 * 
 * @example
 * ```tsx
 * const { children, isLoading } = useParentChildren();
 * 
 * if (isLoading) return <div>Loading...</div>;
 * 
 * return (
 *   <div>
 *     {children.map(child => (
 *       <ChildCard key={child.user_id} child={child} />
 *     ))}
 *   </div>
 * );
 * ```
 */
export function useParentChildren() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // Fetch children with their profile data
    const { data: children = [], isLoading, error } = useQuery<ChildProfile[]>({
        queryKey: ['parent-children', user?.id],
        queryFn: async () => {
            if (!user) return [];

            // First get the relationships
            const { data: relationships, error: relError } = await supabase
                .from('parent_child_relationships')
                .select('id, student_user_id, verified_at')
                .eq('parent_user_id', user.id)
                .eq('is_active', true)
                .order('verified_at', { ascending: false });

            if (relError) throw relError;
            if (!relationships || relationships.length === 0) return [];

            // Get student IDs
            const studentIds = relationships.map(rel => rel.student_user_id);

            // Then fetch profiles for those students
            const { data: profiles, error: profileError } = await supabase
                .from('profiles')
                .select('user_id, name, email, avatar_url')
                .in('user_id', studentIds);

            if (profileError) throw profileError;

            // Create a map for quick lookup
            const profileMap = new Map(
                profiles?.map(p => [p.user_id, p]) || []
            );

            // Merge the data
            return relationships.map(rel => {
                const profile = profileMap.get(rel.student_user_id);
                return {
                    relationship_id: rel.id,
                    verified_at: rel.verified_at,
                    user_id: rel.student_user_id,
                    name: profile?.name || 'Unknown',
                    email: profile?.email || '',
                    avatar_url: profile?.avatar_url || null,
                    role: 'student' as const,
                };
            });
        },
        enabled: !!user,
    });

    // Real-time subscription for relationship changes
    useEffect(() => {
        if (!user) return;

        const channel = supabase
            .channel('parent-children-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'parent_child_relationships',
                    filter: `parent_user_id=eq.${user.id}`,
                },
                () => {
                    // Invalidate and refetch when relationships change
                    queryClient.invalidateQueries({ queryKey: ['parent-children', user.id] });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, queryClient]);

    return {
        children,
        isLoading,
        error,
    };
}

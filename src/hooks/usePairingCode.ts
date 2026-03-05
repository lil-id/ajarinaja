/**
 * @fileoverview Hook for managing student pairing codes
 * @description Provides functionality for students to view, copy, and regenerate their pairing code
 * that parents use to link their account
 * 
 * @module hooks/usePairingCode
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import type { PairingCode } from '@/types';

/**
 * Hook to manage student pairing codes
 * 
 * @returns {Object} Pairing code data and mutation functions
 * @returns {string | undefined} pairingCode - The active pairing code
 * @returns {boolean} isLoading - Loading state for fetching code
 * @returns {Function} regenerate - Function to regenerate pairing code
 * @returns {boolean} isRegenerating - Loading state for regeneration
 * @returns {Function} copyToClipboard - Function to copy code to clipboard
 * @returns {Array} connectedParents - List of parents connected via this code
 * @returns {Function} removeParent - Function to remove a parent's access
 * 
 * @example
 * ```tsx
 * const { pairingCode, regenerate, copyToClipboard } = usePairingCode();
 * 
 * return (
 *   <div>
 *     <p>Your code: {pairingCode}</p>
 *     <button onClick={copyToClipboard}>Copy</button>
 *     <button onClick={() => regenerate()}>Regenerate</button>
 *   </div>
 * );
 * ```
 */
export function usePairingCode() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // Fetch current active pairing code
    const { data: pairingCode, isLoading } = useQuery({
        queryKey: ['pairing-code', user?.id],
        queryFn: async () => {
            if (!user) return null;

            const { data, error } = await supabase
                .from('student_pairing_codes')
                .select('code')
                .eq('student_user_id', user.id)
                .eq('is_active', true)
                .maybeSingle();

            if (error) throw error;
            return data?.code || null;
        },
        enabled: !!user,
    });

    // Fetch connected parents
    const { data: connectedParents = [] } = useQuery({
        queryKey: ['connected-parents', user?.id],
        queryFn: async () => {
            if (!user) return [];

            // First get the relationships
            const { data: relationships, error: relError } = await supabase
                .from('parent_child_relationships')
                .select('id, parent_user_id, verified_at')
                .eq('student_user_id', user.id)
                .eq('is_active', true);

            if (relError) throw relError;
            if (!relationships || relationships.length === 0) return [];

            // Get parent user IDs
            const parentIds = relationships.map(rel => rel.parent_user_id);

            // Fetch profiles for those parents
            const { data: profiles, error: profileError } = await supabase
                .from('profiles')
                .select('user_id, name, email, avatar_url')
                .in('user_id', parentIds);

            if (profileError) throw profileError;

            // Create a map for quick lookup
            const profileMap = new Map(
                profiles?.map(p => [p.user_id, p]) || []
            );

            // Merge the data
            return relationships.map(rel => {
                const profile = profileMap.get(rel.parent_user_id);
                return {
                    relationship_id: rel.id,
                    parent_user_id: rel.parent_user_id,
                    name: profile?.name || 'Unknown',
                    email: profile?.email || '',
                    avatar_url: profile?.avatar_url || null,
                    verified_at: rel.verified_at,
                };
            });
        },
        enabled: !!user,
    });

    // Regenerate pairing code mutation
    const regenerateMutation = useMutation({
        mutationFn: async () => {
            if (!user) throw new Error('No user logged in');

            const { data, error } = await supabase.rpc('regenerate_pairing_code', {
                p_student_user_id: user.id,
            });

            if (error) throw error;
            return data;
        },
        onSuccess: (newCode) => {
            queryClient.invalidateQueries({ queryKey: ['pairing-code', user?.id] });
            queryClient.invalidateQueries({ queryKey: ['connected-parents', user?.id] });
            toast({
                title: 'Code Regenerated',
                description: `Your new pairing code is ${newCode}. All previous parent connections have been removed.`,
            });
        },
        onError: (error: Error) => {
            console.error('Regenerate code error:', error);
            // Hide raw SQL errors from user
            const message = error.message.includes('unique constraint')
                ? 'Failed to generate a new code. Please try again.'
                : (error.message || 'Failed to regenerate pairing code');

            toast({
                title: 'Error',
                description: message,
                variant: 'destructive',
            });
        },
    });

    // Remove parent access mutation
    const removeParentMutation = useMutation({
        mutationFn: async (parentUserId: string) => {
            if (!user) throw new Error('No user logged in');

            const { data, error } = await supabase.rpc('remove_parent_access', {
                p_student_user_id: user.id,
                p_parent_user_id: parentUserId,
            });

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['connected-parents', user?.id] });
            toast({
                title: 'Success',
                description: 'Parent access removed successfully',
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Error',
                description: error.message || 'Failed to remove parent access',
                variant: 'destructive',
            });
        },
    });

    // Copy to clipboard helper
    const copyToClipboard = async () => {
        if (!pairingCode) {
            toast({
                title: 'Error',
                description: 'No pairing code available',
                variant: 'destructive',
            });
            return;
        }

        try {
            await navigator.clipboard.writeText(pairingCode);
            toast({
                title: 'Copied!',
                description: 'Pairing code copied to clipboard',
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to copy to clipboard',
                variant: 'destructive',
            });
        }
    };

    return {
        pairingCode,
        isLoading,
        regenerate: regenerateMutation.mutate,
        isRegenerating: regenerateMutation.isPending,
        connectedParents,
        removeParent: removeParentMutation.mutate,
        isRemovingParent: removeParentMutation.isPending,
        copyToClipboard,
    };
}

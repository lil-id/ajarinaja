/**
 * @fileoverview Hook for verifying and adding a child to parent account
 * @description Handles the pairing code verification flow for parents
 * 
 * @module hooks/useVerifyChild
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface VerifyChildParams {
    student_user_id: string;
    pairing_code: string;
}

interface VerifyChildResponse {
    success: boolean;
    error?: string;
    relationship_id?: string;
}

/**
 * Hook to verify pairing code and add child to parent account
 * 
 * @returns {Object} Verification function and state
 * @returns {Function} verifyChild - Function to verify pairing code
 * @returns {boolean} isVerifying - Loading state
 * @returns {Error | null} error - Error object if verification failed
 * @returns {boolean} isSuccess - Success state
 * 
 * @example
 * ```tsx
 * const { verifyChild, isVerifying } = useVerifyChild();
 * 
 * const handleVerify = async () => {
 *   await verifyChild({
 *     student_user_id: 'student-uuid',
 *     pairing_code: 'ABC-123-DEF'
 *   });
 * };
 * ```
 */
export function useVerifyChild() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async ({ student_user_id, pairing_code }: VerifyChildParams): Promise<VerifyChildResponse> => {
            if (!user) {
                throw new Error('No user logged in');
            }

            const { data, error } = await supabase.rpc('verify_pairing_code', {
                p_parent_user_id: user.id,
                p_student_user_id: student_user_id,
                p_pairing_code: pairing_code.toUpperCase().trim(),
            });

            if (error) throw error;

            // RPC function returns JSON object
            const response = data as VerifyChildResponse;

            if (!response.success) {
                throw new Error(response.error || 'Verification failed');
            }

            return response;
        },
        onSuccess: () => {
            // Invalidate children list to refetch with new child
            queryClient.invalidateQueries({ queryKey: ['parent-children', user?.id] });

            toast({
                title: 'Success!',
                description: 'Child added successfully. You can now view their progress.',
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Verification Failed',
                description: error.message || 'Invalid pairing code. Please try again.',
                variant: 'destructive',
            });
        },
    });

    return {
        verifyChild: mutation.mutate,
        verifyChildAsync: mutation.mutateAsync,
        isVerifying: mutation.isPending,
        isSuccess: mutation.isSuccess,
        error: mutation.error,
    };
}

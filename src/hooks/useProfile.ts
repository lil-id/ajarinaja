import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import i18next from 'i18next';

interface UpdateProfileData {
  name?: string;
  bio?: string;
  avatar_url?: string | null;
}

/**
 * Mutation hook to update the user's profile.
 * 
 * @returns {UseMutationResult} The mutation result.
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (updates: UpdateProfileData) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success(i18next.t('toast.profileUpdated'));
    },
    onError: (error) => {
      toast.error(`${i18next.t('toast.failedToUpdateProfile')}: ${error.message}`);
    },
  });
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/hooks/useAuth';

export interface RiskSettings {
  id: string;
  teacher_id: string;
  high_risk_missed_assignments: number;
  high_risk_below_kkm_count: number;
  medium_risk_missed_assignments: number;
  medium_risk_below_kkm_count: number;
  low_risk_late_submissions: number;
  low_risk_material_view_percent: number;
  created_at: string;
  updated_at: string;
}

// Default settings
export const DEFAULT_RISK_SETTINGS: Omit<RiskSettings, 'id' | 'teacher_id' | 'created_at' | 'updated_at'> = {
  high_risk_missed_assignments: 3,
  high_risk_below_kkm_count: 2,
  medium_risk_missed_assignments: 1,
  medium_risk_below_kkm_count: 1,
  low_risk_late_submissions: 1,
  low_risk_material_view_percent: 50,
};

/**
 * Custom hook to manage risk settings for at-risk student analysis.
 * 
 * @returns {object} The risk settings, loading state, and save function.
 */
export function useRiskSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['risk-settings', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('risk_settings')
        .select('*')
        .eq('teacher_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as RiskSettings | null;
    },
    enabled: !!user,
  });

  const saveSettings = useMutation({
    mutationFn: async (newSettings: Partial<Omit<RiskSettings, 'id' | 'teacher_id' | 'created_at' | 'updated_at'>>) => {
      if (!user) throw new Error('Not authenticated');

      // Check if settings exist
      const { data: existing } = await supabase
        .from('risk_settings')
        .select('id')
        .eq('teacher_id', user.id)
        .maybeSingle();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('risk_settings')
          .update(newSettings)
          .eq('teacher_id', user.id);
        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('risk_settings')
          .insert({ ...newSettings, teacher_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['risk-settings'] });
      queryClient.invalidateQueries({ queryKey: ['at-risk-students'] });
    },
  });

  // Return effective settings (user's or defaults)
  const effectiveSettings = settings ?? {
    ...DEFAULT_RISK_SETTINGS,
    id: '',
    teacher_id: user?.id ?? '',
    created_at: '',
    updated_at: '',
  };

  return {
    settings: effectiveSettings,
    isLoading,
    saveSettings,
    hasCustomSettings: !!settings,
  };
}

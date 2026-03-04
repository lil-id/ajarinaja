import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import i18next from 'i18next';

export interface AcademicPeriod {
  id: string;
  name: string;
  academic_year: string;
  semester: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAcademicPeriodData {
  name: string;
  academic_year: string;
  semester: number;
  start_date: string;
  end_date: string;
  is_active?: boolean;
}

/**
 * Custom hook to manage academic periods.
 * Provides functions to fetch, create, update, delete, and set active academic periods.
 * 
 * @returns {object} The state and mutation functions for academic periods.
 */
export function useAcademicPeriods() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const periodsQuery = useQuery({
    queryKey: ['academic-periods'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('academic_periods')
        .select('*')
        .order('academic_year', { ascending: false })
        .order('semester', { ascending: false });

      if (error) throw error;
      return data as AcademicPeriod[];
    },
    enabled: !!user,
  });

  const createPeriod = useMutation({
    mutationFn: async (periodData: CreateAcademicPeriodData) => {
      const { data, error } = await supabase
        .from('academic_periods')
        .insert({
          ...periodData,
          created_by: user!.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-periods'] });
      toast.success(i18next.t('toast.periodCreated'));
    },
    onError: (error: Error) => {
      toast.error(`${i18next.t('toast.failedToCreatePeriod')}: ${error.message}`);
    },
  });

  const updatePeriod = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AcademicPeriod> & { id: string }) => {
      const { data, error } = await supabase
        .from('academic_periods')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-periods'] });
      toast.success(i18next.t('toast.periodUpdated'));
    },
    onError: (error: Error) => {
      toast.error(`${i18next.t('toast.failedToUpdatePeriod')}: ${error.message}`);
    },
  });

  const deletePeriod = useMutation({
    mutationFn: async (periodId: string) => {
      const { error } = await supabase
        .from('academic_periods')
        .delete()
        .eq('id', periodId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-periods'] });
      toast.success(i18next.t('toast.periodDeleted'));
    },
    onError: (error: Error) => {
      toast.error(`${i18next.t('toast.failedToDeletePeriod')}: ${error.message}`);
    },
  });

  const setActivePeriod = useMutation({
    mutationFn: async (periodId: string) => {
      // First, deactivate all periods
      await supabase
        .from('academic_periods')
        .update({ is_active: false })
        .eq('created_by', user!.id);

      // Then activate the selected one
      const { data, error } = await supabase
        .from('academic_periods')
        .update({ is_active: true })
        .eq('id', periodId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-periods'] });
      toast.success(i18next.t('toast.activePeriodChanged'));
    },
    onError: (error: Error) => {
      toast.error(`${i18next.t('toast.failedToChangeActivePeriod')}: ${error.message}`);
    },
  });

  return {
    periods: periodsQuery.data || [],
    isLoading: periodsQuery.isLoading,
    error: periodsQuery.error,
    createPeriod,
    updatePeriod,
    deletePeriod,
    setActivePeriod,
  };
}

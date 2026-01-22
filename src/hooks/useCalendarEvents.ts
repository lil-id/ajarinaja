import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface CalendarEvent {
  id: string;
  teacher_id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_type: string;
  course_id: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Custom hook to fetch calendar events for the current user.
 * 
 * @returns {object} The calendar events, loading state, and error.
 */
export function useCalendarEvents() {
  const { user } = useAuth();

  const { data: events = [], isLoading, error } = useQuery({
    queryKey: ['calendar-events', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('teacher_id', user.id)
        .order('event_date', { ascending: true });
      if (error) throw error;
      return data as CalendarEvent[];
    },
    enabled: !!user,
  });

  return { events, isLoading, error };
}

/**
 * Mutation hook to create a new calendar event.
 * 
 * @returns {UseMutationResult} The mutation result.
 */
export function useCreateCalendarEvent() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (event: {
      title: string;
      description?: string;
      event_date: string;
      event_type?: string;
      course_id?: string | null;
    }) => {
      if (!user) throw new Error('User not authenticated');
      const { data, error } = await supabase
        .from('calendar_events')
        .insert({
          teacher_id: user.id,
          title: event.title,
          description: event.description || null,
          event_date: event.event_date,
          event_type: event.event_type || 'custom',
          course_id: event.course_id || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
    },
  });
}

/**
 * Mutation hook to update an existing calendar event.
 * 
 * @returns {UseMutationResult} The mutation result.
 */
export function useUpdateCalendarEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string;
      title?: string;
      description?: string;
      event_date?: string;
      event_type?: string;
      course_id?: string | null;
    }) => {
      const { data, error } = await supabase
        .from('calendar_events')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
    },
  });
}

/**
 * Mutation hook to delete a calendar event.
 * 
 * @returns {UseMutationResult} The mutation result.
 */
export function useDeleteCalendarEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
    },
  });
}

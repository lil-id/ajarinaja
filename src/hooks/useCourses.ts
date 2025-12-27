import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export interface Course {
  id: string;
  title: string;
  description: string | null;
  teacher_id: string;
  thumbnail_url: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface CourseWithTeacher extends Course {
  teacher_name: string;
  enrolled_count: number;
  exam_count: number;
}

export function useCourses() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: courses = [], isLoading, error } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Course[];
    },
    enabled: !!user,
  });

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('courses-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'courses',
        },
        (payload: RealtimePostgresChangesPayload<Course>) => {
          console.log('Course change:', payload);
          queryClient.invalidateQueries({ queryKey: ['courses'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  return { courses, isLoading, error };
}

export function useTeacherCourses() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: courses = [], isLoading, error } = useQuery({
    queryKey: ['teacher-courses', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('teacher_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Course[];
    },
    enabled: !!user,
  });

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('teacher-courses-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'courses',
          filter: `teacher_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['teacher-courses', user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  return { courses, isLoading, error };
}

export function useCreateCourse() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ title, description }: { title: string; description: string }) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('courses')
        .insert({
          title,
          description,
          teacher_id: user.id,
          status: 'draft',
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-courses'] });
    },
  });
}

export function useUploadCourseThumbnail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ courseId, file }: { courseId: string; file: File }) => {
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const filePath = `${courseId}/thumbnail.${fileExt}`;
      
      // Delete existing thumbnail if any
      await supabase.storage
        .from('course-thumbnails')
        .remove([filePath]);
      
      const { error: uploadError } = await supabase.storage
        .from('course-thumbnails')
        .upload(filePath, file, { upsert: true });
      
      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('course-thumbnails')
        .getPublicUrl(filePath);

      // Update course with thumbnail URL
      const { data, error } = await supabase
        .from('courses')
        .update({ thumbnail_url: urlData.publicUrl })
        .eq('id', courseId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-courses'] });
    },
  });
}

export function useUpdateCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Course> & { id: string }) => {
      const { data, error } = await supabase
        .from('courses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-courses'] });
    },
  });
}

export function useDeleteCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-courses'] });
    },
  });
}

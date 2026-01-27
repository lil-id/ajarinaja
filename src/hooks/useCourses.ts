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
  category?: string;
  teacher?: {
    name: string | null;
    email: string | null;
    avatar_url: string | null;
  };
}

export interface CourseWithTeacher extends Course {
  teacher_name: string;
  enrolled_count: number;
  exam_count: number;
}

/**
 * Custom hook to fetch all courses.
 * 
 * @returns {object} The courses, loading state, and error.
 */
export function useCourses() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: courses = [], isLoading, error } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      // 1. Fetch courses
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });

      if (coursesError) throw coursesError;

      // 2. Fetch teachers
      const teacherIds = [...new Set(coursesData.map(c => c.teacher_id).filter(Boolean))];

      let teachersMap: Record<string, any> = {};

      if (teacherIds.length > 0) {
        const { data: teachersData, error: teachersError } = await supabase
          .from('profiles')
          .select('user_id, name, email, avatar_url')
          .in('user_id', teacherIds);

        if (!teachersError && teachersData) {
          teachersMap = teachersData.reduce((acc, teacher) => {
            acc[teacher.user_id] = teacher;
            return acc;
          }, {} as Record<string, any>);
        }
      }

      // 3. Combine
      return coursesData.map(course => ({
        ...course,
        teacher: teachersMap[course.teacher_id] || null
      })) as Course[];
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

/**
 * Custom hook to fetch a single course by ID.
 * 
 * @param {string} courseId - The ID of the course.
 * @returns {object} The course data, loading state, and error.
 */
export function useCourse(courseId: string) {
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      // 1. Fetch course details
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .maybeSingle();

      if (courseError) throw courseError;
      if (!courseData) return null;

      // 2. Fetch teacher profile manually
      let teacherProfile = null;
      if (courseData.teacher_id) {
        // console.log('Fetching teacher for:', courseData.teacher_id);
        const { data: teacherData, error: teacherError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', courseData.teacher_id)
          .maybeSingle();

        // console.log('Teacher fetch result:', { teacherData, teacherError });

        if (teacherData && !teacherError) {
          teacherProfile = teacherData;
        }
      }

      // 3. Combine data
      return {
        ...courseData,
        teacher: teacherProfile,
      } as Course;
    },
    enabled: !!user && !!courseId,
  });

  return { data, isLoading, error };
}

/**
 * Custom hook to fetch courses created by the current teacher.
 * 
 * @returns {object} The teacher's courses, loading state, and error.
 */
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

/**
 * Mutation hook to create a new course.
 * 
 * @returns {UseMutationResult} The mutation result.
 */
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

/**
 * Mutation hook to upload a course thumbnail.
 * 
 * @returns {UseMutationResult} The mutation result.
 */
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

/**
 * Mutation hook to update an existing course.
 * 
 * @returns {UseMutationResult} The mutation result.
 */
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

/**
 * Mutation hook to delete a course.
 * 
 * @returns {UseMutationResult} The mutation result.
 */
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

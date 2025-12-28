import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

export interface CourseMaterial {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  file_name: string | null;
  file_path: string | null;
  file_type: string | null;
  file_size: number | null;
  video_url: string | null;
  created_at: string;
  updated_at: string;
}

export function useCourseMaterials(courseId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: materials = [], isLoading, error } = useQuery({
    queryKey: ['course-materials', courseId],
    queryFn: async () => {
      let query = supabase.from('course_materials').select('*');
      
      if (courseId) {
        query = query.eq('course_id', courseId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as CourseMaterial[];
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('course-materials-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'course_materials',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['course-materials'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  return { materials, isLoading, error };
}

export function useUploadMaterial() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      courseId, 
      title, 
      description,
      file 
    }: { 
      courseId: string; 
      title: string; 
      description?: string;
      file: File;
    }) => {
      if (!user) throw new Error('Not authenticated');

      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const filePath = `${courseId}/${Date.now()}-${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('course-materials')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;

      // Create material record
      const { data, error } = await supabase
        .from('course_materials')
        .insert({
          course_id: courseId,
          title,
          description,
          file_name: file.name,
          file_path: filePath,
          file_type: file.type || `application/${fileExt}`,
          file_size: file.size,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-materials'] });
    },
  });
}

export function useAddVideoMaterial() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      courseId, 
      title, 
      description,
      videoUrl 
    }: { 
      courseId: string; 
      title: string; 
      description?: string;
      videoUrl: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('course_materials')
        .insert({
          course_id: courseId,
          title,
          description,
          video_url: videoUrl,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-materials'] });
    },
  });
}

export function useDeleteMaterial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, filePath }: { id: string; filePath?: string | null }) => {
      // Delete from storage if there's a file
      if (filePath) {
        const { error: storageError } = await supabase.storage
          .from('course-materials')
          .remove([filePath]);
        
        if (storageError) console.error('Storage delete error:', storageError);
      }

      // Delete record
      const { error } = await supabase
        .from('course_materials')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-materials'] });
    },
  });
}

// Get signed URL for secure material access (1 hour expiry)
export async function getMaterialSignedUrl(filePath: string | null): Promise<string | null> {
  if (!filePath) return null;
  
  const { data, error } = await supabase.storage
    .from('course-materials')
    .createSignedUrl(filePath, 3600); // 1 hour expiry
  
  if (error) {
    console.error('Failed to get signed URL:', error);
    return null;
  }
  
  return data.signedUrl;
}

// Hook for getting signed URLs for materials
export function useMaterialUrl(filePath: string | null) {
  const { data: signedUrl, isLoading } = useQuery({
    queryKey: ['material-url', filePath],
    queryFn: () => getMaterialSignedUrl(filePath),
    enabled: !!filePath,
    staleTime: 1000 * 60 * 30, // Cache for 30 minutes (half of the 1 hour expiry)
  });
  
  return { signedUrl, isLoading };
}

// Helper to extract YouTube video ID
export function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export function getYouTubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { storageApi } from '@/features/storage/api/storage.api.backend';
import { toast } from 'sonner';

export interface AIMaterial {
    id: string;
    teacher_id: string;
    course_id: string | null;
    title: string;
    file_url: string;
    file_type: string;
    file_size: number | null;
    status: 'processing' | 'ready' | 'error';
    error_message: string | null;
    total_chunks: number;
    metadata: Record<string, unknown>;
    created_at: string;
    updated_at: string;
}

export interface MaterialStats {
    total_materials: number;
    total_chunks: number;
    total_questions_generated: number;
    ready_materials: number;
    processing_materials: number;
}

/**
 * Hook for managing AI materials
 */
export function useAIMaterials() {
    const queryClient = useQueryClient();

    // List all materials for the current teacher
    const { data: materials = [], isLoading } = useQuery({
        queryKey: ['ai-materials'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('ai_materials')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as AIMaterial[];
        },
    });

    // Get teacher stats
    const { data: stats } = useQuery({
        queryKey: ['ai-materials-stats'],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase
                .rpc('get_teacher_ai_stats', { teacher_uuid: user.id });

            if (error) throw error;
            return data as unknown as MaterialStats;
        },
    });

    // Upload and create material
    const uploadMaterial = useMutation({
        mutationFn: async ({
            file,
            title,
            courseId,
        }: {
            file: File;
            title: string;
            courseId?: string;
        }) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // Upload file to storage
            const fileExt = file.name.split('.').pop();
            const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
            const fileName = `${user.id}/${Date.now()}-${sanitizedName}`;

            const { error: uploadError } = await storageApi.uploadFile('materials', fileName, file);

            if (uploadError) throw uploadError;

            // Create material record
            const { data, error } = await supabase
                .from('ai_materials')
                .insert({
                    teacher_id: user.id,
                    course_id: courseId || null,
                    title,
                    file_url: fileName,
                    file_type: fileExt || 'unknown',
                    file_size: file.size,
                    status: 'processing',
                })
                .select()
                .single();

            if (error) throw error;

            return data as AIMaterial;
        },
        onSuccess: (material) => {
            queryClient.invalidateQueries({ queryKey: ['ai-materials'] });
            queryClient.invalidateQueries({ queryKey: ['ai-materials-stats'] });
            toast.success('Material uploaded successfully');

            // Trigger processing
            processMaterial.mutate({ materialId: material.id });
        },
        onError: (error: Error) => {
            toast.error(`Upload failed: ${error.message}`);
        },
    });

    // Process material (chunking + embeddings)
    const processMaterial = useMutation({
        mutationFn: async ({
            materialId,
            chunkSize = 500,
            chunkOverlap = 50,
        }: {
            materialId: string;
            chunkSize?: number;
            chunkOverlap?: number;
        }) => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('Not authenticated');

            const functionsUrl = import.meta.env.VITE_SUPABASE_URL;

            if (!session?.access_token) {
                throw new Error('No active session - please login again');
            }

            const response = await fetch(
                `${functionsUrl}/functions/v1/process-material`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`,
                        'Content-Type': 'application/json',
                        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
                    },
                    body: JSON.stringify({ materialId, chunkSize, chunkOverlap }),
                }
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Processing failed');
            }

            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ai-materials'] });
            toast.success('Material processed successfully');
        },
        onError: (error: Error) => {
            toast.error(`Processing failed: ${error.message}`);
        },
    });

    // Delete material
    const deleteMaterial = useMutation({
        mutationFn: async (id: string) => {
            // Get material to delete file from storage
            const { data: material } = await supabase
                .from('ai_materials')
                .select('file_url')
                .eq('id', id)
                .single();

            if (material?.file_url) {
                await storageApi.removeFiles('materials', [material.file_url]);
            }

            const { error } = await supabase
                .from('ai_materials')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ai-materials'] });
            queryClient.invalidateQueries({ queryKey: ['ai-materials-stats'] });
            toast.success('Material deleted');
        },
        onError: (error: Error) => {
            toast.error(`Delete failed: ${error.message}`);
        },
    });

    return {
        materials,
        isLoading,
        stats,
        uploadMaterial,
        processMaterial,
        deleteMaterial,
    };
}

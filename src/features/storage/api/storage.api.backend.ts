import { supabase } from '@/integrations/supabase/client';
import {
    StorageAPI,
    StorageUploadOptions,
    StorageUploadResult,
    StorageUrlResult,
    StorageDownloadResult,
    StorageRemoveResult
} from './storage.api';

/**
 * Backend implementation of the StorageAPI using Supabase Storage.
 * 
 * This adapter encapsulates all direct interactions with the Supabase JS SDK
 * for file storage, allowing the UI and Hooks to remain decoupled.
 */
class BackendStorageAPI implements StorageAPI {

    async uploadFile(bucket: string, path: string, file: File | Blob | ArrayBuffer, options?: StorageUploadOptions): Promise<StorageUploadResult> {
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(path, file, {
                cacheControl: options?.cacheControl ?? '3600',
                upsert: options?.upsert ?? false
            });

        return { data, error };
    }

    async removeFiles(bucket: string, paths: string[]): Promise<StorageRemoveResult> {
        const { data, error } = await supabase.storage
            .from(bucket)
            .remove(paths);

        return { data, error };
    }

    getPublicUrl(bucket: string, path: string): StorageUrlResult {
        const { data } = supabase.storage
            .from(bucket)
            .getPublicUrl(path);

        return { data };
    }

    async downloadFile(
        bucket: string,
        path: string,
        options?: {
            transform?: {
                width?: number;
                height?: number;
                resize?: 'cover' | 'contain' | 'fill';
                quality?: number;
            };
        }
    ): Promise<{ data: Blob | null; error: Error | null }> {
        return supabase.storage.from(bucket).download(path, options);
    }

    async createSignedUrl(
        bucket: string,
        path: string,
        expiresIn: number,
        options?: {
            download?: string | boolean;
            transform?: {
                width?: number;
                height?: number;
                resize?: 'cover' | 'contain' | 'fill';
            };
        }
    ): Promise<{ data: { signedUrl: string } | null; error: Error | null }> {
        return supabase.storage.from(bucket).createSignedUrl(path, expiresIn, options);
    }
}

// Export a singleton instance of the API
export const storageApi = new BackendStorageAPI();

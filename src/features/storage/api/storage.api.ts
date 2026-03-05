/**
 * Contract for all Storage I/O operations.
 * 
 * By designing to this interface, we isolate UI components and hooks from
 * the concrete Supabase client, enabling robust unit and integration testing.
 * 
 * This follows the "Testability-First Design" mandate.
 */

export interface StorageUploadOptions {
    cacheControl?: string;
    upsert?: boolean;
}

export interface StorageUploadResult {
    data: { path: string } | null;
    error: Error | null;
}

export interface StorageUrlResult {
    data: { publicUrl: string } | null;
}

export interface StorageDownloadResult {
    data: Blob | null;
    error: Error | null;
}

export interface StorageRemoveResult {
    data: any | null;
    error: Error | null;
}

export interface StorageAPI {
    /**
     * Uploads a file to the specified bucket and path.
     * 
     * @param bucket The storage bucket name (e.g., 'materials', 'avatars').
     * @param path The destination path inside the bucket.
     * @param file The file to upload (Blob, File, ArrayBuffer, etc.).
     * @param options Optional upload parameters (cacheControl, upsert).
     * @returns Object containing the resulting relative path snippet, or an error.
     */
    uploadFile(bucket: string, path: string, file: File | Blob | ArrayBuffer, options?: StorageUploadOptions): Promise<StorageUploadResult>;

    /**
     * Removes one or more files from the specified bucket.
     * 
     * @param bucket The storage bucket name.
     * @param paths An array of file paths to remove.
     * @returns Object containing data info or error.
     */
    removeFiles(bucket: string, paths: string[]): Promise<StorageRemoveResult>;

    /**
     * Retrieves the public URL for a file in the specified bucket.
     * 
     * @param bucket The storage bucket name.
     * @param path The file path inside the bucket.
     * @returns Object containing the public URL. Note: Supabase public URLs don't inherently throw errors if the file doesn't exist, they just generate the text string.
     */
    getPublicUrl(bucket: string, path: string): StorageUrlResult;

    /**
     * Downloads a file from the specified bucket, useful for private buckets or generating ObjectURLs.
     * 
     * @param bucket The storage bucket name.
     * @param path The file path inside the bucket.
     * @returns Object containing the file Blob or an error.
     */
    downloadFile(bucket: string, path: string): Promise<StorageDownloadResult>;
}

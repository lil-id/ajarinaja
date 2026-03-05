import {
    StorageAPI,
    StorageUploadOptions,
    StorageUploadResult,
    StorageUrlResult,
    StorageDownloadResult,
    StorageRemoveResult
} from './storage.api';

/**
 * Mock implementation of the StorageAPI for automated unit testing.
 * 
 * This adapter fakes file uploads, downloads, and removals without making
 * any real network requests or requiring Supabase credentials.
 */
export class MockStorageAPI implements StorageAPI {
    private mockStorage: Map<string, ArrayBuffer> = new Map();

    async uploadFile(bucket: string, path: string, file: File | Blob | ArrayBuffer, options?: StorageUploadOptions): Promise<StorageUploadResult> {
        // Simulate network latency
        await new Promise(resolve => setTimeout(resolve, 50));

        const fullPath = `${bucket}/${path}`;

        // In a real test scenario, we'd convert File/Blob to ArrayBuffer if necessary to store,
        // but for mocking we'll just store a dummy buffer to represent the file existing in state.
        this.mockStorage.set(fullPath, new ArrayBuffer(0));

        return {
            data: { path: fullPath },
            error: null
        };
    }

    async removeFiles(bucket: string, paths: string[]): Promise<StorageRemoveResult> {
        const deletedPaths: any[] = [];

        for (const p of paths) {
            const fullPath = `${bucket}/${p}`;
            if (this.mockStorage.has(fullPath)) {
                this.mockStorage.delete(fullPath);
                deletedPaths.push({ name: fullPath });
            }
        }

        return { data: deletedPaths, error: null };
    }

    getPublicUrl(bucket: string, path: string): StorageUrlResult {
        return { data: { publicUrl: `mock://storage/${bucket}/${path}` } };
    }

    async downloadFile(
        bucket: string,
        path: string,
        options?: any
    ): Promise<{ data: Blob | null; error: Error | null }> {
        console.log(`[MockStorageAPI] downloadFile: bucket=${bucket}, path=${path}`, options);

        // Create a dummy blob representing the downloaded file
        const content = `Mock content for file ${path} from bucket ${bucket}`;
        const blob = new Blob([content], { type: 'text/plain' });

        return { data: blob, error: null };
    }

    async createSignedUrl(
        bucket: string,
        path: string,
        expiresIn: number,
        options?: any
    ): Promise<{ data: { signedUrl: string } | null; error: Error | null }> {
        console.log(`[MockStorageAPI] createSignedUrl: bucket=${bucket}, path=${path}, expiresIn=${expiresIn}`, options);
        return {
            data: { signedUrl: `https://mock.storage.url/${bucket}/${path}?signed=true&expires=${expiresIn}` },
            error: null
        };
    }

    // Test utility method
    getMockStorageSize(): number {
        return this.mockStorage.size;
    }
}

// Export a singleton instance if needed, though typically tests will instantiate their own
export const mockStorageApi = new MockStorageAPI();

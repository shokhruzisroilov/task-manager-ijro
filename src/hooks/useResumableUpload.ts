import { useState, useCallback, useRef } from 'react';
import { uploadResumableFile, uploadFile, type UploadProgress } from '../api/endpoints/attachments';
import type { Attachment } from '../types/models';

interface UseResumableUploadOptions {
  cardId: number;
  onSuccess?: (attachment: Attachment) => void;
  onError?: (error: Error) => void;
  resumableThreshold?: number; // File size threshold for resumable upload (default: 5MB)
}

interface UploadState {
  isUploading: boolean;
  progress: number;
  uploadedBytes: number;
  totalBytes: number;
  currentChunk: number;
  totalChunks: number;
  error: string | null;
}

export const useResumableUpload = ({
  cardId,
  onSuccess,
  onError,
  resumableThreshold = 5 * 1024 * 1024, // 5MB
}: UseResumableUploadOptions) => {
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    uploadedBytes: 0,
    totalBytes: 0,
    currentChunk: 0,
    totalChunks: 0,
    error: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const handleProgress = useCallback((progress: UploadProgress) => {
    setUploadState((prev) => ({
      ...prev,
      progress: progress.percentage,
      uploadedBytes: progress.loaded,
      totalBytes: progress.total,
    }));
  }, []);

  const handleChunkComplete = useCallback((chunkNumber: number, totalChunks: number) => {
    setUploadState((prev) => ({
      ...prev,
      currentChunk: chunkNumber,
      totalChunks,
    }));
  }, []);

  const upload = useCallback(
    async (file: File) => {
      try {
        setUploadState({
          isUploading: true,
          progress: 0,
          uploadedBytes: 0,
          totalBytes: file.size,
          currentChunk: 0,
          totalChunks: 0,
          error: null,
        });

        abortControllerRef.current = new AbortController();

        let attachment: Attachment;

        // Use resumable upload for large files
        if (file.size > resumableThreshold) {
          attachment = await uploadResumableFile(
            cardId,
            file,
            handleProgress,
            handleChunkComplete
          );
        } else {
          // Use simple upload for small files
          attachment = await uploadFile(cardId, file, handleProgress);
        }

        setUploadState((prev) => ({
          ...prev,
          isUploading: false,
          progress: 100,
        }));

        onSuccess?.(attachment);
        return attachment;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Upload failed';
        setUploadState((prev) => ({
          ...prev,
          isUploading: false,
          error: errorMessage,
        }));

        onError?.(error instanceof Error ? error : new Error(errorMessage));
        throw error;
      }
    },
    [cardId, resumableThreshold, handleProgress, handleChunkComplete, onSuccess, onError]
  );

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    setUploadState((prev) => ({
      ...prev,
      isUploading: false,
      error: 'Upload cancelled',
    }));
  }, []);

  const reset = useCallback(() => {
    setUploadState({
      isUploading: false,
      progress: 0,
      uploadedBytes: 0,
      totalBytes: 0,
      currentChunk: 0,
      totalChunks: 0,
      error: null,
    });
  }, []);

  return {
    upload,
    cancel,
    reset,
    ...uploadState,
  };
};

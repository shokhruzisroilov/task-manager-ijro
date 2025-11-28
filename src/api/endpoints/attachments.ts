import { apiClient } from '../client';
import type { Attachment } from '../../types/models';

export interface UploadInitResponse {
  uploadId: string;
  fileName: string;
  chunkSize: number;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

/**
 * Get all attachments for a card
 */
export const getCardAttachments = async (cardId: number): Promise<Attachment[]> => {
  return await apiClient.get<Attachment[]>(`/cards/${cardId}/attachments`);
};

/**
 * Simple file upload (for small files)
 */
export const uploadFile = async (
  cardId: number,
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<Attachment> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('cardId', cardId.toString());

  return await apiClient.post<Attachment>('/files/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percentage = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress({
          loaded: progressEvent.loaded,
          total: progressEvent.total,
          percentage,
        });
      }
    },
  });
};

/**
 * Initialize resumable upload
 */
export const initResumableUpload = async (
  fileName: string,
  fileSize: number
): Promise<UploadInitResponse> => {
  return await apiClient.post<UploadInitResponse>('/files/resumable/init', null, {
    params: { fileName, fileSize },
  });
};

/**
 * Upload a chunk
 */
export const uploadChunk = async (
  uploadId: string,
  fileName: string,
  chunk: Blob,
  chunkNumber: number,
  offset: number
): Promise<void> => {
  const formData = new FormData();
  formData.append('file', chunk);
  formData.append('uploadId', uploadId);
  formData.append('fileName', fileName);
  formData.append('chunkNumber', chunkNumber.toString());
  formData.append('offset', offset.toString());

  await apiClient.post('/files/resumable/chunk', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

/**
 * Complete resumable upload
 */
export const completeResumableUpload = async (
  uploadId: string,
  fileName: string,
  fileSize: number,
  cardId: number,
  originalFileName: string
): Promise<Attachment> => {
  return await apiClient.post<Attachment>(
    '/files/resumable/complete',
    {
      uploadId,
      fileName,
      fileSize,
    },
    {
      params: {
        cardId,
        originalFileName,
      },
    }
  );
};

/**
 * Cancel resumable upload
 */
export const cancelResumableUpload = async (
  uploadId: string,
  fileName: string
): Promise<void> => {
  await apiClient.delete('/files/resumable/cancel', {
    params: { uploadId, fileName },
  });
};

/**
 * Delete attachment
 */
export const deleteAttachment = async (attachmentId: number): Promise<void> => {
  await apiClient.delete(`/attachments/${attachmentId}`);
};

/**
 * Get download URL for attachment
 */
export const getDownloadUrl = (fileName: string): string => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
  return `${baseUrl}/api/files/download/${fileName}`;
};

/**
 * Upload resumable file with progress tracking
 */
export const uploadResumableFile = async (
  cardId: number,
  file: File,
  onProgress?: (progress: UploadProgress) => void,
  onChunkComplete?: (chunkNumber: number, totalChunks: number) => void
): Promise<Attachment> => {
  // Initialize upload
  const { uploadId, fileName, chunkSize } = await initResumableUpload(file.name, file.size);

  const totalChunks = Math.ceil(file.size / chunkSize);
  let uploadedBytes = 0;

  try {
    // Upload chunks
    for (let chunkNumber = 0; chunkNumber < totalChunks; chunkNumber++) {
      const start = chunkNumber * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end);

      await uploadChunk(uploadId, fileName, chunk, chunkNumber, start);

      uploadedBytes += chunk.size;

      if (onProgress) {
        onProgress({
          loaded: uploadedBytes,
          total: file.size,
          percentage: Math.round((uploadedBytes * 100) / file.size),
        });
      }

      if (onChunkComplete) {
        onChunkComplete(chunkNumber + 1, totalChunks);
      }
    }

    // Complete upload
    return await completeResumableUpload(uploadId, fileName, file.size, cardId, file.name);
  } catch (error) {
    // Cancel upload on error
    await cancelResumableUpload(uploadId, fileName);
    throw error;
  }
};

/**
 * API object for compatibility with existing code
 */
export const attachmentsAPI = {
  getByCard: getCardAttachments,
  delete: deleteAttachment,
  upload: uploadFile,
  uploadResumable: uploadResumableFile,
  download: getDownloadUrl,
};

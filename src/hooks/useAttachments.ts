import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attachmentsAPI } from '../api/endpoints/attachments';
import { uploadService } from '../services/upload.service';
import { useState, useEffect } from 'react';
import { UploadProgress } from '../types/models';

/**
 * Hook for fetching attachments for a card
 * @param cardId - Card ID
 */
export const useAttachments = (cardId: number) => {
  return useQuery({
    queryKey: ['cards', cardId, 'attachments'],
    queryFn: () => attachmentsAPI.getByCard(cardId),
    enabled: !!cardId,
  });
};

/**
 * Hook for deleting an attachment
 */
export const useDeleteAttachment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: attachmentsAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
    },
  });
};

/**
 * Hook for managing resumable uploads
 * @param cardId - Card ID to upload to
 */
export const useResumableUpload = (cardId: number) => {
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const queryClient = useQueryClient();

  // Load existing uploads on mount
  useEffect(() => {
    const loadUploads = async () => {
      const allUploads = await uploadService.getAllUploads();
      setUploads(allUploads);
    };
    loadUploads();
  }, []);

  // Poll for upload progress
  useEffect(() => {
    const interval = setInterval(async () => {
      const allUploads = await uploadService.getAllUploads();
      setUploads(allUploads);

      // Invalidate queries when uploads complete
      const completedUploads = allUploads.filter(
        u => u.status === 'completed' && uploads.find(old => old.uploadId === u.uploadId && old.status !== 'completed')
      );
      if (completedUploads.length > 0) {
        queryClient.invalidateQueries({ queryKey: ['cards', cardId, 'attachments'] });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [cardId, queryClient, uploads]);

  /**
   * Start a new upload
   * @param file - File to upload
   */
  const startUpload = async (file: File): Promise<string> => {
    const uploadId = await uploadService.startUpload(file, cardId);
    const progress = await uploadService.getProgress(uploadId);
    if (progress) {
      setUploads(prev => [...prev, progress]);
    }
    return uploadId;
  };

  /**
   * Pause an upload
   * @param uploadId - Upload ID
   */
  const pauseUpload = async (uploadId: string): Promise<void> => {
    await uploadService.pauseUpload(uploadId);
    const progress = await uploadService.getProgress(uploadId);
    if (progress) {
      setUploads(prev => prev.map(u => u.uploadId === uploadId ? progress : u));
    }
  };

  /**
   * Resume an upload
   * @param uploadId - Upload ID
   */
  const resumeUpload = async (uploadId: string): Promise<void> => {
    await uploadService.resumeUpload(uploadId);
    const progress = await uploadService.getProgress(uploadId);
    if (progress) {
      setUploads(prev => prev.map(u => u.uploadId === uploadId ? progress : u));
    }
  };

  /**
   * Cancel an upload
   * @param uploadId - Upload ID
   */
  const cancelUpload = async (uploadId: string): Promise<void> => {
    await uploadService.cancelUpload(uploadId);
    setUploads(prev => prev.filter(u => u.uploadId !== uploadId));
  };

  return {
    uploads,
    startUpload,
    pauseUpload,
    resumeUpload,
    cancelUpload,
  };
};

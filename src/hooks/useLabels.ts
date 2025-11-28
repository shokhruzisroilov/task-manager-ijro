import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { labelsAPI } from '../api/endpoints/labels';
import { LabelRequest } from '../types';
import { toast } from '../store';

/**
 * Custom hooks for label operations
 * Implements Requirements 10.1, 10.2, 10.3, 10.4, 10.5
 */

/**
 * Get all labels for a board
 * Requirement 10.1: Label creation succeeds with valid data
 */
export const useLabels = (boardId: number) => {
  return useQuery({
    queryKey: ['boards', boardId, 'labels'],
    queryFn: () => labelsAPI.getByBoard(boardId),
    enabled: !!boardId,
  });
};

/**
 * Create a new label
 * Requirement 10.1: Label creation succeeds with valid data
 */
export const useCreateLabel = (boardId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: LabelRequest) =>
      labelsAPI.create(boardId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards', boardId, 'labels'] });
      toast.success('Label created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create label');
    },
  });
};

/**
 * Update label details
 * Requirement 10.2: Label updates reflect on all cards
 */
export const useUpdateLabel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: LabelRequest }) =>
      labelsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      toast.success('Label updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update label');
    },
  });
};

/**
 * Delete a label
 * Requirement 10.3: Label deletion removes from all cards
 */
export const useDeleteLabel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: labelsAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      toast.success('Label deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete label');
    },
  });
};

/**
 * Attach label to card
 * Requirement 10.4: Label attachment displays on card
 */
export const useAttachLabel = (cardId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (labelId: number) =>
      labelsAPI.attachToCard(cardId, labelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards', cardId] });
      queryClient.invalidateQueries({ queryKey: ['columns'] });
      toast.success('Label attached to card');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to attach label');
    },
  });
};

/**
 * Detach label from card
 * Requirement 10.5: Label detachment removes from card
 */
export const useDetachLabel = (cardId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (labelId: number) =>
      labelsAPI.detachFromCard(cardId, labelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards', cardId] });
      queryClient.invalidateQueries({ queryKey: ['columns'] });
      toast.success('Label detached from card');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to detach label');
    },
  });
};

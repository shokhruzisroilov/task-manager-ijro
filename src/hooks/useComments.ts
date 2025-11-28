import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { commentsAPI } from '../api/endpoints/comments';
import { CommentRequest } from '../types';
import { toast } from '../store';

/**
 * Custom hooks for comment operations
 * Implements Requirements 11.1, 11.2, 11.3, 11.4, 11.5
 */

/**
 * Get all comments for a card
 * Requirement 11.4: Comments display in chronological order
 */
export const useComments = (cardId: number) => {
  return useQuery({
    queryKey: ['cards', cardId, 'comments'],
    queryFn: () => commentsAPI.getByCard(cardId),
    enabled: !!cardId,
  });
};

/**
 * Create a new comment
 * Requirement 11.1: Comment creation displays on card
 */
export const useCreateComment = (cardId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CommentRequest) =>
      commentsAPI.create(cardId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards', cardId, 'comments'] });
      queryClient.invalidateQueries({ queryKey: ['cards', cardId] });
      toast.success('Comment added');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to add comment');
    },
  });
};

/**
 * Update a comment
 * Requirement 11.2: Comment update shows edited indicator
 */
export const useUpdateComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CommentRequest }) =>
      commentsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      toast.success('Comment updated');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update comment');
    },
  });
};

/**
 * Delete a comment
 * Requirement 11.3: Comment deletion removes from card
 */
export const useDeleteComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: commentsAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      toast.success('Comment deleted');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete comment');
    },
  });
};

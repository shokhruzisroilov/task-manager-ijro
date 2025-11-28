import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { columnsAPI } from '../api/endpoints/columns';
import { ColumnRequest, UpdatePositionRequest } from '../types';
import { toast } from '../store';

/**
 * Custom hooks for column operations
 * Implements Requirements 6.1, 6.2, 6.3, 6.4
 */

/**
 * Get all columns in a board
 * Requirement 6.1: Column creation adds at end position
 */
export const useColumns = (boardId: number) => {
  return useQuery({
    queryKey: ['boards', boardId, 'columns'],
    queryFn: () => columnsAPI.getByBoard(boardId),
    enabled: !!boardId,
  });
};

/**
 * Create a new column
 * Requirement 6.1: Column creation adds at end position
 */
export const useCreateColumn = (boardId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ColumnRequest) =>
      columnsAPI.create(boardId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards', boardId, 'columns'] });
      queryClient.invalidateQueries({ queryKey: ['boards', boardId] });
      toast.success('Column created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create column');
    },
  });
};

/**
 * Update column name
 * Requirement 6.2: Column updates reflect immediately
 */
export const useUpdateColumn = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ColumnRequest }) =>
      columnsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
      toast.success('Column updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update column');
    },
  });
};

/**
 * Update column position
 * Requirement 6.3: Column reordering maintains new order
 * Requirement 8.3: Column drag updates column order
 * Requirement 8.4: Drag operation failures revert UI
 */
export const useUpdateColumnPosition = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, newPosition }: { id: number; newPosition: number }) =>
      columnsAPI.updatePosition(id, { newPosition }),
    onMutate: async () => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['boards'] });

      const previousData = queryClient.getQueryData(['boards']);

      // Note: Actual optimistic update logic would be more complex
      // For now, we'll just invalidate after success

      return { previousData };
    },
    onError: (_err, _variables, context) => {
      // Revert on error
      if (context?.previousData) {
        queryClient.setQueryData(['boards'], context.previousData);
      }
      toast.error('Failed to reorder column');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
    },
  });
};

/**
 * Delete a column
 * Requirement 6.4: Column deletion removes all cards
 */
export const useDeleteColumn = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: columnsAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
      toast.success('Column deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete column');
    },
  });
};

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cardsAPI } from '../api/endpoints/cards';
import { CardRequest, MoveCardRequest } from '../types';
import { toast } from '../store';
import { isConflictError, handleConflict } from '../utils/conflictHandler';

/**
 * Custom hooks for card operations
 * Implements Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 8.1, 8.2, 9.1, 9.2, 9.3
 */

/**
 * Get all cards in a column
 * Requirement 7.1: Card creation adds at end position
 */
export const useCards = (columnId: number) => {
  return useQuery({
    queryKey: ['columns', columnId, 'cards'],
    queryFn: () => cardsAPI.getByColumn(columnId),
    enabled: !!columnId,
  });
};

/**
 * Get card by ID
 * Requirement 7.2: Card view displays all details
 */
export const useCard = (id: number) => {
  return useQuery({
    queryKey: ['cards', id],
    queryFn: () => cardsAPI.getById(id),
    enabled: !!id,
  });
};

/**
 * Create a new card
 * Requirement 7.1: Card creation adds at end position
 * Requirement 13.1: Optimistic updates for immediate UI feedback
 */
export const useCreateCard = (columnId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CardRequest) =>
      cardsAPI.create(columnId, data),
    onMutate: async (newCard) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['columns', columnId, 'cards'] });

      // Snapshot previous value
      const previousCards = queryClient.getQueryData(['columns', columnId, 'cards']);

      // Optimistically update to the new value
      queryClient.setQueryData(['columns', columnId, 'cards'], (old: any) => {
        if (!old) return old;
        
        // Create optimistic card with temporary ID
        const optimisticCard = {
          id: Date.now(), // Temporary ID
          title: newCard.title,
          description: newCard.description || '',
          columnId,
          archived: false,
          position: old.length,
          members: [],
          comments: [],
          labels: [],
          attachments: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        return [...old, optimisticCard];
      });

      return { previousCards };
    },
    onError: (error: any, _variables, context) => {
      // Requirement 13.2: Revert optimistic update on error
      if (context?.previousCards) {
        queryClient.setQueryData(['columns', columnId, 'cards'], context.previousCards);
      }
      
      // Requirement 13.4: Handle conflicts
      if (isConflictError(error)) {
        handleConflict(queryClient, [['columns', columnId, 'cards']], 'Card creation conflict detected.');
      } else {
        toast.error(error.message || 'Failed to create card');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['columns', columnId, 'cards'] });
      toast.success('Card created successfully');
    },
  });
};

/**
 * Update card details
 * Requirement 7.3: Card updates reflect immediately
 * Requirement 13.1: Optimistic updates for immediate UI feedback
 */
export const useUpdateCard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CardRequest }) =>
      cardsAPI.update(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['cards', id] });

      // Snapshot previous value
      const previousCard = queryClient.getQueryData(['cards', id]);

      // Optimistically update the card
      queryClient.setQueryData(['cards', id], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          ...data,
          updatedAt: new Date().toISOString(),
        };
      });

      // Also update in column cards list if present
      const columnQueries = queryClient.getQueriesData({ queryKey: ['columns'] });
      const previousColumnData: any[] = [];

      columnQueries.forEach(([queryKey, data]) => {
        if (Array.isArray(data)) {
          previousColumnData.push({ queryKey, data });
          queryClient.setQueryData(queryKey, (old: any) => {
            if (!Array.isArray(old)) return old;
            return old.map((card: any) =>
              card.id === id ? { ...card, ...data, updatedAt: new Date().toISOString() } : card
            );
          });
        }
      });

      return { previousCard, previousColumnData };
    },
    onError: (error: any, variables, context) => {
      // Requirement 13.2: Revert optimistic update on error
      if (context?.previousCard) {
        queryClient.setQueryData(['cards', variables.id], context.previousCard);
      }
      if (context?.previousColumnData) {
        context.previousColumnData.forEach(({ queryKey, data }) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      
      // Requirement 13.4: Handle conflicts
      if (isConflictError(error)) {
        handleConflict(queryClient, [['cards', variables.id], ['columns']], 'Card update conflict detected.');
      } else {
        toast.error(error.message || 'Failed to update card');
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cards', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['columns'] });
      toast.success('Card updated successfully');
    },
  });
};

/**
 * Move card to different column or position
 * Requirement 8.1: Card drag within column updates positions
 * Requirement 8.2: Card drag between columns updates both columns
 * Requirement 13.1: Optimistic updates for immediate UI feedback
 */
export const useMoveCard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: MoveCardRequest }) =>
      cardsAPI.move(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches for all column queries
      await queryClient.cancelQueries({ queryKey: ['columns'] });

      // Snapshot all column data
      const columnQueries = queryClient.getQueriesData({ queryKey: ['columns'] });
      const previousColumnData: any[] = [];

      columnQueries.forEach(([queryKey, queryData]) => {
        previousColumnData.push({ queryKey, data: queryData });
      });

      // Optimistically update card positions
      columnQueries.forEach(([queryKey, queryData]) => {
        if (Array.isArray(queryData)) {
          const columnIdMatch = queryKey.toString().match(/columns,(\d+),cards/);
          if (!columnIdMatch) return;

          const currentColumnId = parseInt(columnIdMatch[1]);

          queryClient.setQueryData(queryKey, (old: any) => {
            if (!Array.isArray(old)) return old;

            // Find the card being moved
            const cardIndex = old.findIndex((c: any) => c.id === id);
            if (cardIndex === -1) return old;

            const card = old[cardIndex];

            // If moving to a different column
            if (data.columnId && data.columnId !== currentColumnId) {
              // Remove from current column
              if (currentColumnId === card.columnId) {
                return old.filter((c: any) => c.id !== id);
              }
              // Add to target column
              if (currentColumnId === data.columnId) {
                const updatedCard = { ...card, columnId: data.columnId, position: data.position };
                const newCards = [...old, updatedCard];
                // Sort by position
                return newCards.sort((a: any, b: any) => a.position - b.position);
              }
              return old;
            }

            // Moving within same column - update positions
            const newCards = [...old];
            newCards[cardIndex] = { ...card, position: data.position };
            return newCards.sort((a: any, b: any) => a.position - b.position);
          });
        }
      });

      return { previousColumnData };
    },
    onError: (error: any, _variables, context) => {
      // Requirement 13.2: Revert optimistic update on error
      if (context?.previousColumnData) {
        context.previousColumnData.forEach(({ queryKey, data }) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      
      // Requirement 13.4: Handle conflicts
      if (isConflictError(error)) {
        handleConflict(queryClient, [['columns']], 'Card move conflict detected. Positions have been refreshed.');
      } else {
        toast.error('Failed to move card');
      }
    },
    onSuccess: () => {
      // Invalidate all column queries to refresh card positions
      queryClient.invalidateQueries({ queryKey: ['columns'] });
    },
  });
};

/**
 * Archive or unarchive a card
 * Requirement 7.4: Card archival hides from board
 * Requirement 13.1: Optimistic updates for immediate UI feedback
 */
export const useArchiveCard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, archived }: { id: number; archived: boolean }) =>
      cardsAPI.archive(id, archived),
    onMutate: async ({ id, archived }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['cards', id] });
      await queryClient.cancelQueries({ queryKey: ['columns'] });

      // Snapshot previous values
      const previousCard = queryClient.getQueryData(['cards', id]);
      const columnQueries = queryClient.getQueriesData({ queryKey: ['columns'] });
      const previousColumnData: any[] = [];

      // Update card
      queryClient.setQueryData(['cards', id], (old: any) => {
        if (!old) return old;
        return { ...old, archived };
      });

      // Update in column lists
      columnQueries.forEach(([queryKey, data]) => {
        if (Array.isArray(data)) {
          previousColumnData.push({ queryKey, data });
          queryClient.setQueryData(queryKey, (old: any) => {
            if (!Array.isArray(old)) return old;
            // If archiving, remove from list; if unarchiving, keep it
            if (archived) {
              return old.filter((card: any) => card.id !== id);
            }
            return old.map((card: any) =>
              card.id === id ? { ...card, archived } : card
            );
          });
        }
      });

      return { previousCard, previousColumnData };
    },
    onError: (error: any, variables, context) => {
      // Requirement 13.2: Revert optimistic update on error
      if (context?.previousCard) {
        queryClient.setQueryData(['cards', variables.id], context.previousCard);
      }
      if (context?.previousColumnData) {
        context.previousColumnData.forEach(({ queryKey, data }) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      
      // Requirement 13.4: Handle conflicts
      if (isConflictError(error)) {
        handleConflict(queryClient, [['cards', variables.id], ['columns']], 'Card archive conflict detected.');
      } else {
        toast.error(error.message || 'Failed to archive card');
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cards', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['columns'] });
      toast.success(variables.archived ? 'Card archived' : 'Card unarchived');
    },
  });
};

/**
 * Delete a card
 * Requirement 7.5: Card deletion removes all associated data
 * Requirement 13.1: Optimistic updates for immediate UI feedback
 */
export const useDeleteCard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cardsAPI.delete,
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['columns'] });

      // Snapshot all column data
      const columnQueries = queryClient.getQueriesData({ queryKey: ['columns'] });
      const previousColumnData: any[] = [];

      // Optimistically remove card from all column lists
      columnQueries.forEach(([queryKey, data]) => {
        if (Array.isArray(data)) {
          previousColumnData.push({ queryKey, data });
          queryClient.setQueryData(queryKey, (old: any) => {
            if (!Array.isArray(old)) return old;
            return old.filter((card: any) => card.id !== id);
          });
        }
      });

      return { previousColumnData };
    },
    onError: (error: any, _variables, context) => {
      // Requirement 13.2: Revert optimistic update on error
      if (context?.previousColumnData) {
        context.previousColumnData.forEach(({ queryKey, data }) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      
      // Requirement 13.4: Handle conflicts
      if (isConflictError(error)) {
        handleConflict(queryClient, [['columns']], 'Card deletion conflict detected.');
      } else {
        toast.error(error.message || 'Failed to delete card');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['columns'] });
      toast.success('Card deleted successfully');
    },
  });
};

/**
 * Assign member to card
 * Requirement 9.1: Member assignment displays avatar
 */
export const useAssignCardMember = (cardId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: number) =>
      cardsAPI.assignMember(cardId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards', cardId] });
      queryClient.invalidateQueries({ queryKey: ['columns'] });
      toast.success('Member assigned to card');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to assign member');
    },
  });
};

/**
 * Unassign member from card
 * Requirement 9.2: Member unassignment removes from card
 */
export const useUnassignCardMember = (cardId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: number) =>
      cardsAPI.unassignMember(cardId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards', cardId] });
      queryClient.invalidateQueries({ queryKey: ['columns'] });
      toast.success('Member unassigned from card');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to unassign member');
    },
  });
};

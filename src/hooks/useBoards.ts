import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { boardsAPI } from '../api/endpoints/boards';
import { BoardRequest, AddBoardMemberRequest } from '../types';
import { toast } from '../store';
import { isConflictError, handleConflict } from '../utils/conflictHandler';

/**
 * Custom hooks for board operations
 * Implements Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5
 */

/**
 * Get all boards in a workspace
 * Requirement 4.1: Board creation succeeds for workspace members
 */
export const useBoards = (workspaceId: number) => {
  return useQuery({
    queryKey: ['workspaces', workspaceId, 'boards'],
    queryFn: () => boardsAPI.getByWorkspace(workspaceId),
    enabled: !!workspaceId,
  });
};

/**
 * Get board by ID
 * Requirement 4.2: Board view displays all columns and cards
 */
export const useBoard = (id: number) => {
  return useQuery({
    queryKey: ['boards', id],
    queryFn: () => boardsAPI.getById(id),
    enabled: !!id,
  });
};

/**
 * Create a new board
 * Requirement 4.1: Board creation succeeds for workspace members
 * Requirement 13.1: Optimistic updates for immediate UI feedback
 */
export const useCreateBoard = (workspaceId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BoardRequest) =>
      boardsAPI.create(workspaceId, data),
    onMutate: async (newBoard) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['workspaces', workspaceId, 'boards'] });

      // Snapshot previous value
      const previousBoards = queryClient.getQueryData(['workspaces', workspaceId, 'boards']);

      // Optimistically add new board
      queryClient.setQueryData(['workspaces', workspaceId, 'boards'], (old: any) => {
        if (!old) return old;

        const optimisticBoard = {
          id: Date.now(), // Temporary ID
          name: newBoard.name,
          description: newBoard.description || '',
          workspaceId,
          archived: false,
          position: old.length,
          columns: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        return [...old, optimisticBoard];
      });

      return { previousBoards };
    },
    onError: (error: any, _variables, context) => {
      // Requirement 13.2: Revert optimistic update on error
      if (context?.previousBoards) {
        queryClient.setQueryData(['workspaces', workspaceId, 'boards'], context.previousBoards);
      }
      
      // Requirement 13.4: Handle conflicts
      if (isConflictError(error)) {
        handleConflict(queryClient, [['workspaces', workspaceId, 'boards']], 'Board creation conflict detected.');
      } else {
        toast.error(error.message || 'Failed to create board');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces', workspaceId, 'boards'] });
      toast.success('Board created successfully');
    },
  });
};

/**
 * Update board details
 * Requirement 4.3: Board updates reflect immediately
 * Requirement 13.1: Optimistic updates for immediate UI feedback
 */
export const useUpdateBoard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: BoardRequest }) =>
      boardsAPI.update(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['boards', id] });

      // Snapshot previous value
      const previousBoard = queryClient.getQueryData(['boards', id]);

      // Optimistically update board
      queryClient.setQueryData(['boards', id], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          ...data,
          updatedAt: new Date().toISOString(),
        };
      });

      // Also update in workspace boards list
      const workspaceQueries = queryClient.getQueriesData({ queryKey: ['workspaces'] });
      const previousWorkspaceData: any[] = [];

      workspaceQueries.forEach(([queryKey, queryData]) => {
        if (Array.isArray(queryData)) {
          previousWorkspaceData.push({ queryKey, data: queryData });
          queryClient.setQueryData(queryKey, (old: any) => {
            if (!Array.isArray(old)) return old;
            return old.map((board: any) =>
              board.id === id ? { ...board, ...data, updatedAt: new Date().toISOString() } : board
            );
          });
        }
      });

      return { previousBoard, previousWorkspaceData };
    },
    onError: (error: any, variables, context) => {
      // Requirement 13.2: Revert optimistic update on error
      if (context?.previousBoard) {
        queryClient.setQueryData(['boards', variables.id], context.previousBoard);
      }
      if (context?.previousWorkspaceData) {
        context.previousWorkspaceData.forEach(({ queryKey, data }) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      
      // Requirement 13.4: Handle conflicts
      if (isConflictError(error)) {
        handleConflict(queryClient, [['boards', variables.id], ['workspaces']], 'Board update conflict detected.');
      } else {
        toast.error(error.message || 'Failed to update board');
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['boards', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      toast.success('Board updated successfully');
    },
  });
};

/**
 * Archive or unarchive a board
 * Requirement 4.4: Board archival hides from active list
 */
export const useArchiveBoard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, archived }: { id: number; archived: boolean }) =>
      boardsAPI.archive(id, archived),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['boards', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      toast.success(variables.archived ? 'Board archived' : 'Board unarchived');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to archive board');
    },
  });
};

/**
 * Delete a board
 * Requirement 4.5: Board deletion removes all nested data
 */
export const useDeleteBoard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: boardsAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      toast.success('Board deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete board');
    },
  });
};

/**
 * Get board members
 * Requirement 5.3: Board members list displays all members with roles
 */
export const useBoardMembers = (boardId: number) => {
  return useQuery({
    queryKey: ['boards', boardId, 'members'],
    queryFn: () => boardsAPI.getMembers(boardId),
    enabled: !!boardId,
  });
};

/**
 * Add member to board
 * Requirement 5.1: Adding board member succeeds for workspace admins
 */
export const useAddBoardMember = (boardId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AddBoardMemberRequest) =>
      boardsAPI.addMember(boardId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards', boardId] });
      queryClient.invalidateQueries({ queryKey: ['boards', boardId, 'members'] });
      toast.success('Member added to board');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to add member to board');
    },
  });
};

/**
 * Remove member from board
 * Requirement 5.2: Board member removal succeeds for workspace admins
 */
export const useRemoveBoardMember = (boardId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: number) =>
      boardsAPI.removeMember(boardId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards', boardId] });
      queryClient.invalidateQueries({ queryKey: ['boards', boardId, 'members'] });
      toast.success('Member removed from board');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to remove member from board');
    },
  });
};

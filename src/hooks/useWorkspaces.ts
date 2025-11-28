import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workspacesAPI } from '../api/endpoints/workspaces';
import {
  WorkspaceRequest,
  AddMemberRequest,
  UpdateMemberRoleRequest
} from '../types';
import { toast } from '../store';
import { isConflictError, handleConflict } from '../utils/conflictHandler';

/**
 * Custom hooks for workspace operations
 * Implements Requirements 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4
 */

/**
 * Get all workspaces for the current user
 * Requirement 2.1: Display all user workspaces
 */
export const useWorkspaces = () => {
  return useQuery({
    queryKey: ['workspaces'],
    queryFn: workspacesAPI.getAll,
  });
};

/**
 * Get workspace by ID
 * Requirement 2.5: Navigate to workspace boards
 */
export const useWorkspace = (id: number) => {
  return useQuery({
    queryKey: ['workspaces', id],
    queryFn: () => workspacesAPI.getById(id),
    enabled: !!id,
  });
};

/**
 * Get workspace members
 * Requirement 3.4: Display workspace members
 */
export const useWorkspaceMembers = (id: number) => {
  return useQuery({
    queryKey: ['workspaces', id, 'members'],
    queryFn: () => workspacesAPI.getMembers(id),
    enabled: !!id,
  });
};

/**
 * Create a new workspace
 * Requirement 2.2: Workspace creation assigns OWNER role
 * Requirement 13.1: Optimistic updates for immediate UI feedback
 */
export const useCreateWorkspace = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: workspacesAPI.create,
    onMutate: async (newWorkspace) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['workspaces'] });

      // Snapshot previous value
      const previousWorkspaces = queryClient.getQueryData(['workspaces']);

      // Optimistically add new workspace
      queryClient.setQueryData(['workspaces'], (old: any) => {
        if (!old) return old;

        const optimisticWorkspace = {
          id: Date.now(), // Temporary ID
          name: newWorkspace.name,
          description: newWorkspace.description || '',
          members: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        return [...old, optimisticWorkspace];
      });

      return { previousWorkspaces };
    },
    onError: (error: any, _variables, context) => {
      // Requirement 13.2: Revert optimistic update on error
      if (context?.previousWorkspaces) {
        queryClient.setQueryData(['workspaces'], context.previousWorkspaces);
      }
      
      // Requirement 13.4: Handle conflicts
      if (isConflictError(error)) {
        handleConflict(queryClient, [['workspaces']], 'Workspace creation conflict detected.');
      } else {
        toast.error(error.message || 'Failed to create workspace');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      toast.success('Workspace created successfully');
    },
  });
};

/**
 * Update workspace details
 * Requirement 2.3: Workspace updates reflect immediately
 * Requirement 13.1: Optimistic updates for immediate UI feedback
 */
export const useUpdateWorkspace = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: WorkspaceRequest }) =>
      workspacesAPI.update(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['workspaces'] });
      await queryClient.cancelQueries({ queryKey: ['workspaces', id] });

      // Snapshot previous values
      const previousWorkspaces = queryClient.getQueryData(['workspaces']);
      const previousWorkspace = queryClient.getQueryData(['workspaces', id]);

      // Optimistically update workspace
      queryClient.setQueryData(['workspaces', id], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          ...data,
          updatedAt: new Date().toISOString(),
        };
      });

      // Update in workspaces list
      queryClient.setQueryData(['workspaces'], (old: any) => {
        if (!Array.isArray(old)) return old;
        return old.map((workspace: any) =>
          workspace.id === id ? { ...workspace, ...data, updatedAt: new Date().toISOString() } : workspace
        );
      });

      return { previousWorkspaces, previousWorkspace };
    },
    onError: (error: any, variables, context) => {
      // Requirement 13.2: Revert optimistic update on error
      if (context?.previousWorkspaces) {
        queryClient.setQueryData(['workspaces'], context.previousWorkspaces);
      }
      if (context?.previousWorkspace) {
        queryClient.setQueryData(['workspaces', variables.id], context.previousWorkspace);
      }
      
      // Requirement 13.4: Handle conflicts
      if (isConflictError(error)) {
        handleConflict(queryClient, [['workspaces'], ['workspaces', variables.id]], 'Workspace update conflict detected.');
      } else {
        toast.error(error.message || 'Failed to update workspace');
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      queryClient.invalidateQueries({ queryKey: ['workspaces', variables.id] });
      toast.success('Workspace updated successfully');
    },
  });
};

/**
 * Delete workspace
 * Requirement 2.4: Workspace deletion removes all nested data
 */
export const useDeleteWorkspace = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: workspacesAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      toast.success('Workspace deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete workspace');
    },
  });
};

/**
 * Add member to workspace
 * Requirement 3.1: Adding member succeeds for authorized users
 */
export const useAddWorkspaceMember = (workspaceId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AddMemberRequest) =>
      workspacesAPI.addMember(workspaceId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces', workspaceId, 'members'] });
      toast.success('Member added successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to add member');
    },
  });
};

/**
 * Remove member from workspace
 * Requirement 3.3: Member removal succeeds for authorized users
 */
export const useRemoveWorkspaceMember = (workspaceId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (memberId: number) =>
      workspacesAPI.removeMember(workspaceId, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces', workspaceId, 'members'] });
      toast.success('Member removed successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to remove member');
    },
  });
};

/**
 * Update member role in workspace
 * Requirement 3.2: Role updates reflect immediately
 */
export const useUpdateWorkspaceMemberRole = (workspaceId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ memberId, data }: { memberId: number; data: UpdateMemberRoleRequest }) =>
      workspacesAPI.updateMemberRole(workspaceId, memberId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces', workspaceId, 'members'] });
      toast.success('Member role updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update member role');
    },
  });
};

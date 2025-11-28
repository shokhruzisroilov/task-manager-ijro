import { apiClient } from '../client';
import {
  WorkspaceRequest,
  WorkspaceResponse,
  MemberResponse,
  AddMemberRequest,
  UpdateMemberRoleRequest
} from '../../types';

/**
 * Workspace API endpoints
 * Implements Requirements 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4
 */
export const workspacesAPI = {
  /**
   * Get all workspaces for the current user
   * @returns Array of workspaces
   */
  getAll: () =>
    apiClient.get<WorkspaceResponse[]>('/workspaces'),

  /**
   * Get workspace by ID
   * @param id - Workspace ID
   * @returns Workspace details
   */
  getById: (id: number) =>
    apiClient.get<WorkspaceResponse>(`/workspaces/${id}`),

  /**
   * Create a new workspace
   * @param data - Workspace data (name, description)
   * @returns Created workspace
   */
  create: (data: WorkspaceRequest) =>
    apiClient.post<WorkspaceResponse>('/workspaces', data),

  /**
   * Update workspace details
   * @param id - Workspace ID
   * @param data - Updated workspace data
   * @returns Updated workspace
   */
  update: (id: number, data: WorkspaceRequest) =>
    apiClient.put<WorkspaceResponse>(`/workspaces/${id}`, data),

  /**
   * Delete workspace
   * @param id - Workspace ID
   * @returns void
   */
  delete: (id: number) =>
    apiClient.delete<void>(`/workspaces/${id}`),

  /**
   * Get all members of a workspace
   * @param id - Workspace ID
   * @returns Array of workspace members
   */
  getMembers: (id: number) =>
    apiClient.get<MemberResponse[]>(`/workspaces/${id}/members`),

  /**
   * Add a member to workspace
   * @param id - Workspace ID
   * @param data - Member data (userId, role)
   * @returns Added member
   */
  addMember: (id: number, data: AddMemberRequest) =>
    apiClient.post<MemberResponse>(`/workspaces/${id}/members`, data),

  /**
   * Remove a member from workspace
   * @param id - Workspace ID
   * @param memberId - User ID of member to remove
   * @returns void
   */
  removeMember: (id: number, memberId: number) =>
    apiClient.delete<void>(`/workspaces/${id}/members/${memberId}`),

  /**
   * Update member role in workspace
   * @param id - Workspace ID
   * @param memberId - User ID of member
   * @param data - Updated role data
   * @returns Updated member
   */
  updateMemberRole: (id: number, memberId: number, data: UpdateMemberRoleRequest) =>
    apiClient.patch<MemberResponse>(`/workspaces/${id}/members/${memberId}`, data)
};

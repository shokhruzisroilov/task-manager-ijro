import { apiClient } from '../client';
import {
  BoardRequest,
  BoardResponse,
  BoardMemberResponse,
  AddBoardMemberRequest
} from '../../types';

/**
 * Board API endpoints
 * Implements Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3
 */
export const boardsAPI = {
  /**
   * Get all boards in a workspace
   * @param workspaceId - Workspace ID
   * @returns Array of boards
   */
  getByWorkspace: (workspaceId: number) =>
    apiClient.get<BoardResponse[]>(`/workspaces/${workspaceId}/boards`),

  /**
   * Get board by ID
   * @param id - Board ID
   * @returns Board details with columns
   */
  getById: (id: number) =>
    apiClient.get<BoardResponse>(`/boards/${id}`),

  /**
   * Create a new board in a workspace
   * @param workspaceId - Workspace ID
   * @param data - Board data (name, description)
   * @returns Created board
   */
  create: (workspaceId: number, data: BoardRequest) =>
    apiClient.post<BoardResponse>(`/workspaces/${workspaceId}/boards`, data),

  /**
   * Update board details
   * @param id - Board ID
   * @param data - Updated board data
   * @returns Updated board
   */
  update: (id: number, data: BoardRequest) =>
    apiClient.put<BoardResponse>(`/boards/${id}`, data),

  /**
   * Archive or unarchive a board
   * @param id - Board ID
   * @param archived - Archive status
   * @returns Updated board
   */
  archive: (id: number, archived: boolean) =>
    apiClient.patch<BoardResponse>(`/boards/${id}/archive`, { archived }),

  /**
   * Delete a board
   * @param id - Board ID
   * @returns void
   */
  delete: (id: number) =>
    apiClient.delete<void>(`/boards/${id}`),

  /**
   * Get all members of a board
   * @param id - Board ID
   * @returns Array of board members
   */
  getMembers: (id: number) =>
    apiClient.get<BoardMemberResponse[]>(`/boards/${id}/members`),

  /**
   * Add a member to board
   * @param id - Board ID
   * @param data - Member data (userId, role)
   * @returns Added board member
   */
  addMember: (id: number, data: AddBoardMemberRequest) =>
    apiClient.post<BoardMemberResponse>(`/boards/${id}/members`, data),

  /**
   * Remove a member from board
   * @param id - Board ID
   * @param userId - User ID of member to remove
   * @returns void
   */
  removeMember: (id: number, userId: number) =>
    apiClient.delete<void>(`/boards/${id}/members/${userId}`)
};

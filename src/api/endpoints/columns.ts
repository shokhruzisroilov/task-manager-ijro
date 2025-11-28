import { apiClient } from '../client';
import {
  ColumnRequest,
  ColumnResponse,
  UpdatePositionRequest
} from '../../types';

/**
 * Column API endpoints
 * Implements Requirements 6.1, 6.2, 6.3, 6.4
 */
export const columnsAPI = {
  /**
   * Get all columns in a board
   * @param boardId - Board ID
   * @returns Array of columns
   */
  getByBoard: (boardId: number) =>
    apiClient.get<ColumnResponse[]>(`/boards/${boardId}/columns`),

  /**
   * Create a new column in a board
   * @param boardId - Board ID
   * @param data - Column data (name)
   * @returns Created column
   */
  create: (boardId: number, data: ColumnRequest) =>
    apiClient.post<ColumnResponse>(`/boards/${boardId}/columns`, data),

  /**
   * Update column name
   * @param id - Column ID
   * @param data - Updated column data
   * @returns Updated column
   */
  update: (id: number, data: ColumnRequest) =>
    apiClient.put<ColumnResponse>(`/columns/${id}`, data),

  /**
   * Update column position
   * @param id - Column ID
   * @param data - New position data
   * @returns Updated column
   */
  updatePosition: (id: number, data: UpdatePositionRequest) =>
    apiClient.patch<ColumnResponse>(`/columns/${id}/position`, data),

  /**
   * Delete a column
   * @param id - Column ID
   * @returns void
   */
  delete: (id: number) =>
    apiClient.delete<void>(`/columns/${id}`)
};

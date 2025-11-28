import { apiClient } from '../client';
import {
  LabelRequest,
  LabelResponse
} from '../../types';

/**
 * Label API endpoints
 * Implements Requirements 10.1, 10.2, 10.3, 10.4, 10.5
 */
export const labelsAPI = {
  /**
   * Get all labels for a board
   * @param boardId - Board ID
   * @returns Array of labels
   */
  getByBoard: (boardId: number) =>
    apiClient.get<LabelResponse[]>(`/boards/${boardId}/labels`),

  /**
   * Create a new label for a board
   * @param boardId - Board ID
   * @param data - Label data (name, color)
   * @returns Created label
   */
  create: (boardId: number, data: LabelRequest) =>
    apiClient.post<LabelResponse>(`/boards/${boardId}/labels`, data),

  /**
   * Update label details
   * @param id - Label ID
   * @param data - Updated label data
   * @returns Updated label
   */
  update: (id: number, data: LabelRequest) =>
    apiClient.put<LabelResponse>(`/labels/${id}`, data),

  /**
   * Delete a label
   * @param id - Label ID
   * @returns void
   */
  delete: (id: number) =>
    apiClient.delete<void>(`/labels/${id}`),

  /**
   * Attach a label to a card
   * @param cardId - Card ID
   * @param labelId - Label ID
   * @returns void
   */
  attachToCard: (cardId: number, labelId: number) =>
    apiClient.post<void>(`/cards/${cardId}/labels/${labelId}`),

  /**
   * Detach a label from a card
   * @param cardId - Card ID
   * @param labelId - Label ID
   * @returns void
   */
  detachFromCard: (cardId: number, labelId: number) =>
    apiClient.delete<void>(`/cards/${cardId}/labels/${labelId}`)
};

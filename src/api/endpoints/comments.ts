import { apiClient } from '../client';
import {
  CommentRequest,
  CommentResponse
} from '../../types';

/**
 * Comment API endpoints
 * Implements Requirements 11.1, 11.2, 11.3, 11.4
 */
export const commentsAPI = {
  /**
   * Get all comments for a card
   * @param cardId - Card ID
   * @returns Array of comments
   */
  getByCard: (cardId: number) =>
    apiClient.get<CommentResponse[]>(`/cards/${cardId}/comments`),

  /**
   * Create a new comment on a card
   * @param cardId - Card ID
   * @param data - Comment data (text)
   * @returns Created comment
   */
  create: (cardId: number, data: CommentRequest) =>
    apiClient.post<CommentResponse>(`/cards/${cardId}/comments`, data),

  /**
   * Update a comment
   * @param id - Comment ID
   * @param data - Updated comment data
   * @returns Updated comment
   */
  update: (id: number, data: CommentRequest) =>
    apiClient.put<CommentResponse>(`/comments/${id}`, data),

  /**
   * Delete a comment
   * @param id - Comment ID
   * @returns void
   */
  delete: (id: number) =>
    apiClient.delete<void>(`/comments/${id}`)
};

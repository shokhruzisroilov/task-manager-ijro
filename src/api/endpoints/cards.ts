import { apiClient } from '../client';
import {
  CardRequest,
  CardResponse,
  MoveCardRequest,
  CardMemberResponse
} from '../../types';

/**
 * Card API endpoints
 * Implements Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 8.1, 8.2, 9.1, 9.2
 */
export const cardsAPI = {
  /**
   * Get all cards in a column
   * @param columnId - Column ID
   * @returns Array of cards
   */
  getByColumn: (columnId: number) =>
    apiClient.get<CardResponse[]>(`/columns/${columnId}/cards`),

  /**
   * Get card by ID
   * @param id - Card ID
   * @returns Card details with all related data
   */
  getById: (id: number) =>
    apiClient.get<CardResponse>(`/cards/${id}`),

  /**
   * Create a new card in a column
   * @param columnId - Column ID
   * @param data - Card data (title, description, dueDate)
   * @returns Created card
   */
  create: (columnId: number, data: CardRequest) =>
    apiClient.post<CardResponse>(`/columns/${columnId}/cards`, data),

  /**
   * Update card details
   * @param id - Card ID
   * @param data - Updated card data
   * @returns Updated card
   */
  update: (id: number, data: CardRequest) =>
    apiClient.put<CardResponse>(`/cards/${id}`, data),

  /**
   * Move card to different column or position
   * @param id - Card ID
   * @param data - Move data (targetColumnId, newPosition)
   * @returns Updated card
   */
  move: (id: number, data: MoveCardRequest) =>
    apiClient.patch<CardResponse>(`/cards/${id}/move`, data),

  /**
   * Archive or unarchive a card
   * @param id - Card ID
   * @param archived - Archive status
   * @returns Updated card
   */
  archive: (id: number, archived: boolean) =>
    apiClient.patch<CardResponse>(`/cards/${id}/archive`, { archived }),

  /**
   * Delete a card
   * @param id - Card ID
   * @returns void
   */
  delete: (id: number) =>
    apiClient.delete<void>(`/cards/${id}`),

  /**
   * Assign a member to a card
   * @param id - Card ID
   * @param userId - User ID to assign
   * @returns Assigned card member
   */
  assignMember: (id: number, userId: number) =>
    apiClient.post<CardMemberResponse>(`/cards/${id}/members`, null, {
      params: { userId }
    }),

  /**
   * Unassign a member from a card
   * @param id - Card ID
   * @param userId - User ID to unassign
   * @returns void
   */
  unassignMember: (id: number, userId: number) =>
    apiClient.delete<void>(`/cards/${id}/members/${userId}`)
};

import { apiClient } from '../client';
import type { User } from '../../types/models';

/**
 * Get current user profile
 */
export const getCurrentUser = async (): Promise<User> => {
  return await apiClient.get<User>('/users/me');
};

/**
 * Upload profile photo
 */
export const uploadProfilePhoto = async (file: File): Promise<User> => {
  const formData = new FormData();
  formData.append('file', file);

  return await apiClient.post<User>('/users/profile/photo', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

/**
 * Delete profile photo
 */
export const deleteProfilePhoto = async (): Promise<User> => {
  return await apiClient.delete<User>('/users/profile/photo');
};

/**
 * Search for verified users
 */
export const searchUsers = async (query: string): Promise<User[]> => {
  return await apiClient.get<User[]>('/users/search', {
    params: { query },
  });
};

/**
 * Get user by ID
 */
export const getUserById = async (id: number): Promise<User> => {
  return await apiClient.get<User>(`/users/${id}`);
};

/**
 * API object for compatibility with existing code
 */
export const usersAPI = {
  getCurrent: getCurrentUser,
  uploadPhoto: uploadProfilePhoto,
  deletePhoto: deleteProfilePhoto,
  search: searchUsers,
  getById: getUserById,
};

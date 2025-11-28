import { useQuery } from '@tanstack/react-query';
import { usersAPI } from '../api/endpoints/users';

/**
 * Custom hooks for user operations
 */

/**
 * Search for verified users
 * @param query - Search query (name or email)
 * @param enabled - Whether the query should be enabled
 */
export const useSearchUsers = (query: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['users', 'search', query],
    queryFn: () => usersAPI.search(query),
    enabled: enabled && query.length >= 0, // Allow empty query to get all users
    staleTime: 30000, // Cache for 30 seconds
  });
};

/**
 * Get user by ID
 * @param id - User ID
 */
export const useUser = (id: number) => {
  return useQuery({
    queryKey: ['users', id],
    queryFn: () => usersAPI.getById(id),
    enabled: !!id,
  });
};

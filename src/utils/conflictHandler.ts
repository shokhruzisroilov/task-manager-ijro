import { QueryClient } from '@tanstack/react-query';
import { toast } from '../store';

/**
 * Conflict detection and resolution utilities
 * Requirement 13.4: Handle concurrent updates and conflicts
 */

export interface ConflictError {
  status: number;
  message: string;
  conflictType?: 'version' | 'concurrent' | 'deleted';
}

/**
 * Check if an error is a conflict error
 */
export const isConflictError = (error: any): error is ConflictError => {
  return error?.status === 409 || error?.message?.toLowerCase().includes('conflict');
};

/**
 * Handle conflict errors by refreshing affected data
 * Requirement 13.4: Conflict detection triggers notification and refresh
 */
export const handleConflict = (
  queryClient: QueryClient,
  queryKeys: (string | number)[][],
  message?: string
) => {
  // Display notification
  toast.error(
    message || 'A conflict was detected. The data has been refreshed with the latest version.'
  );

  // Refresh all affected queries
  queryKeys.forEach((queryKey) => {
    queryClient.invalidateQueries({ queryKey });
  });
};

/**
 * Retry strategy for failed mutations
 * Requirement 13.2: Handle API failures gracefully
 */
export const shouldRetryMutation = (failureCount: number, error: any): boolean => {
  // Don't retry on client errors (4xx) except for 408 (timeout) and 429 (rate limit)
  if (error?.status >= 400 && error?.status < 500) {
    return error?.status === 408 || error?.status === 429;
  }

  // Retry on server errors (5xx) up to 2 times
  if (error?.status >= 500) {
    return failureCount < 2;
  }

  // Retry on network errors up to 3 times
  if (!error?.status) {
    return failureCount < 3;
  }

  return false;
};

/**
 * Calculate exponential backoff delay for retries
 */
export const getRetryDelay = (attemptIndex: number): number => {
  return Math.min(1000 * 2 ** attemptIndex, 30000); // Max 30 seconds
};

/**
 * Handle network errors
 * Requirement 13.5: Display offline indicator
 */
export const handleNetworkError = () => {
  toast.error('Network error. Please check your connection and try again.');
};

/**
 * Refresh data after successful recovery from error
 */
export const refreshAfterRecovery = (
  queryClient: QueryClient,
  queryKeys: (string | number)[][]
) => {
  queryKeys.forEach((queryKey) => {
    queryClient.invalidateQueries({ queryKey, refetchType: 'active' });
  });
};

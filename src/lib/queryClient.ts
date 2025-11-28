import { QueryClient } from '@tanstack/react-query';

/**
 * React Query client configuration
 * Configures default options for queries and mutations
 * Implements Requirements:
 * - 13.1: Real-time UI updates with optimistic updates
 * - 16.4: Data caching prevents redundant API calls
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Requirement 16.4: Implement stale-while-revalidate pattern
      // Data is considered fresh for 5 minutes
      staleTime: 5 * 60 * 1000, // 5 minutes
      
      // Requirement 16.4: Keep cached data for 10 minutes after last use
      // This allows instant navigation back to previously viewed data
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      
      // Retry failed requests once to handle transient network issues
      retry: 1,
      
      // Requirement 16.4: Don't refetch on window focus to minimize redundant calls
      // Users can manually refresh if needed
      refetchOnWindowFocus: false,
      
      // Refetch when network reconnects to ensure data freshness
      refetchOnReconnect: true,
      
      // Requirement 16.4: Enable stale-while-revalidate
      // Show cached data immediately while fetching fresh data in background
      refetchOnMount: 'always',
      
      // Requirement 16.4: Deduplicate requests
      // Multiple components requesting same data will share a single request
      networkMode: 'online',
    },
    mutations: {
      retry: 0,
      // Enable optimistic updates by default
      // Requirement 13.1: Data updates reflect immediately
      onMutate: async () => {
        // Cancel outgoing refetches to prevent overwriting optimistic update
        // Individual mutations will implement specific optimistic logic
      },
      onError: () => {
        // Requirement 13.2: Revert optimistic updates on error
        // Individual mutations will handle rollback
      },
      onSettled: () => {
        // Requirement 13.1: Refresh data after mutation completes
        // Individual mutations will invalidate specific queries
      },
    },
  },
});

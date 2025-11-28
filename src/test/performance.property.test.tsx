import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useBoards } from '../hooks/useBoards';
import { useWorkspaces } from '../hooks/useWorkspaces';
import { useCards } from '../hooks/useCards';
import * as fc from 'fast-check';
import { boardsAPI } from '../api/endpoints/boards';
import { workspacesAPI } from '../api/endpoints/workspaces';
import { cardsAPI } from '../api/endpoints/cards';

/**
 * Property-Based Tests for Performance Optimization
 * Tests caching behavior and redundant API call prevention
 * Implements Requirement 16.4: Data caching prevents redundant calls
 */

vi.mock('../api/endpoints/boards');
vi.mock('../api/endpoints/workspaces');
vi.mock('../api/endpoints/cards');

describe('Performance Property Tests', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 10 * 60 * 1000,
          staleTime: 5 * 60 * 1000,
        },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  /**
   * Property 67: Data caching prevents redundant calls
   * Feature: trello-clone-frontend, Property 67: Data caching prevents redundant calls
   * Validates: Requirements 16.4
   * 
   * For any valid workspace ID, when multiple components request the same data
   * within the stale time window, the system should make only one API call
   * and serve subsequent requests from cache.
   */
  describe('Property 67: Data caching prevents redundant calls', () => {
    it('should cache board data and prevent redundant API calls', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 1000 }), // workspaceId
          async (workspaceId) => {
            // Create a fresh query client for each iteration to avoid cache pollution
            const freshQueryClient = new QueryClient({
              defaultOptions: {
                queries: {
                  retry: false,
                  gcTime: 10 * 60 * 1000,
                  staleTime: 5 * 60 * 1000,
                },
              },
            });

            const freshWrapper = ({ children }: { children: React.ReactNode }) => (
              <QueryClientProvider client={freshQueryClient}>{children}</QueryClientProvider>
            );

            // Reset mocks for this iteration
            vi.clearAllMocks();

            const mockBoards = [
              {
                id: 1,
                name: 'Test Board',
                description: 'Test Description',
                workspaceId,
                archived: false,
                position: 0,
                columns: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            ];

            vi.mocked(boardsAPI.getByWorkspace).mockResolvedValue(mockBoards);

            // First hook call
            const { result: result1 } = renderHook(
              () => useBoards(workspaceId),
              { wrapper: freshWrapper }
            );

            await waitFor(() => expect(result1.current.isSuccess).toBe(true), { timeout: 3000 });

            // Second hook call with same workspaceId (should use cache)
            const { result: result2 } = renderHook(
              () => useBoards(workspaceId),
              { wrapper: freshWrapper }
            );

            await waitFor(() => expect(result2.current.isSuccess).toBe(true), { timeout: 3000 });

            // Third hook call with same workspaceId (should use cache)
            const { result: result3 } = renderHook(
              () => useBoards(workspaceId),
              { wrapper: freshWrapper }
            );

            await waitFor(() => expect(result3.current.isSuccess).toBe(true), { timeout: 3000 });

            // Verify API was called only once despite multiple hook calls
            expect(boardsAPI.getByWorkspace).toHaveBeenCalledTimes(1);
            expect(boardsAPI.getByWorkspace).toHaveBeenCalledWith(workspaceId);

            // Verify all hooks received the same data
            expect(result1.current.data).toEqual(mockBoards);
            expect(result2.current.data).toEqual(mockBoards);
            expect(result3.current.data).toEqual(mockBoards);
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should cache workspace data and prevent redundant API calls', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 1000 }), // userId (implicit)
          async (seed) => {
            // Create a fresh query client for each iteration to avoid cache pollution
            const freshQueryClient = new QueryClient({
              defaultOptions: {
                queries: {
                  retry: false,
                  gcTime: 10 * 60 * 1000,
                  staleTime: 5 * 60 * 1000,
                },
              },
            });

            const freshWrapper = ({ children }: { children: React.ReactNode }) => (
              <QueryClientProvider client={freshQueryClient}>{children}</QueryClientProvider>
            );

            // Reset mocks for this iteration
            vi.clearAllMocks();

            const mockWorkspaces = [
              {
                id: seed,
                name: `Workspace ${seed}`,
                description: 'Test Description',
                members: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            ];

            vi.mocked(workspacesAPI.getAll).mockResolvedValue(mockWorkspaces);

            // First hook call
            const { result: result1 } = renderHook(
              () => useWorkspaces(),
              { wrapper: freshWrapper }
            );

            await waitFor(() => expect(result1.current.isSuccess).toBe(true), { timeout: 3000 });

            // Second hook call (should use cache)
            const { result: result2 } = renderHook(
              () => useWorkspaces(),
              { wrapper: freshWrapper }
            );

            await waitFor(() => expect(result2.current.isSuccess).toBe(true), { timeout: 3000 });

            // Verify API was called only once
            expect(workspacesAPI.getAll).toHaveBeenCalledTimes(1);

            // Verify both hooks received the same data
            expect(result1.current.data).toEqual(mockWorkspaces);
            expect(result2.current.data).toEqual(mockWorkspaces);
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should cache card data and prevent redundant API calls', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 1000 }), // columnId
          async (columnId) => {
            // Create a fresh query client for each iteration to avoid cache pollution
            const freshQueryClient = new QueryClient({
              defaultOptions: {
                queries: {
                  retry: false,
                  gcTime: 10 * 60 * 1000,
                  staleTime: 5 * 60 * 1000,
                },
              },
            });

            const freshWrapper = ({ children }: { children: React.ReactNode }) => (
              <QueryClientProvider client={freshQueryClient}>{children}</QueryClientProvider>
            );

            // Reset mocks for this iteration
            vi.clearAllMocks();

            const mockCards = [
              {
                id: 1,
                title: 'Test Card',
                description: 'Test Description',
                columnId,
                dueDate: undefined,
                archived: false,
                position: 0,
                members: [],
                comments: [],
                labels: [],
                attachments: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            ];

            vi.mocked(cardsAPI.getByColumn).mockResolvedValue(mockCards);

            // First hook call
            const { result: result1 } = renderHook(
              () => useCards(columnId),
              { wrapper: freshWrapper }
            );

            await waitFor(() => expect(result1.current.isSuccess).toBe(true), { timeout: 3000 });

            // Second hook call with same columnId (should use cache)
            const { result: result2 } = renderHook(
              () => useCards(columnId),
              { wrapper: freshWrapper }
            );

            await waitFor(() => expect(result2.current.isSuccess).toBe(true), { timeout: 3000 });

            // Verify API was called only once
            expect(cardsAPI.getByColumn).toHaveBeenCalledTimes(1);
            expect(cardsAPI.getByColumn).toHaveBeenCalledWith(columnId);

            // Verify both hooks received the same data
            expect(result1.current.data).toEqual(mockCards);
            expect(result2.current.data).toEqual(mockCards);
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should deduplicate simultaneous requests for the same data', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 1000 }), // workspaceId
          async (workspaceId) => {
            // Create a fresh query client for each iteration to avoid cache pollution
            const freshQueryClient = new QueryClient({
              defaultOptions: {
                queries: {
                  retry: false,
                  gcTime: 10 * 60 * 1000,
                  staleTime: 5 * 60 * 1000,
                },
              },
            });

            const freshWrapper = ({ children }: { children: React.ReactNode }) => (
              <QueryClientProvider client={freshQueryClient}>{children}</QueryClientProvider>
            );

            // Reset mocks for this iteration
            vi.clearAllMocks();

            const mockBoards = [
              {
                id: 1,
                name: 'Test Board',
                description: 'Test Description',
                workspaceId,
                archived: false,
                position: 0,
                columns: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            ];

            // Add a delay to simulate network request
            vi.mocked(boardsAPI.getByWorkspace).mockImplementation(
              () => new Promise((resolve) => setTimeout(() => resolve(mockBoards), 50))
            );

            // Render multiple hooks simultaneously (before first request completes)
            const { result: result1 } = renderHook(
              () => useBoards(workspaceId),
              { wrapper: freshWrapper }
            );
            const { result: result2 } = renderHook(
              () => useBoards(workspaceId),
              { wrapper: freshWrapper }
            );
            const { result: result3 } = renderHook(
              () => useBoards(workspaceId),
              { wrapper: freshWrapper }
            );

            // Wait for all to complete
            await waitFor(() => expect(result1.current.isSuccess).toBe(true), { timeout: 3000 });
            await waitFor(() => expect(result2.current.isSuccess).toBe(true), { timeout: 3000 });
            await waitFor(() => expect(result3.current.isSuccess).toBe(true), { timeout: 3000 });

            // Verify API was called only once despite simultaneous requests
            expect(boardsAPI.getByWorkspace).toHaveBeenCalledTimes(1);

            // Verify all hooks received the same data
            expect(result1.current.data).toEqual(mockBoards);
            expect(result2.current.data).toEqual(mockBoards);
            expect(result3.current.data).toEqual(mockBoards);
          }
        ),
        { numRuns: 10 }
      );
    });
  });
});

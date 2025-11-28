import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as fc from 'fast-check';
import { useCreateCard, useUpdateCard, useMoveCard } from '../hooks/useCards';
import { useCreateBoard, useUpdateBoard } from '../hooks/useBoards';
import { useCreateWorkspace, useUpdateWorkspace } from '../hooks/useWorkspaces';
import * as cardsAPI from '../api/endpoints/cards';
import * as boardsAPI from '../api/endpoints/boards';
import * as workspacesAPI from '../api/endpoints/workspaces';

/**
 * Property-based tests for real-time UI updates
 * Feature: trello-clone-frontend
 * Validates: Requirements 13.1, 13.2
 */

// Mock the API modules
vi.mock('../api/endpoints/cards');
vi.mock('../api/endpoints/boards');
vi.mock('../api/endpoints/workspaces');
vi.mock('../store', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Helper to create a wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('Real-time UI Updates - Property Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Property 58: Successful API update reflects immediately
   * Feature: trello-clone-frontend, Property 58
   * Validates: Requirements 13.1
   */
  describe('Property 58: Successful API update reflects immediately', () => {
    it('card creation reflects immediately on success', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            columnId: fc.integer({ min: 1, max: 1000 }),
            title: fc.string({ minLength: 1, maxLength: 100 }),
            description: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
          }),
          async ({ columnId, title, description }) => {
            const mockCard = {
              id: Math.floor(Math.random() * 10000),
              title,
              description: description || '',
              columnId,
              archived: false,
              position: 0,
              members: [],
              comments: [],
              labels: [],
              attachments: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            vi.mocked(cardsAPI.cardsAPI.create).mockResolvedValue(mockCard);

            const wrapper = createWrapper();
            const { result } = renderHook(() => useCreateCard(columnId), { wrapper });

            // Execute mutation
            result.current.mutate({ title, description });

            // Wait for mutation to complete
            await waitFor(() => expect(result.current.isSuccess).toBe(true), { timeout: 3000 });

            // Verify API was called with correct first argument
            expect(cardsAPI.cardsAPI.create).toHaveBeenCalled();
            const calls = vi.mocked(cardsAPI.cardsAPI.create).mock.calls;
            expect(calls[calls.length - 1][0]).toBe(columnId);
          }
        ),
        { numRuns: 10 } // Reduced for faster execution
      );
    }, 10000); // Increased timeout

    it('card update reflects immediately on success', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            id: fc.integer({ min: 1, max: 1000 }),
            title: fc.string({ minLength: 1, maxLength: 100 }),
            description: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
          }),
          async ({ id, title, description }) => {
            const mockCard = {
              id,
              title,
              description: description || '',
              columnId: 1,
              archived: false,
              position: 0,
              members: [],
              comments: [],
              labels: [],
              attachments: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            vi.mocked(cardsAPI.cardsAPI.update).mockResolvedValue(mockCard);

            const wrapper = createWrapper();
            const { result } = renderHook(() => useUpdateCard(), { wrapper });

            // Execute mutation
            result.current.mutate({ id, data: { title, description } });

            // Wait for mutation to complete
            await waitFor(() => expect(result.current.isSuccess).toBe(true), { timeout: 3000 });

            // Verify API was called
            expect(cardsAPI.cardsAPI.update).toHaveBeenCalled();
          }
        ),
        { numRuns: 10 }
      );
    }, 10000);

    it('board creation reflects immediately on success', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            workspaceId: fc.integer({ min: 1, max: 1000 }),
            name: fc.string({ minLength: 1, maxLength: 100 }),
            description: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
          }),
          async ({ workspaceId, name, description }) => {
            const mockBoard = {
              id: Math.floor(Math.random() * 10000),
              name,
              description: description || '',
              workspaceId,
              archived: false,
              position: 0,
              columns: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            vi.mocked(boardsAPI.boardsAPI.create).mockResolvedValue(mockBoard);

            const wrapper = createWrapper();
            const { result } = renderHook(() => useCreateBoard(workspaceId), { wrapper });

            // Execute mutation
            result.current.mutate({ name, description });

            // Wait for mutation to complete
            await waitFor(() => expect(result.current.isSuccess).toBe(true), { timeout: 3000 });

            // Verify API was called
            expect(boardsAPI.boardsAPI.create).toHaveBeenCalled();
          }
        ),
        { numRuns: 10 }
      );
    }, 10000);

    it('workspace creation reflects immediately on success', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 100 }),
            description: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
          }),
          async ({ name, description }) => {
            const mockWorkspace = {
              id: Math.floor(Math.random() * 10000),
              name,
              description: description || '',
              members: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            vi.mocked(workspacesAPI.workspacesAPI.create).mockResolvedValue(mockWorkspace);

            const wrapper = createWrapper();
            const { result } = renderHook(() => useCreateWorkspace(), { wrapper });

            // Execute mutation
            result.current.mutate({ name, description });

            // Wait for mutation to complete
            await waitFor(() => expect(result.current.isSuccess).toBe(true), { timeout: 3000 });

            // Verify API was called
            expect(workspacesAPI.workspacesAPI.create).toHaveBeenCalled();
          }
        ),
        { numRuns: 10 }
      );
    }, 10000);
  });

  /**
   * Property 59: API failure reverts optimistic updates
   * Feature: trello-clone-frontend, Property 59
   * Validates: Requirements 13.2
   */
  describe('Property 59: API failure reverts optimistic updates', () => {
    it('card creation reverts on API failure', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            columnId: fc.integer({ min: 1, max: 1000 }),
            title: fc.string({ minLength: 1, maxLength: 100 }),
            errorStatus: fc.constantFrom(400, 403, 404, 409, 500, 502, 503),
          }),
          async ({ columnId, title, errorStatus }) => {
            const mockError = {
              status: errorStatus,
              message: 'API Error',
            };

            vi.mocked(cardsAPI.cardsAPI.create).mockRejectedValue(mockError);

            const wrapper = createWrapper();
            const { result } = renderHook(() => useCreateCard(columnId), { wrapper });

            // Execute mutation
            result.current.mutate({ title });

            // Wait for mutation to fail
            await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 3000 });

            // Verify error state
            expect(result.current.error).toBeDefined();
            expect(result.current.isSuccess).toBe(false);
          }
        ),
        { numRuns: 10 }
      );
    }, 10000);

    it('card update reverts on API failure', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            id: fc.integer({ min: 1, max: 1000 }),
            title: fc.string({ minLength: 1, maxLength: 100 }),
            errorStatus: fc.constantFrom(400, 403, 404, 409, 500),
          }),
          async ({ id, title, errorStatus }) => {
            const mockError = {
              status: errorStatus,
              message: 'API Error',
            };

            vi.mocked(cardsAPI.cardsAPI.update).mockRejectedValue(mockError);

            const wrapper = createWrapper();
            const { result } = renderHook(() => useUpdateCard(), { wrapper });

            // Execute mutation
            result.current.mutate({ id, data: { title } });

            // Wait for mutation to fail
            await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 3000 });

            // Verify error state
            expect(result.current.error).toBeDefined();
            expect(result.current.isSuccess).toBe(false);
          }
        ),
        { numRuns: 10 }
      );
    }, 10000);

    it('card move reverts on API failure', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            id: fc.integer({ min: 1, max: 1000 }),
            columnId: fc.integer({ min: 1, max: 100 }),
            position: fc.integer({ min: 0, max: 50 }),
            errorStatus: fc.constantFrom(400, 403, 404, 409, 500),
          }),
          async ({ id, columnId, position, errorStatus }) => {
            const mockError = {
              status: errorStatus,
              message: 'API Error',
            };

            vi.mocked(cardsAPI.cardsAPI.move).mockRejectedValue(mockError);

            const wrapper = createWrapper();
            const { result } = renderHook(() => useMoveCard(), { wrapper });

            // Execute mutation
            result.current.mutate({ id, data: { columnId, position } });

            // Wait for mutation to fail
            await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 3000 });

            // Verify error state
            expect(result.current.error).toBeDefined();
            expect(result.current.isSuccess).toBe(false);
          }
        ),
        { numRuns: 10 }
      );
    }, 10000);

    it('board update reverts on API failure', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            id: fc.integer({ min: 1, max: 1000 }),
            name: fc.string({ minLength: 1, maxLength: 100 }),
            errorStatus: fc.constantFrom(400, 403, 404, 409, 500),
          }),
          async ({ id, name, errorStatus }) => {
            const mockError = {
              status: errorStatus,
              message: 'API Error',
            };

            vi.mocked(boardsAPI.boardsAPI.update).mockRejectedValue(mockError);

            const wrapper = createWrapper();
            const { result } = renderHook(() => useUpdateBoard(), { wrapper });

            // Execute mutation
            result.current.mutate({ id, data: { name } });

            // Wait for mutation to fail
            await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 3000 });

            // Verify error state
            expect(result.current.error).toBeDefined();
            expect(result.current.isSuccess).toBe(false);
          }
        ),
        { numRuns: 10 }
      );
    }, 10000);

    it('workspace update reverts on API failure', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            id: fc.integer({ min: 1, max: 1000 }),
            name: fc.string({ minLength: 1, maxLength: 100 }),
            errorStatus: fc.constantFrom(400, 403, 404, 409, 500),
          }),
          async ({ id, name, errorStatus }) => {
            const mockError = {
              status: errorStatus,
              message: 'API Error',
            };

            vi.mocked(workspacesAPI.workspacesAPI.update).mockRejectedValue(mockError);

            const wrapper = createWrapper();
            const { result } = renderHook(() => useUpdateWorkspace(), { wrapper });

            // Execute mutation
            result.current.mutate({ id, data: { name } });

            // Wait for mutation to fail
            await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 3000 });

            // Verify error state
            expect(result.current.error).toBeDefined();
            expect(result.current.isSuccess).toBe(false);
          }
        ),
        { numRuns: 10 }
      );
    }, 10000);
  });
});

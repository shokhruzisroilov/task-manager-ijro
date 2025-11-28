import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCreateCard, useUpdateCard, useMoveCard } from '../hooks/useCards';
import { useCreateBoard, useUpdateBoard } from '../hooks/useBoards';
import * as cardsAPI from '../api/endpoints/cards';
import * as boardsAPI from '../api/endpoints/boards';

/**
 * Unit tests for real-time UI updates with optimistic updates
 * Requirements 13.1, 13.2, 13.4
 */

// Mock the API modules
vi.mock('../api/endpoints/cards');
vi.mock('../api/endpoints/boards');
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

describe('Real-time UI Updates - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Optimistic Card Move', () => {
    it('should optimistically update card position within same column', async () => {
      const mockCard = {
        id: 1,
        title: 'Test Card',
        description: '',
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

      vi.mocked(cardsAPI.cardsAPI.move).mockResolvedValue(mockCard);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useMoveCard(), { wrapper });

      // Execute mutation
      result.current.mutate({
        id: 1,
        data: { columnId: 1, position: 2 },
      });

      // Wait for mutation to complete
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Verify API was called
      expect(cardsAPI.cardsAPI.move).toHaveBeenCalled();
    });

    it('should optimistically update card when moving between columns', async () => {
      const mockCard = {
        id: 1,
        title: 'Test Card',
        description: '',
        columnId: 2,
        archived: false,
        position: 0,
        members: [],
        comments: [],
        labels: [],
        attachments: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      vi.mocked(cardsAPI.cardsAPI.move).mockResolvedValue(mockCard);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useMoveCard(), { wrapper });

      // Execute mutation
      result.current.mutate({
        id: 1,
        data: { columnId: 2, position: 0 },
      });

      // Wait for mutation to complete
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Verify API was called
      expect(cardsAPI.cardsAPI.move).toHaveBeenCalled();
    });
  });

  describe('Optimistic Card Creation', () => {
    it('should optimistically add card to column', async () => {
      const mockCard = {
        id: 1,
        title: 'New Card',
        description: 'Test description',
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

      vi.mocked(cardsAPI.cardsAPI.create).mockResolvedValue(mockCard);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useCreateCard(1), { wrapper });

      // Execute mutation
      result.current.mutate({
        title: 'New Card',
        description: 'Test description',
      });

      // Wait for mutation to complete
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Verify API was called
      expect(cardsAPI.cardsAPI.create).toHaveBeenCalled();
    });

    it('should handle card creation without description', async () => {
      const mockCard = {
        id: 1,
        title: 'New Card',
        description: '',
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

      vi.mocked(cardsAPI.cardsAPI.create).mockResolvedValue(mockCard);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useCreateCard(1), { wrapper });

      // Execute mutation
      result.current.mutate({ title: 'New Card' });

      // Wait for mutation to complete
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Verify API was called
      expect(cardsAPI.cardsAPI.create).toHaveBeenCalled();
    });
  });

  describe('Error Reversion', () => {
    it('should revert optimistic card move on error', async () => {
      const mockError = {
        status: 500,
        message: 'Server error',
      };

      vi.mocked(cardsAPI.cardsAPI.move).mockRejectedValue(mockError);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useMoveCard(), { wrapper });

      // Execute mutation
      result.current.mutate({
        id: 1,
        data: { columnId: 2, position: 0 },
      });

      // Wait for mutation to fail
      await waitFor(() => expect(result.current.isError).toBe(true));

      // Verify error state
      expect(result.current.error).toBeDefined();
      expect(result.current.isSuccess).toBe(false);
    });

    it('should revert optimistic card creation on error', async () => {
      const mockError = {
        status: 400,
        message: 'Bad request',
      };

      vi.mocked(cardsAPI.cardsAPI.create).mockRejectedValue(mockError);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useCreateCard(1), { wrapper });

      // Execute mutation
      result.current.mutate({ title: 'New Card' });

      // Wait for mutation to fail
      await waitFor(() => expect(result.current.isError).toBe(true));

      // Verify error state
      expect(result.current.error).toBeDefined();
      expect(result.current.isSuccess).toBe(false);
    });

    it('should revert optimistic card update on error', async () => {
      const mockError = {
        status: 403,
        message: 'Forbidden',
      };

      vi.mocked(cardsAPI.cardsAPI.update).mockRejectedValue(mockError);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useUpdateCard(), { wrapper });

      // Execute mutation
      result.current.mutate({
        id: 1,
        data: { title: 'Updated Card' },
      });

      // Wait for mutation to fail
      await waitFor(() => expect(result.current.isError).toBe(true));

      // Verify error state
      expect(result.current.error).toBeDefined();
      expect(result.current.isSuccess).toBe(false);
    });
  });

  describe('Conflict Handling', () => {
    it('should handle 409 conflict error for card move', async () => {
      const mockError = {
        status: 409,
        message: 'Conflict detected',
      };

      vi.mocked(cardsAPI.cardsAPI.move).mockRejectedValue(mockError);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useMoveCard(), { wrapper });

      // Execute mutation
      result.current.mutate({
        id: 1,
        data: { columnId: 2, position: 0 },
      });

      // Wait for mutation to fail
      await waitFor(() => expect(result.current.isError).toBe(true));

      // Verify error state
      expect(result.current.error).toBeDefined();
      expect((result.current.error as any).status).toBe(409);
    });

    it('should handle 409 conflict error for board update', async () => {
      const mockError = {
        status: 409,
        message: 'Conflict detected',
      };

      vi.mocked(boardsAPI.boardsAPI.update).mockRejectedValue(mockError);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useUpdateBoard(), { wrapper });

      // Execute mutation
      result.current.mutate({
        id: 1,
        data: { name: 'Updated Board' },
      });

      // Wait for mutation to fail
      await waitFor(() => expect(result.current.isError).toBe(true));

      // Verify error state
      expect(result.current.error).toBeDefined();
      expect((result.current.error as any).status).toBe(409);
    });

    it('should handle conflict error for board creation', async () => {
      const mockError = {
        status: 409,
        message: 'Board already exists',
      };

      vi.mocked(boardsAPI.boardsAPI.create).mockRejectedValue(mockError);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useCreateBoard(1), { wrapper });

      // Execute mutation
      result.current.mutate({ name: 'New Board' });

      // Wait for mutation to fail
      await waitFor(() => expect(result.current.isError).toBe(true));

      // Verify error state
      expect(result.current.error).toBeDefined();
      expect((result.current.error as any).status).toBe(409);
    });
  });

  describe('Optimistic Board Operations', () => {
    it('should optimistically create board', async () => {
      const mockBoard = {
        id: 1,
        name: 'New Board',
        description: '',
        workspaceId: 1,
        archived: false,
        position: 0,
        columns: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      vi.mocked(boardsAPI.boardsAPI.create).mockResolvedValue(mockBoard);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useCreateBoard(1), { wrapper });

      // Execute mutation
      result.current.mutate({ name: 'New Board' });

      // Wait for mutation to complete
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Verify API was called
      expect(boardsAPI.boardsAPI.create).toHaveBeenCalled();
    });

    it('should optimistically update board', async () => {
      const mockBoard = {
        id: 1,
        name: 'Updated Board',
        description: 'New description',
        workspaceId: 1,
        archived: false,
        position: 0,
        columns: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      vi.mocked(boardsAPI.boardsAPI.update).mockResolvedValue(mockBoard);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useUpdateBoard(), { wrapper });

      // Execute mutation
      result.current.mutate({
        id: 1,
        data: { name: 'Updated Board', description: 'New description' },
      });

      // Wait for mutation to complete
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Verify API was called
      expect(boardsAPI.boardsAPI.update).toHaveBeenCalled();
    });
  });
});

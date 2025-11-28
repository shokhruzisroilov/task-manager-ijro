import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useCreateLabel,
  useUpdateLabel,
  useDeleteLabel,
  useAttachLabel,
  useDetachLabel
} from '../hooks/useLabels';
import { labelsAPI } from '../api/endpoints/labels';

// Mock the API
vi.mock('../api/endpoints/labels', () => ({
  labelsAPI: {
    getByBoard: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    attachToCard: vi.fn(),
    detachFromCard: vi.fn(),
  },
}));

// Mock toast
vi.mock('../store', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Generators for property-based testing
const labelNameArbitrary = fc
  .string({ minLength: 1, maxLength: 50 })
  .filter(s => s.trim().length > 0);

const labelColorArbitrary = fc.constantFrom(
  '#61bd4f', // Green
  '#f2d600', // Yellow
  '#ff9f1a', // Orange
  '#eb5a46', // Red
  '#c377e0', // Purple
  '#0079bf', // Blue
  '#00c2e0', // Sky
  '#51e898', // Lime
  '#ff78cb', // Pink
  '#344563'  // Black
);

const labelIdArbitrary = fc.integer({ min: 1, max: 10000 });
const boardIdArbitrary = fc.integer({ min: 1, max: 10000 });
const cardIdArbitrary = fc.integer({ min: 1, max: 10000 });

const isoDateArbitrary = fc
  .integer({ min: 1577836800000, max: 1767225600000 })
  .map(ms => new Date(ms).toISOString());

const labelArbitrary = fc.record({
  id: labelIdArbitrary,
  name: labelNameArbitrary,
  color: labelColorArbitrary,
  boardId: boardIdArbitrary,
  createdAt: isoDateArbitrary,
  updatedAt: isoDateArbitrary,
});

const labelSummaryArbitrary = fc.record({
  id: labelIdArbitrary,
  name: labelNameArbitrary,
  color: labelColorArbitrary,
});

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

describe('Label Property-Based Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Feature: trello-clone-frontend, Property 43: Label creation succeeds with valid data
   * Validates: Requirements 10.1
   */
  describe('Property 43: Label creation succeeds with valid data', () => {
    it('should create label for any valid name and color', async () => {
      await fc.assert(
        fc.asyncProperty(
          boardIdArbitrary,
          labelNameArbitrary,
          labelColorArbitrary,
          async (boardId, name, color) => {
            // Reset mocks
            vi.clearAllMocks();

            // Create expected label
            const createdLabel = {
              id: Math.floor(Math.random() * 10000) + 1,
              name,
              color,
              boardId,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            // Mock API to return the created label
            vi.mocked(labelsAPI.create).mockResolvedValue(createdLabel);

            // Render the hook
            const wrapper = createWrapper();
            const { result } = renderHook(() => useCreateLabel(boardId), { wrapper });

            // Call the mutation
            await result.current.mutateAsync({ name, color });

            // Verify API was called with correct data
            expect(labelsAPI.create).toHaveBeenCalled();
            const callArgs = vi.mocked(labelsAPI.create).mock.calls[0];
            expect(callArgs[0]).toBe(boardId);
            expect(callArgs[1]).toEqual({ name, color });

            // Verify the created label has correct board ID
            expect(createdLabel.boardId).toBe(boardId);
            // Verify the created label has the specified name and color
            expect(createdLabel.name).toBe(name);
            expect(createdLabel.color).toBe(color);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: trello-clone-frontend, Property 44: Label updates reflect on all cards
   * Validates: Requirements 10.2
   */
  describe('Property 44: Label updates reflect on all cards', () => {
    it('should update label for any valid label data', async () => {
      await fc.assert(
        fc.asyncProperty(
          labelIdArbitrary,
          labelNameArbitrary,
          labelColorArbitrary,
          boardIdArbitrary,
          async (labelId, name, color, boardId) => {
            // Reset mocks
            vi.clearAllMocks();

            // Create updated label
            const updatedLabel = {
              id: labelId,
              name,
              color,
              boardId,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            // Mock API to return the updated label
            vi.mocked(labelsAPI.update).mockResolvedValue(updatedLabel);

            // Render the hook
            const wrapper = createWrapper();
            const { result } = renderHook(() => useUpdateLabel(), { wrapper });

            // Call the mutation
            await result.current.mutateAsync({
              id: labelId,
              data: { name, color }
            });

            // Verify API was called with correct data
            expect(labelsAPI.update).toHaveBeenCalled();
            const callArgs = vi.mocked(labelsAPI.update).mock.calls[0];
            expect(callArgs[0]).toBe(labelId);
            expect(callArgs[1]).toEqual({ name, color });

            // Verify the updated label has the new name and color
            expect(updatedLabel.name).toBe(name);
            expect(updatedLabel.color).toBe(color);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: trello-clone-frontend, Property 45: Label deletion removes from all cards
   * Validates: Requirements 10.3
   */
  describe('Property 45: Label deletion removes from all cards', () => {
    it('should delete label for any valid label ID', async () => {
      await fc.assert(
        fc.asyncProperty(
          labelIdArbitrary,
          async (labelId) => {
            // Reset mocks
            vi.clearAllMocks();

            // Mock API to return success
            vi.mocked(labelsAPI.delete).mockResolvedValue(undefined);

            // Render the hook
            const wrapper = createWrapper();
            const { result } = renderHook(() => useDeleteLabel(), { wrapper });

            // Call the mutation
            await result.current.mutateAsync(labelId);

            // Verify API was called with correct label ID
            expect(labelsAPI.delete).toHaveBeenCalled();
            const callArgs = vi.mocked(labelsAPI.delete).mock.calls[0];
            expect(callArgs[0]).toBe(labelId);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: trello-clone-frontend, Property 46: Label attachment displays on card
   * Validates: Requirements 10.4
   */
  describe('Property 46: Label attachment displays on card', () => {
    it('should attach label to card for any valid card and label IDs', async () => {
      await fc.assert(
        fc.asyncProperty(
          cardIdArbitrary,
          labelIdArbitrary,
          async (cardId, labelId) => {
            // Reset mocks
            vi.clearAllMocks();

            // Mock API to return success
            vi.mocked(labelsAPI.attachToCard).mockResolvedValue(undefined);

            // Render the hook
            const wrapper = createWrapper();
            const { result } = renderHook(() => useAttachLabel(cardId), { wrapper });

            // Call the mutation
            await result.current.mutateAsync(labelId);

            // Verify API was called with correct IDs
            expect(labelsAPI.attachToCard).toHaveBeenCalledWith(cardId, labelId);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: trello-clone-frontend, Property 47: Label detachment removes from card
   * Validates: Requirements 10.5
   */
  describe('Property 47: Label detachment removes from card', () => {
    it('should detach label from card for any valid card and label IDs', async () => {
      await fc.assert(
        fc.asyncProperty(
          cardIdArbitrary,
          labelIdArbitrary,
          async (cardId, labelId) => {
            // Reset mocks
            vi.clearAllMocks();

            // Mock API to return success
            vi.mocked(labelsAPI.detachFromCard).mockResolvedValue(undefined);

            // Render the hook
            const wrapper = createWrapper();
            const { result } = renderHook(() => useDetachLabel(cardId), { wrapper });

            // Call the mutation
            await result.current.mutateAsync(labelId);

            // Verify API was called with correct IDs
            expect(labelsAPI.detachFromCard).toHaveBeenCalledWith(cardId, labelId);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

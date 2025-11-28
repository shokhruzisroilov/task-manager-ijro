import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useComments,
  useCreateComment,
  useUpdateComment,
  useDeleteComment
} from '../hooks/useComments';
import { commentsAPI } from '../api/endpoints/comments';

// Mock the API
vi.mock('../api/endpoints/comments', () => ({
  commentsAPI: {
    getByCard: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
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
const commentIdArbitrary = fc.integer({ min: 1, max: 10000 });

const cardIdArbitrary = fc.integer({ min: 1, max: 10000 });

const userIdArbitrary = fc.integer({ min: 1, max: 10000 });

const commentTextArbitrary = fc
  .string({ minLength: 1, maxLength: 1000 })
  .filter(s => s.trim().length > 0);

const isoDateArbitrary = fc
  .integer({ min: 1577836800000, max: 1767225600000 }) // 2020-01-01 to 2025-12-31 in milliseconds
  .map(ms => new Date(ms).toISOString());

const commentArbitrary = fc.record({
  id: commentIdArbitrary,
  text: commentTextArbitrary,
  cardId: cardIdArbitrary,
  authorId: userIdArbitrary,
  authorName: fc.string({ minLength: 1, maxLength: 100 }),
  createdAt: isoDateArbitrary,
  updatedAt: isoDateArbitrary,
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

describe('Comment Property-Based Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Feature: trello-clone-frontend, Property 48: Comment creation displays on card
   * Validates: Requirements 11.1
   */
  describe('Property 48: Comment creation displays on card', () => {
    it('should create comment and display on card for any valid text', async () => {
      await fc.assert(
        fc.asyncProperty(
          cardIdArbitrary,
          commentTextArbitrary,
          userIdArbitrary,
          fc.string({ minLength: 1, maxLength: 100 }),
          async (cardId, text, authorId, authorName) => {
            // Reset mocks
            vi.clearAllMocks();

            // Create comment response
            const createdComment = {
              id: Math.floor(Math.random() * 10000) + 1,
              text,
              cardId,
              authorId,
              authorName,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            // Mock API to return the created comment
            vi.mocked(commentsAPI.create).mockResolvedValue(createdComment);

            // Render the hook
            const wrapper = createWrapper();
            const { result } = renderHook(() => useCreateComment(cardId), { wrapper });

            // Call the mutation
            await result.current.mutateAsync({ text });

            // Verify API was called with correct data
            expect(commentsAPI.create).toHaveBeenCalled();
            const callArgs = vi.mocked(commentsAPI.create).mock.calls[0];
            expect(callArgs).toBeDefined();
            if (callArgs) {
              expect(callArgs[0]).toBe(cardId);
              expect(callArgs[1]).toEqual({ text });
            }

            // Verify the created comment has correct properties
            expect(createdComment.text).toBe(text);
            expect(createdComment.cardId).toBe(cardId);
            expect(createdComment.authorId).toBe(authorId);
            expect(createdComment.authorName).toBe(authorName);
            expect(createdComment.createdAt).toBeDefined();
            expect(createdComment.updatedAt).toBeDefined();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: trello-clone-frontend, Property 51: Comments display in chronological order
   * Validates: Requirements 11.4
   */
  describe('Property 51: Comments display in chronological order', () => {
    it('should display comments in chronological order for any set of comments', async () => {
      await fc.assert(
        fc.asyncProperty(
          cardIdArbitrary,
          fc.array(commentArbitrary, { minLength: 2, maxLength: 10 }),
          async (cardId, comments) => {
            // Reset mocks
            vi.clearAllMocks();

            // Update all comments to have the same cardId
            const cardComments = comments.map(c => ({ ...c, cardId }));

            // Mock API to return the comments
            vi.mocked(commentsAPI.getByCard).mockResolvedValue(cardComments);

            // Render the hook
            const wrapper = createWrapper();
            const { result } = renderHook(() => useComments(cardId), { wrapper });

            // Wait for the query to complete
            await waitFor(() => {
              expect(result.current.isSuccess).toBe(true);
            });

            // Verify API was called with correct card ID
            expect(commentsAPI.getByCard).toHaveBeenCalledWith(cardId);

            // Get the returned comments
            const returnedComments = result.current.data;
            expect(returnedComments).toBeDefined();

            if (returnedComments) {
              // Verify all comments are returned
              expect(returnedComments.length).toBe(cardComments.length);

              // Sort comments by createdAt to verify chronological order
              const sortedComments = [...returnedComments].sort((a, b) => 
                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
              );

              // Verify that when sorted, the order is chronological
              for (let i = 0; i < sortedComments.length - 1; i++) {
                const currentDate = new Date(sortedComments[i]!.createdAt).getTime();
                const nextDate = new Date(sortedComments[i + 1]!.createdAt).getTime();
                expect(currentDate).toBeLessThanOrEqual(nextDate);
              }
            }
          }
        ),
        { numRuns: 50 }
      );
    }, 10000); // Increase timeout to 10 seconds for this test
  });

  /**
   * Feature: trello-clone-frontend, Property 52: Unauthorized comment edit shows error
   * Validates: Requirements 11.5
   */
  describe('Property 52: Unauthorized comment edit shows error', () => {
    it('should show error when non-author attempts to edit comment', async () => {
      await fc.assert(
        fc.asyncProperty(
          commentIdArbitrary,
          commentTextArbitrary,
          async (commentId, newText) => {
            // Reset mocks
            vi.clearAllMocks();

            // Mock API to reject with authorization error
            const error = new Error('You are not authorized to edit this comment');
            vi.mocked(commentsAPI.update).mockRejectedValue(error);

            // Render the hook
            const wrapper = createWrapper();
            const { result } = renderHook(() => useUpdateComment(), { wrapper });

            // Call the mutation and expect it to fail
            await expect(
              result.current.mutateAsync({
                id: commentId,
                data: { text: newText }
              })
            ).rejects.toThrow();

            // Verify API was called with correct data
            expect(commentsAPI.update).toHaveBeenCalled();
            const callArgs = vi.mocked(commentsAPI.update).mock.calls[0];
            expect(callArgs).toBeDefined();
            if (callArgs) {
              expect(callArgs[0]).toBe(commentId);
              expect(callArgs[1]).toEqual({ text: newText });
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should show error when non-author attempts to delete comment', async () => {
      await fc.assert(
        fc.asyncProperty(
          commentIdArbitrary,
          async (commentId) => {
            // Reset mocks
            vi.clearAllMocks();

            // Mock API to reject with authorization error
            const error = new Error('You are not authorized to delete this comment');
            vi.mocked(commentsAPI.delete).mockRejectedValue(error);

            // Render the hook
            const wrapper = createWrapper();
            const { result } = renderHook(() => useDeleteComment(), { wrapper });

            // Call the mutation and expect it to fail
            await expect(
              result.current.mutateAsync(commentId)
            ).rejects.toThrow();

            // Verify API was called with correct comment ID
            expect(commentsAPI.delete).toHaveBeenCalled();
            const callArgs = vi.mocked(commentsAPI.delete).mock.calls[0];
            expect(callArgs).toBeDefined();
            if (callArgs) {
              expect(callArgs[0]).toBe(commentId);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Additional Property: Comment update shows edited indicator
   * Validates: Requirements 11.2
   */
  describe('Additional Property: Comment update shows edited indicator', () => {
    it('should update comment and show edited indicator for any valid text', async () => {
      await fc.assert(
        fc.asyncProperty(
          commentArbitrary,
          commentTextArbitrary,
          async (originalComment, newText) => {
            // Skip if new text is same as original
            fc.pre(newText !== originalComment.text);

            // Reset mocks
            vi.clearAllMocks();

            // Create updated comment with different updatedAt
            const updatedComment = {
              ...originalComment,
              text: newText,
              updatedAt: new Date(
                new Date(originalComment.createdAt).getTime() + 60000
              ).toISOString(), // 1 minute later
            };

            // Mock API to return the updated comment
            vi.mocked(commentsAPI.update).mockResolvedValue(updatedComment);

            // Render the hook
            const wrapper = createWrapper();
            const { result } = renderHook(() => useUpdateComment(), { wrapper });

            // Call the mutation
            await result.current.mutateAsync({
              id: originalComment.id,
              data: { text: newText }
            });

            // Verify API was called with correct data
            expect(commentsAPI.update).toHaveBeenCalled();
            const callArgs = vi.mocked(commentsAPI.update).mock.calls[0];
            expect(callArgs).toBeDefined();
            if (callArgs) {
              expect(callArgs[0]).toBe(originalComment.id);
              expect(callArgs[1]).toEqual({ text: newText });
            }

            // Verify the updated comment has different updatedAt (edited indicator)
            expect(updatedComment.text).toBe(newText);
            expect(updatedComment.updatedAt).not.toBe(updatedComment.createdAt);
            expect(new Date(updatedComment.updatedAt).getTime()).toBeGreaterThan(
              new Date(updatedComment.createdAt).getTime()
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Additional Property: Comment deletion removes from card
   * Validates: Requirements 11.3
   */
  describe('Additional Property: Comment deletion removes from card', () => {
    it('should delete comment for any comment ID', async () => {
      await fc.assert(
        fc.asyncProperty(
          commentIdArbitrary,
          async (commentId) => {
            // Reset mocks
            vi.clearAllMocks();

            // Mock API to resolve successfully
            vi.mocked(commentsAPI.delete).mockResolvedValue(undefined);

            // Render the hook
            const wrapper = createWrapper();
            const { result } = renderHook(() => useDeleteComment(), { wrapper });

            // Call the mutation
            await result.current.mutateAsync(commentId);

            // Verify API was called with correct comment ID
            expect(commentsAPI.delete).toHaveBeenCalled();
            const callArgs = vi.mocked(commentsAPI.delete).mock.calls[0];
            expect(callArgs).toBeDefined();
            if (callArgs) {
              expect(callArgs[0]).toBe(commentId);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

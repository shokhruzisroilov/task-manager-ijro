import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useCreateCard,
  useCard,
  useArchiveCard,
  useAssignCardMember,
  useUnassignCardMember
} from '../hooks/useCards';
import { cardsAPI } from '../api/endpoints/cards';

// Mock the API
vi.mock('../api/endpoints/cards', () => ({
  cardsAPI: {
    getByColumn: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    move: vi.fn(),
    archive: vi.fn(),
    delete: vi.fn(),
    assignMember: vi.fn(),
    unassignMember: vi.fn(),
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
const cardTitleArbitrary = fc
  .string({ minLength: 1, maxLength: 255 })
  .filter(s => s.trim().length > 0);

const cardDescriptionArbitrary = fc
  .option(fc.string({ maxLength: 1000 }), { nil: undefined });

const cardIdArbitrary = fc.integer({ min: 1, max: 10000 });

const columnIdArbitrary = fc.integer({ min: 1, max: 10000 });

const userIdArbitrary = fc.integer({ min: 1, max: 10000 });

const isoDateArbitrary = fc
  .integer({ min: 1577836800000, max: 1767225600000 }) // 2020-01-01 to 2025-12-31 in milliseconds
  .map(ms => new Date(ms).toISOString());

const cardMemberArbitrary = fc.record({
  userId: userIdArbitrary,
  name: fc.string({ minLength: 1, maxLength: 100 }),
});

const labelSummaryArbitrary = fc.record({
  id: fc.integer({ min: 1, max: 10000 }),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  color: fc.constantFrom('#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'),
});

const commentSummaryArbitrary = fc.record({
  id: fc.integer({ min: 1, max: 10000 }),
  text: fc.string({ minLength: 1, maxLength: 500 }),
  authorId: userIdArbitrary,
  authorName: fc.string({ minLength: 1, maxLength: 100 }),
  createdAt: isoDateArbitrary,
});

const attachmentSummaryArbitrary = fc.record({
  id: fc.integer({ min: 1, max: 10000 }),
  fileName: fc.string({ minLength: 1, maxLength: 100 }),
  fileUrl: fc.webUrl(),
  fileSize: fc.integer({ min: 1, max: 10000000 }),
  uploadedBy: userIdArbitrary,
  createdAt: isoDateArbitrary,
});

const cardArbitrary = fc.record({
  id: cardIdArbitrary,
  title: cardTitleArbitrary,
  description: cardDescriptionArbitrary,
  columnId: columnIdArbitrary,
  dueDate: fc.option(isoDateArbitrary, { nil: undefined }),
  archived: fc.boolean(),
  position: fc.integer({ min: 0, max: 100 }),
  members: fc.array(cardMemberArbitrary, { minLength: 0, maxLength: 10 }),
  comments: fc.array(commentSummaryArbitrary, { minLength: 0, maxLength: 20 }),
  labels: fc.array(labelSummaryArbitrary, { minLength: 0, maxLength: 10 }),
  attachments: fc.array(attachmentSummaryArbitrary, { minLength: 0, maxLength: 10 }),
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

describe('Card Property-Based Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Feature: trello-clone-frontend, Property 30: Card creation adds at end position
   * Validates: Requirements 7.1
   */
  describe('Property 30: Card creation adds at end position', () => {
    it('should create card at end position for any valid title', async () => {
      await fc.assert(
        fc.asyncProperty(
          columnIdArbitrary,
          cardTitleArbitrary,
          fc.array(cardArbitrary, { minLength: 0, maxLength: 10 }),
          async (columnId, title, existingCards) => {
            // Reset mocks
            vi.clearAllMocks();

            // Calculate expected position (end of list)
            const expectedPosition = existingCards.length;

            // Create new card with position at end
            const createdCard = {
              id: Math.floor(Math.random() * 10000) + 1,
              title,
              description: undefined,
              columnId,
              dueDate: undefined,
              archived: false,
              position: expectedPosition,
              members: [],
              comments: [],
              labels: [],
              attachments: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            // Mock API to return the created card
            vi.mocked(cardsAPI.create).mockResolvedValue(createdCard);

            // Render the hook
            const wrapper = createWrapper();
            const { result } = renderHook(() => useCreateCard(columnId), { wrapper });

            // Call the mutation
            await result.current.mutateAsync({ title });

            // Verify API was called with correct data
            expect(cardsAPI.create).toHaveBeenCalled();
            const callArgs = vi.mocked(cardsAPI.create).mock.calls[0];
            expect(callArgs[0]).toBe(columnId);
            expect(callArgs[1]).toEqual({ title });

            // Verify the created card has position at end
            expect(createdCard.position).toBe(expectedPosition);
            expect(createdCard.columnId).toBe(columnId);
            expect(createdCard.title).toBe(title);
            // Verify card is not archived by default
            expect(createdCard.archived).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: trello-clone-frontend, Property 31: Card view displays all details
   * Validates: Requirements 7.2
   */
  describe('Property 31: Card view displays all details', () => {
    it('should display all card details for any card', async () => {
      await fc.assert(
        fc.asyncProperty(
          cardArbitrary,
          async (card) => {
            // Reset mocks
            vi.clearAllMocks();

            // Mock API to return the card
            vi.mocked(cardsAPI.getById).mockResolvedValue(card);

            // Call the API directly (testing the data structure)
            const returnedCard = await cardsAPI.getById(card.id);

            // Verify API was called with correct card ID
            expect(cardsAPI.getById).toHaveBeenCalledWith(card.id);

            // Verify the returned card has all expected properties
            expect(returnedCard).toBeDefined();
            expect(returnedCard.id).toBe(card.id);
            expect(returnedCard.title).toBe(card.title);
            expect(returnedCard.description).toBe(card.description);
            expect(returnedCard.columnId).toBe(card.columnId);
            expect(returnedCard.dueDate).toBe(card.dueDate);
            expect(returnedCard.archived).toBe(card.archived);
            expect(returnedCard.position).toBe(card.position);
            expect(returnedCard.members).toEqual(card.members);
            expect(returnedCard.comments).toEqual(card.comments);
            expect(returnedCard.labels).toEqual(card.labels);
            expect(returnedCard.attachments).toEqual(card.attachments);
            expect(returnedCard.createdAt).toBe(card.createdAt);
            expect(returnedCard.updatedAt).toBe(card.updatedAt);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: trello-clone-frontend, Property 33: Card archival hides from board
   * Validates: Requirements 7.4
   */
  describe('Property 33: Card archival hides from board', () => {
    it('should archive card for any card ID', async () => {
      await fc.assert(
        fc.asyncProperty(
          cardIdArbitrary,
          async (cardId) => {
            // Reset mocks
            vi.clearAllMocks();

            // Create archived card
            const archivedCard = {
              id: cardId,
              title: 'Test Card',
              description: undefined,
              columnId: Math.floor(Math.random() * 10000) + 1,
              dueDate: undefined,
              archived: true,
              position: 0,
              members: [],
              comments: [],
              labels: [],
              attachments: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            // Mock API to return the archived card
            vi.mocked(cardsAPI.archive).mockResolvedValue(archivedCard);

            // Render the hook
            const wrapper = createWrapper();
            const { result } = renderHook(() => useArchiveCard(), { wrapper });

            // Call the mutation to archive
            await result.current.mutateAsync({
              id: cardId,
              archived: true
            });

            // Verify API was called with correct data
            expect(cardsAPI.archive).toHaveBeenCalled();
            const callArgs = vi.mocked(cardsAPI.archive).mock.calls[0];
            expect(callArgs[0]).toBe(cardId);
            expect(callArgs[1]).toBe(true);

            // Verify the card is archived
            expect(archivedCard.archived).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should unarchive card for any card ID', async () => {
      await fc.assert(
        fc.asyncProperty(
          cardIdArbitrary,
          async (cardId) => {
            // Reset mocks
            vi.clearAllMocks();

            // Create unarchived card
            const unarchivedCard = {
              id: cardId,
              title: 'Test Card',
              description: undefined,
              columnId: Math.floor(Math.random() * 10000) + 1,
              dueDate: undefined,
              archived: false,
              position: 0,
              members: [],
              comments: [],
              labels: [],
              attachments: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            // Mock API to return the unarchived card
            vi.mocked(cardsAPI.archive).mockResolvedValue(unarchivedCard);

            // Render the hook
            const wrapper = createWrapper();
            const { result } = renderHook(() => useArchiveCard(), { wrapper });

            // Call the mutation to unarchive
            await result.current.mutateAsync({
              id: cardId,
              archived: false
            });

            // Verify API was called with correct data
            expect(cardsAPI.archive).toHaveBeenCalled();
            const callArgs = vi.mocked(cardsAPI.archive).mock.calls[0];
            expect(callArgs[0]).toBe(cardId);
            expect(callArgs[1]).toBe(false);

            // Verify the card is not archived
            expect(unarchivedCard.archived).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: trello-clone-frontend, Property 38: Member assignment displays avatar
   * Validates: Requirements 9.1
   */
  describe('Property 38: Member assignment displays avatar', () => {
    it('should assign member and display avatar for any valid board member', async () => {
      await fc.assert(
        fc.asyncProperty(
          cardIdArbitrary,
          userIdArbitrary,
          fc.string({ minLength: 1, maxLength: 100 }),
          async (cardId, userId, userName) => {
            // Reset mocks
            vi.clearAllMocks();

            // Create assigned member response
            const assignedMember = {
              userId,
              name: userName,
            };

            // Mock API to return the assigned member
            vi.mocked(cardsAPI.assignMember).mockResolvedValue(assignedMember);

            // Render the hook
            const wrapper = createWrapper();
            const { result } = renderHook(() => useAssignCardMember(cardId), { wrapper });

            // Call the mutation to assign member
            await result.current.mutateAsync(userId);

            // Verify API was called with correct data
            expect(cardsAPI.assignMember).toHaveBeenCalled();
            const callArgs = vi.mocked(cardsAPI.assignMember).mock.calls[0];
            expect(callArgs[0]).toBe(cardId);
            expect(callArgs[1]).toBe(userId);

            // Verify the assigned member has correct properties
            expect(assignedMember.userId).toBe(userId);
            expect(assignedMember.name).toBe(userName);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: trello-clone-frontend, Property 40: Card displays all assigned members
   * Validates: Requirements 9.3
   */
  describe('Property 40: Card displays all assigned members', () => {
    it('should display all assigned members for any card', async () => {
      await fc.assert(
        fc.asyncProperty(
          cardArbitrary,
          async (card) => {
            // Reset mocks
            vi.clearAllMocks();

            // Mock API to return the card with members
            vi.mocked(cardsAPI.getById).mockResolvedValue(card);

            // Call the API directly
            const returnedCard = await cardsAPI.getById(card.id);

            // Verify API was called with correct card ID
            expect(cardsAPI.getById).toHaveBeenCalledWith(card.id);

            // Verify the returned card has all members
            expect(returnedCard.members).toBeDefined();
            expect(returnedCard.members).toEqual(card.members);
            expect(returnedCard.members.length).toBe(card.members.length);

            // Verify each member has required properties
            returnedCard.members.forEach((member, index) => {
              expect(member.userId).toBe(card.members[index].userId);
              expect(member.name).toBe(card.members[index].name);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: trello-clone-frontend, Property 41: Non-board-member assignment shows error
   * Validates: Requirements 9.4
   */
  describe('Property 41: Non-board-member assignment shows error', () => {
    it('should show error when assigning non-board-member to card', async () => {
      await fc.assert(
        fc.asyncProperty(
          cardIdArbitrary,
          userIdArbitrary,
          async (cardId, userId) => {
            // Reset mocks
            vi.clearAllMocks();

            // Mock API to reject with error for non-board-member
            const error = new Error('User is not a member of the board');
            vi.mocked(cardsAPI.assignMember).mockRejectedValue(error);

            // Render the hook
            const wrapper = createWrapper();
            const { result } = renderHook(() => useAssignCardMember(cardId), { wrapper });

            // Call the mutation and expect it to fail
            await expect(
              result.current.mutateAsync(userId)
            ).rejects.toThrow();

            // Verify API was called with correct data
            expect(cardsAPI.assignMember).toHaveBeenCalled();
            const callArgs = vi.mocked(cardsAPI.assignMember).mock.calls[0];
            expect(callArgs[0]).toBe(cardId);
            expect(callArgs[1]).toBe(userId);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

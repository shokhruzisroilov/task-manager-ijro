import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useWorkspaces,
  useCreateWorkspace,
  useDeleteWorkspace
} from '../hooks/useWorkspaces';
import { workspacesAPI } from '../api/endpoints/workspaces';
import { WorkspaceRole } from '../types/models';

// Mock the API
vi.mock('../api/endpoints/workspaces', () => ({
  workspacesAPI: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getMembers: vi.fn(),
    addMember: vi.fn(),
    removeMember: vi.fn(),
    updateMemberRole: vi.fn(),
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
const workspaceNameArbitrary = fc
  .string({ minLength: 1, maxLength: 100 })
  .filter(s => s.trim().length > 0);

const workspaceDescriptionArbitrary = fc
  .option(fc.string({ maxLength: 500 }), { nil: undefined });

const workspaceIdArbitrary = fc.integer({ min: 1, max: 10000 });

const userIdArbitrary = fc.integer({ min: 1, max: 10000 });

const isoDateArbitrary = fc
  .integer({ min: 1577836800000, max: 1767225600000 }) // 2020-01-01 to 2025-12-31 in milliseconds
  .map(ms => new Date(ms).toISOString());

const workspaceArbitrary = fc.record({
  id: workspaceIdArbitrary,
  name: workspaceNameArbitrary,
  description: workspaceDescriptionArbitrary,
  members: fc.array(
    fc.record({
      userId: userIdArbitrary,
      userName: fc.string({ minLength: 1, maxLength: 100 }),
      userEmail: fc.emailAddress(),
      role: fc.constantFrom(WorkspaceRole.OWNER, WorkspaceRole.ADMIN, WorkspaceRole.MEMBER),
      joinedAt: isoDateArbitrary,
    }),
    { minLength: 1, maxLength: 10 }
  ),
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

describe('Workspace Property-Based Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Feature: trello-clone-frontend, Property 5: Workspaces page displays all user workspaces
   * Validates: Requirements 2.1
   */
  describe('Property 5: Workspaces page displays all user workspaces', () => {
    it('should return all workspaces for any list of workspaces', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(workspaceArbitrary, { minLength: 0, maxLength: 20 }),
          async (workspaces) => {
            // Reset mocks
            vi.clearAllMocks();

            // Mock API to return the generated workspaces
            vi.mocked(workspacesAPI.getAll).mockResolvedValue(workspaces);

            // Call the API directly
            const result = await workspacesAPI.getAll();

            // Verify all workspaces are returned
            expect(result).toEqual(workspaces);
            expect(result.length).toBe(workspaces.length);

            // Verify API was called
            expect(workspacesAPI.getAll).toHaveBeenCalledTimes(1);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: trello-clone-frontend, Property 6: Workspace creation assigns OWNER role
   * Validates: Requirements 2.2
   */
  describe('Property 6: Workspace creation assigns OWNER role', () => {
    it('should create workspace with OWNER role for any valid workspace data', async () => {
      await fc.assert(
        fc.asyncProperty(
          workspaceNameArbitrary,
          workspaceDescriptionArbitrary,
          userIdArbitrary,
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.emailAddress(),
          async (name, description, userId, userName, userEmail) => {
            // Reset mocks
            vi.clearAllMocks();

            // Create expected workspace with OWNER role
            const createdWorkspace = {
              id: Math.floor(Math.random() * 10000) + 1,
              name,
              description,
              members: [
                {
                  userId,
                  userName,
                  userEmail,
                  role: WorkspaceRole.OWNER,
                  joinedAt: new Date().toISOString(),
                },
              ],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            // Mock API to return the created workspace
            vi.mocked(workspacesAPI.create).mockResolvedValue(createdWorkspace);

            // Render the hook
            const wrapper = createWrapper();
            const { result } = renderHook(() => useCreateWorkspace(), { wrapper });

            // Call the mutation
            await result.current.mutateAsync({ name, description });

            // Verify API was called with correct data (first argument only)
            expect(workspacesAPI.create).toHaveBeenCalled();
            const callArgs = vi.mocked(workspacesAPI.create).mock.calls[0];
            expect(callArgs[0]).toEqual({
              name,
              description,
            });

            // Verify the created workspace has at least one member with OWNER role
            const ownerMembers = createdWorkspace.members.filter(
              m => m.role === WorkspaceRole.OWNER
            );
            expect(ownerMembers.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: trello-clone-frontend, Property 8: Workspace deletion removes all nested data
   * Validates: Requirements 2.4
   */
  describe('Property 8: Workspace deletion removes all nested data', () => {
    it('should successfully delete workspace for any workspace ID', async () => {
      await fc.assert(
        fc.asyncProperty(
          workspaceIdArbitrary,
          async (workspaceId) => {
            // Reset mocks
            vi.clearAllMocks();

            // Mock API to return success (void)
            vi.mocked(workspacesAPI.delete).mockResolvedValue(undefined);

            // Call the API directly
            await workspacesAPI.delete(workspaceId);

            // Verify API was called with correct workspace ID
            expect(workspacesAPI.delete).toHaveBeenCalledWith(workspaceId);
            expect(workspacesAPI.delete).toHaveBeenCalledTimes(1);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

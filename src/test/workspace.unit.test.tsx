import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';
import { WorkspaceList } from '../components/workspace/WorkspaceList';
import { WorkspaceCard } from '../components/workspace/WorkspaceCard';
import { CreateWorkspaceModal } from '../components/workspace/CreateWorkspaceModal';
import { WorkspaceMemberManager } from '../components/workspace/WorkspaceMemberManager';
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

// Mock auth store
vi.mock('../store/auth.store', () => ({
  useAuthStore: vi.fn(() => ({
    user: { id: 1, name: 'Test User', email: 'test@example.com', createdAt: '' },
  })),
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Helper to create a wrapper with QueryClient and Router
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </BrowserRouter>
  );
};

const mockWorkspace = {
  id: 1,
  name: 'Test Workspace',
  description: 'Test Description',
  members: [
    {
      userId: 1,
      userName: 'Test User',
      userEmail: 'test@example.com',
      role: WorkspaceRole.OWNER,
      joinedAt: '2024-01-01T00:00:00Z',
    },
  ],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

describe('Workspace Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  /**
   * Test WorkspaceList rendering
   * Requirements: 2.1
   */
  describe('WorkspaceList', () => {
    it('should render loading state', () => {
      vi.mocked(workspacesAPI.getAll).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <WorkspaceList />
        </Wrapper>
      );

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should render workspaces when loaded', async () => {
      vi.mocked(workspacesAPI.getAll).mockResolvedValue([mockWorkspace]);

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <WorkspaceList />
        </Wrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Workspace')).toBeInTheDocument();
      });
    });

    it('should render multiple workspaces', async () => {
      const workspaces = [
        mockWorkspace,
        {
          ...mockWorkspace,
          id: 2,
          name: 'Second Workspace',
        },
        {
          ...mockWorkspace,
          id: 3,
          name: 'Third Workspace',
        },
      ];
      vi.mocked(workspacesAPI.getAll).mockResolvedValue(workspaces);

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <WorkspaceList />
        </Wrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Workspace')).toBeInTheDocument();
        expect(screen.getByText('Second Workspace')).toBeInTheDocument();
        expect(screen.getByText('Third Workspace')).toBeInTheDocument();
      });
    });

    it('should render empty state when no workspaces', async () => {
      vi.mocked(workspacesAPI.getAll).mockResolvedValue([]);

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <WorkspaceList />
        </Wrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/No workspaces yet/i)).toBeInTheDocument();
      });
    });

    it('should render error state when API fails', async () => {
      vi.mocked(workspacesAPI.getAll).mockRejectedValue(new Error('API Error'));

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <WorkspaceList />
        </Wrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Failed to load workspaces/i)).toBeInTheDocument();
      });
    });

    it('should open create modal when clicking create button', async () => {
      vi.mocked(workspacesAPI.getAll).mockResolvedValue([]);

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <WorkspaceList />
        </Wrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/No workspaces yet/i)).toBeInTheDocument();
      });

      const createButtons = screen.getAllByRole('button', { name: /Create/i });
      fireEvent.click(createButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByLabelText(/Workspace Name/i)).toBeInTheDocument();
      });
    });

    it('should navigate to workspace boards when clicking workspace', async () => {
      vi.mocked(workspacesAPI.getAll).mockResolvedValue([mockWorkspace]);

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <WorkspaceList />
        </Wrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Workspace')).toBeInTheDocument();
      });

      const workspaceCard = screen.getByRole('button', { name: /Open workspace/i });
      fireEvent.click(workspaceCard);

      expect(mockNavigate).toHaveBeenCalledWith('/workspaces/1/boards');
    });
  });

  /**
   * Test WorkspaceCard actions
   * Requirements: 2.1, 2.3
   */
  describe('WorkspaceCard', () => {
    it('should render workspace information', () => {
      const onClick = vi.fn();
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <WorkspaceCard workspace={mockWorkspace} onClick={onClick} />
        </Wrapper>
      );

      expect(screen.getByText('Test Workspace')).toBeInTheDocument();
      expect(screen.getByText('Test Description')).toBeInTheDocument();
      expect(screen.getByText('1 member')).toBeInTheDocument();
    });

    it('should render workspace without description', () => {
      const workspaceWithoutDesc = {
        ...mockWorkspace,
        description: undefined,
      };
      const onClick = vi.fn();
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <WorkspaceCard workspace={workspaceWithoutDesc} onClick={onClick} />
        </Wrapper>
      );

      expect(screen.getByText('Test Workspace')).toBeInTheDocument();
      expect(screen.queryByText('Test Description')).not.toBeInTheDocument();
    });

    it('should call onClick when card is clicked', () => {
      const onClick = vi.fn();
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <WorkspaceCard workspace={mockWorkspace} onClick={onClick} />
        </Wrapper>
      );

      const card = screen.getByRole('button', { name: /Open workspace/i });
      fireEvent.click(card);

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should call onClick when Enter key is pressed', () => {
      const onClick = vi.fn();
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <WorkspaceCard workspace={mockWorkspace} onClick={onClick} />
        </Wrapper>
      );

      const card = screen.getByRole('button', { name: /Open workspace/i });
      fireEvent.keyDown(card, { key: 'Enter' });

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should call onClick when Space key is pressed', () => {
      const onClick = vi.fn();
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <WorkspaceCard workspace={mockWorkspace} onClick={onClick} />
        </Wrapper>
      );

      const card = screen.getByRole('button', { name: /Open workspace/i });
      fireEvent.keyDown(card, { key: ' ' });

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should open settings when settings button is clicked', () => {
      const onClick = vi.fn();
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <WorkspaceCard workspace={mockWorkspace} onClick={onClick} />
        </Wrapper>
      );

      const settingsButton = screen.getByRole('button', { name: /Workspace settings/i });
      fireEvent.click(settingsButton);

      expect(onClick).not.toHaveBeenCalled();
      expect(screen.getByText('Workspace Settings')).toBeInTheDocument();
    });

    it('should not trigger card onClick when settings button is clicked', () => {
      const onClick = vi.fn();
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <WorkspaceCard workspace={mockWorkspace} onClick={onClick} />
        </Wrapper>
      );

      const settingsButton = screen.getByRole('button', { name: /Workspace settings/i });
      fireEvent.click(settingsButton);

      expect(onClick).not.toHaveBeenCalled();
    });

    it('should display member count correctly for multiple members', () => {
      const workspaceWithMembers = {
        ...mockWorkspace,
        members: [
          ...mockWorkspace.members,
          {
            userId: 2,
            userName: 'User 2',
            userEmail: 'user2@example.com',
            role: WorkspaceRole.MEMBER,
            joinedAt: '2024-01-02T00:00:00Z',
          },
        ],
      };

      const onClick = vi.fn();
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <WorkspaceCard workspace={workspaceWithMembers} onClick={onClick} />
        </Wrapper>
      );

      expect(screen.getByText('2 members')).toBeInTheDocument();
    });

    it('should display avatars for first 3 members', () => {
      const workspaceWithManyMembers = {
        ...mockWorkspace,
        members: [
          ...mockWorkspace.members,
          {
            userId: 2,
            userName: 'User 2',
            userEmail: 'user2@example.com',
            role: WorkspaceRole.MEMBER,
            joinedAt: '2024-01-02T00:00:00Z',
          },
          {
            userId: 3,
            userName: 'User 3',
            userEmail: 'user3@example.com',
            role: WorkspaceRole.MEMBER,
            joinedAt: '2024-01-03T00:00:00Z',
          },
          {
            userId: 4,
            userName: 'User 4',
            userEmail: 'user4@example.com',
            role: WorkspaceRole.MEMBER,
            joinedAt: '2024-01-04T00:00:00Z',
          },
        ],
      };

      const onClick = vi.fn();
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <WorkspaceCard workspace={workspaceWithManyMembers} onClick={onClick} />
        </Wrapper>
      );

      expect(screen.getByText('4 members')).toBeInTheDocument();
      expect(screen.getByText('+1')).toBeInTheDocument();
    });
  });

  /**
   * Test CreateWorkspaceModal validation
   * Requirements: 2.2
   */
  describe('CreateWorkspaceModal', () => {
    it('should render modal when open', () => {
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <CreateWorkspaceModal isOpen={true} onClose={vi.fn()} />
        </Wrapper>
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByLabelText(/Workspace Name/i)).toBeInTheDocument();
    });

    it('should not render modal when closed', () => {
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <CreateWorkspaceModal isOpen={false} onClose={vi.fn()} />
        </Wrapper>
      );

      expect(screen.queryByText('Create Workspace')).not.toBeInTheDocument();
    });

    it('should show validation error for empty name', async () => {
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <CreateWorkspaceModal isOpen={true} onClose={vi.fn()} />
        </Wrapper>
      );

      const createButton = screen.getByRole('button', { name: /Create Workspace/i });
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByText(/Workspace name is required/i)).toBeInTheDocument();
      });
    });

    it('should show validation error for whitespace-only name', async () => {
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <CreateWorkspaceModal isOpen={true} onClose={vi.fn()} />
        </Wrapper>
      );

      const nameInput = screen.getByLabelText(/Workspace Name/i);
      fireEvent.change(nameInput, { target: { value: '   ' } });

      const createButton = screen.getByRole('button', { name: /Create Workspace/i });
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByText(/Workspace name is required/i)).toBeInTheDocument();
      });
    });

    it('should show validation error for name exceeding 100 characters', async () => {
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <CreateWorkspaceModal isOpen={true} onClose={vi.fn()} />
        </Wrapper>
      );

      const longName = 'a'.repeat(101);
      const nameInput = screen.getByLabelText(/Workspace Name/i);
      fireEvent.change(nameInput, { target: { value: longName } });

      const createButton = screen.getByRole('button', { name: /Create Workspace/i });
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByText(/must be less than 100 characters/i)).toBeInTheDocument();
      });
    });

    it('should show validation error for description exceeding 500 characters', async () => {
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <CreateWorkspaceModal isOpen={true} onClose={vi.fn()} />
        </Wrapper>
      );

      const nameInput = screen.getByLabelText(/Workspace Name/i);
      fireEvent.change(nameInput, { target: { value: 'Valid Name' } });

      const longDescription = 'a'.repeat(501);
      const descInput = screen.getByLabelText(/Description/i);
      fireEvent.change(descInput, { target: { value: longDescription } });

      const createButton = screen.getByRole('button', { name: /Create Workspace/i });
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByText(/must be less than 500 characters/i)).toBeInTheDocument();
      });
    });

    it('should create workspace with valid data', async () => {
      vi.mocked(workspacesAPI.create).mockResolvedValue(mockWorkspace);

      const onSuccess = vi.fn();
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <CreateWorkspaceModal isOpen={true} onClose={vi.fn()} onSuccess={onSuccess} />
        </Wrapper>
      );

      const nameInput = screen.getByLabelText(/Workspace Name/i);
      fireEvent.change(nameInput, { target: { value: 'New Workspace' } });

      const createButton = screen.getByRole('button', { name: /Create Workspace/i });
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(workspacesAPI.create).toHaveBeenCalled();
        const callArgs = vi.mocked(workspacesAPI.create).mock.calls[0];
        expect(callArgs[0]).toEqual({
          name: 'New Workspace',
          description: undefined,
        });
      });

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled();
      });
    });

    it('should create workspace with name and description', async () => {
      vi.mocked(workspacesAPI.create).mockResolvedValue(mockWorkspace);

      const onSuccess = vi.fn();
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <CreateWorkspaceModal isOpen={true} onClose={vi.fn()} onSuccess={onSuccess} />
        </Wrapper>
      );

      const nameInput = screen.getByLabelText(/Workspace Name/i);
      fireEvent.change(nameInput, { target: { value: 'New Workspace' } });

      const descInput = screen.getByLabelText(/Description/i);
      fireEvent.change(descInput, { target: { value: 'Test description' } });

      const createButton = screen.getByRole('button', { name: /Create Workspace/i });
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(workspacesAPI.create).toHaveBeenCalled();
        const callArgs = vi.mocked(workspacesAPI.create).mock.calls[0];
        expect(callArgs[0]).toEqual({
          name: 'New Workspace',
          description: 'Test description',
        });
      });
    });

    it('should trim whitespace from name and description', async () => {
      vi.mocked(workspacesAPI.create).mockResolvedValue(mockWorkspace);

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <CreateWorkspaceModal isOpen={true} onClose={vi.fn()} />
        </Wrapper>
      );

      const nameInput = screen.getByLabelText(/Workspace Name/i);
      fireEvent.change(nameInput, { target: { value: '  New Workspace  ' } });

      const descInput = screen.getByLabelText(/Description/i);
      fireEvent.change(descInput, { target: { value: '  Test description  ' } });

      const createButton = screen.getByRole('button', { name: /Create Workspace/i });
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(workspacesAPI.create).toHaveBeenCalled();
        const callArgs = vi.mocked(workspacesAPI.create).mock.calls[0];
        expect(callArgs[0]).toEqual({
          name: 'New Workspace',
          description: 'Test description',
        });
      });
    });

    it('should reset form after successful creation', async () => {
      vi.mocked(workspacesAPI.create).mockResolvedValue(mockWorkspace);

      const onSuccess = vi.fn();
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <CreateWorkspaceModal isOpen={true} onClose={vi.fn()} onSuccess={onSuccess} />
        </Wrapper>
      );

      const nameInput = screen.getByLabelText(/Workspace Name/i) as HTMLInputElement;
      fireEvent.change(nameInput, { target: { value: 'New Workspace' } });

      const createButton = screen.getByRole('button', { name: /Create Workspace/i });
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled();
      });

      // Form should be reset
      expect(nameInput.value).toBe('');
    });

    it('should call onClose when cancel button is clicked', () => {
      const onClose = vi.fn();
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <CreateWorkspaceModal isOpen={true} onClose={onClose} />
        </Wrapper>
      );

      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      fireEvent.click(cancelButton);

      expect(onClose).toHaveBeenCalled();
    });

    it('should disable buttons while creating workspace', async () => {
      vi.mocked(workspacesAPI.create).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <CreateWorkspaceModal isOpen={true} onClose={vi.fn()} />
        </Wrapper>
      );

      const nameInput = screen.getByLabelText(/Workspace Name/i);
      fireEvent.change(nameInput, { target: { value: 'New Workspace' } });

      const createButton = screen.getByRole('button', { name: /Create Workspace/i });
      fireEvent.click(createButton);

      await waitFor(() => {
        const cancelButton = screen.getByRole('button', { name: /Cancel/i });
        expect(cancelButton).toBeDisabled();
      });
    });
  });

  /**
   * Test member management permissions
   * Requirements: 3.1, 3.2, 3.3
   */
  describe('WorkspaceMemberManager', () => {
    it('should show add member button for owners', () => {
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <WorkspaceMemberManager
            workspaceId={1}
            members={mockWorkspace.members}
            currentUserRole={WorkspaceRole.OWNER}
          />
        </Wrapper>
      );

      expect(screen.getByRole('button', { name: /Add Member/i })).toBeInTheDocument();
    });

    it('should show add member button for admins', () => {
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <WorkspaceMemberManager
            workspaceId={1}
            members={mockWorkspace.members}
            currentUserRole={WorkspaceRole.ADMIN}
          />
        </Wrapper>
      );

      expect(screen.getByRole('button', { name: /Add Member/i })).toBeInTheDocument();
    });

    it('should not show add member button for regular members', () => {
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <WorkspaceMemberManager
            workspaceId={1}
            members={mockWorkspace.members}
            currentUserRole={WorkspaceRole.MEMBER}
          />
        </Wrapper>
      );

      expect(screen.queryByRole('button', { name: /Add Member/i })).not.toBeInTheDocument();
      expect(screen.getByText(/don't have permission/i)).toBeInTheDocument();
    });

    it('should display all members', () => {
      const members = [
        ...mockWorkspace.members,
        {
          userId: 2,
          userName: 'User 2',
          userEmail: 'user2@example.com',
          role: WorkspaceRole.MEMBER,
          joinedAt: '2024-01-02T00:00:00Z',
        },
      ];

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <WorkspaceMemberManager
            workspaceId={1}
            members={members}
            currentUserRole={WorkspaceRole.OWNER}
          />
        </Wrapper>
      );

      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('User 2')).toBeInTheDocument();
    });

    it('should display member emails', () => {
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <WorkspaceMemberManager
            workspaceId={1}
            members={mockWorkspace.members}
            currentUserRole={WorkspaceRole.OWNER}
          />
        </Wrapper>
      );

      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    it('should display member join dates', () => {
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <WorkspaceMemberManager
            workspaceId={1}
            members={mockWorkspace.members}
            currentUserRole={WorkspaceRole.OWNER}
          />
        </Wrapper>
      );

      expect(screen.getByText(/Joined Jan 1, 2024/i)).toBeInTheDocument();
    });

    it('should show "You" badge for current user', () => {
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <WorkspaceMemberManager
            workspaceId={1}
            members={mockWorkspace.members}
            currentUserRole={WorkspaceRole.OWNER}
          />
        </Wrapper>
      );

      expect(screen.getByText('You')).toBeInTheDocument();
    });

    it('should show remove button for other members when user is admin', () => {
      const members = [
        ...mockWorkspace.members,
        {
          userId: 2,
          userName: 'User 2',
          userEmail: 'user2@example.com',
          role: WorkspaceRole.MEMBER,
          joinedAt: '2024-01-02T00:00:00Z',
        },
      ];

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <WorkspaceMemberManager
            workspaceId={1}
            members={members}
            currentUserRole={WorkspaceRole.ADMIN}
          />
        </Wrapper>
      );

      const removeButtons = screen.getAllByRole('button', { name: /Remove/i });
      expect(removeButtons.length).toBeGreaterThan(0);
    });

    it('should not show remove button for current user', () => {
      const members = [
        ...mockWorkspace.members,
        {
          userId: 2,
          userName: 'User 2',
          userEmail: 'user2@example.com',
          role: WorkspaceRole.MEMBER,
          joinedAt: '2024-01-02T00:00:00Z',
        },
      ];

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <WorkspaceMemberManager
            workspaceId={1}
            members={members}
            currentUserRole={WorkspaceRole.OWNER}
          />
        </Wrapper>
      );

      // Current user should have role badge, not remove button
      const roleBadges = screen.getAllByText('OWNER');
      expect(roleBadges.length).toBeGreaterThan(0);
    });

    it('should show role dropdown for other members when user is admin', () => {
      const members = [
        ...mockWorkspace.members,
        {
          userId: 2,
          userName: 'User 2',
          userEmail: 'user2@example.com',
          role: WorkspaceRole.MEMBER,
          joinedAt: '2024-01-02T00:00:00Z',
        },
      ];

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <WorkspaceMemberManager
            workspaceId={1}
            members={members}
            currentUserRole={WorkspaceRole.ADMIN}
          />
        </Wrapper>
      );

      // Should have dropdowns for role selection (checking for dropdown buttons)
      const dropdownButtons = screen.getAllByRole('button', { name: /Member/i });
      expect(dropdownButtons.length).toBeGreaterThan(0);
    });

    it('should not show role dropdown for regular members', () => {
      const members = [
        ...mockWorkspace.members,
        {
          userId: 2,
          userName: 'User 2',
          userEmail: 'user2@example.com',
          role: WorkspaceRole.MEMBER,
          joinedAt: '2024-01-02T00:00:00Z',
        },
      ];

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <WorkspaceMemberManager
            workspaceId={1}
            members={members}
            currentUserRole={WorkspaceRole.MEMBER}
          />
        </Wrapper>
      );

      // Should not have dropdowns for role selection
      const dropdowns = screen.queryAllByRole('combobox');
      expect(dropdowns.length).toBe(0);
    });

    it('should open add member modal when clicking add member button', () => {
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <WorkspaceMemberManager
            workspaceId={1}
            members={mockWorkspace.members}
            currentUserRole={WorkspaceRole.OWNER}
          />
        </Wrapper>
      );

      const addButton = screen.getByRole('button', { name: /Add Member/i });
      fireEvent.click(addButton);

      // Modal should open (checking for modal dialog and user ID input)
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByLabelText(/User ID/i)).toBeInTheDocument();
    });

    it('should open confirm dialog when clicking remove button', () => {
      const members = [
        ...mockWorkspace.members,
        {
          userId: 2,
          userName: 'User 2',
          userEmail: 'user2@example.com',
          role: WorkspaceRole.MEMBER,
          joinedAt: '2024-01-02T00:00:00Z',
        },
      ];

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <WorkspaceMemberManager
            workspaceId={1}
            members={members}
            currentUserRole={WorkspaceRole.OWNER}
          />
        </Wrapper>
      );

      const removeButtons = screen.getAllByRole('button', { name: /Remove/i });
      fireEvent.click(removeButtons[0]);

      // Confirm dialog should open
      expect(screen.getByText(/Are you sure you want to remove/i)).toBeInTheDocument();
    });
  });
});

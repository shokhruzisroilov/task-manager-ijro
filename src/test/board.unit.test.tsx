import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';
import { BoardList } from '../components/board/BoardList';
import { BoardCard } from '../components/board/BoardCard';
import { CreateBoardModal } from '../components/board/CreateBoardModal';
import { BoardSettings } from '../components/board/BoardSettings';
import { boardsAPI } from '../api/endpoints/boards';
import { BoardRole } from '../types/models';

// Mock the API
vi.mock('../api/endpoints/boards', () => ({
  boardsAPI: {
    getByWorkspace: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    archive: vi.fn(),
    delete: vi.fn(),
    addMember: vi.fn(),
    removeMember: vi.fn(),
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

const mockBoard = {
  id: 1,
  name: 'Test Board',
  description: 'Test Description',
  workspaceId: 1,
  archived: false,
  position: 0,
  columns: [
    { id: 1, name: 'To Do', position: 0 },
    { id: 2, name: 'In Progress', position: 1 },
  ],
  members: [
    {
      userId: 1,
      userName: 'Test User',
      userEmail: 'test@example.com',
      role: BoardRole.EDITOR,
      joinedAt: '2024-01-01T00:00:00Z',
    },
  ],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

describe('Board Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  /**
   * Test BoardList rendering
   * Requirements: 4.1
   */
  describe('BoardList', () => {
    it('should render loading state', () => {
      vi.mocked(boardsAPI.getByWorkspace).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <BoardList workspaceId={1} />
        </Wrapper>
      );

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should render error state', async () => {
      vi.mocked(boardsAPI.getByWorkspace).mockRejectedValue(
        new Error('Failed to load')
      );

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <BoardList workspaceId={1} />
        </Wrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/failed to load boards/i)).toBeInTheDocument();
      });
    });

    it('should render boards list', async () => {
      vi.mocked(boardsAPI.getByWorkspace).mockResolvedValue([mockBoard]);

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <BoardList workspaceId={1} />
        </Wrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Board')).toBeInTheDocument();
      });
    });

    it('should filter out archived boards', async () => {
      const archivedBoard = { ...mockBoard, id: 2, name: 'Archived Board', archived: true };
      vi.mocked(boardsAPI.getByWorkspace).mockResolvedValue([mockBoard, archivedBoard]);

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <BoardList workspaceId={1} />
        </Wrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Board')).toBeInTheDocument();
        expect(screen.queryByText('Archived Board')).not.toBeInTheDocument();
      });
    });

    it('should render empty state when no boards', async () => {
      vi.mocked(boardsAPI.getByWorkspace).mockResolvedValue([]);

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <BoardList workspaceId={1} />
        </Wrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/no boards yet/i)).toBeInTheDocument();
      });
    });

    it('should open create modal when clicking create button', async () => {
      vi.mocked(boardsAPI.getByWorkspace).mockResolvedValue([mockBoard]);

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <BoardList workspaceId={1} />
        </Wrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Board')).toBeInTheDocument();
      });

      const createButton = screen.getAllByText(/create board/i)[0];
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });
  });

  /**
   * Test BoardCard actions
   * Requirements: 4.2, 4.3
   */
  describe('BoardCard', () => {
    it('should render board information', () => {
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <BoardCard board={mockBoard} onClick={vi.fn()} />
        </Wrapper>
      );

      expect(screen.getByText('Test Board')).toBeInTheDocument();
      expect(screen.getByText('Test Description')).toBeInTheDocument();
      expect(screen.getByText(/2 columns/i)).toBeInTheDocument();
    });

    it('should call onClick when card is clicked', () => {
      const handleClick = vi.fn();
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <BoardCard board={mockBoard} onClick={handleClick} />
        </Wrapper>
      );

      const card = screen.getByRole('button', { name: /open board test board/i });
      fireEvent.click(card);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should open settings when settings button is clicked', () => {
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <BoardCard board={mockBoard} onClick={vi.fn()} />
        </Wrapper>
      );

      const settingsButton = screen.getByLabelText(/board settings/i);
      fireEvent.click(settingsButton);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  /**
   * Test CreateBoardModal validation
   * Requirements: 4.1
   */
  describe('CreateBoardModal', () => {
    it('should render modal when open', () => {
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <CreateBoardModal
            workspaceId={1}
            isOpen={true}
            onClose={vi.fn()}
          />
        </Wrapper>
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getAllByText('Create Board').length).toBeGreaterThan(0);
    });

    it('should validate required board name', async () => {
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <CreateBoardModal
            workspaceId={1}
            isOpen={true}
            onClose={vi.fn()}
          />
        </Wrapper>
      );

      const form = screen.getByRole('dialog').querySelector('form');
      if (form) {
        fireEvent.submit(form);
      }

      await waitFor(() => {
        expect(screen.getByText(/board name is required/i)).toBeInTheDocument();
      });
    });

    it('should create board with valid data', async () => {
      vi.mocked(boardsAPI.create).mockResolvedValue(mockBoard);

      const handleSuccess = vi.fn();
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <CreateBoardModal
            workspaceId={1}
            isOpen={true}
            onClose={vi.fn()}
            onSuccess={handleSuccess}
          />
        </Wrapper>
      );

      const nameInput = screen.getByLabelText(/board name/i);
      fireEvent.change(nameInput, { target: { value: 'New Board' } });

      const submitButton = screen.getByRole('button', { name: /create board/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(boardsAPI.create).toHaveBeenCalledWith(1, {
          name: 'New Board',
          description: undefined,
        });
        expect(handleSuccess).toHaveBeenCalled();
      });
    });
  });

  /**
   * Test board member permissions
   * Requirements: 5.1, 5.2
   */
  describe('BoardSettings - Member Permissions', () => {
    it('should display board members', async () => {
      vi.mocked(boardsAPI.getById).mockResolvedValue(mockBoard);

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <BoardSettings
            board={mockBoard}
            isOpen={true}
            onClose={vi.fn()}
          />
        </Wrapper>
      );

      // Switch to members tab
      const membersTab = screen.getByText('Members');
      fireEvent.click(membersTab);

      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeInTheDocument();
        expect(screen.getByText('test@example.com')).toBeInTheDocument();
      });
    });

    it('should allow adding board members', async () => {
      vi.mocked(boardsAPI.getById).mockResolvedValue(mockBoard);

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <BoardSettings
            board={mockBoard}
            isOpen={true}
            onClose={vi.fn()}
          />
        </Wrapper>
      );

      // Switch to members tab
      const membersTab = screen.getByText('Members');
      fireEvent.click(membersTab);

      await waitFor(() => {
        const addButton = screen.getByRole('button', { name: /add member/i });
        expect(addButton).toBeInTheDocument();
      });
    });
  });
});

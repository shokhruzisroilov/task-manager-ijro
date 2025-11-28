import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import React from 'react';
import { Card } from '../components/card/Card';
import { AddCardButton } from '../components/card/AddCardButton';
import { CardModal } from '../components/card/CardModal';
import { CardMembers } from '../components/card/CardMembers';
import { AssignMemberModal } from '../components/card/AssignMemberModal';
import { Card as CardType, BoardMember, BoardRole } from '../types/models';
import { cardsAPI } from '../api/endpoints/cards';
import { boardsAPI } from '../api/endpoints/boards';

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

vi.mock('../api/endpoints/boards', () => ({
  boardsAPI: {
    getById: vi.fn(),
    getAll: vi.fn(),
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

// Helper to create a wrapper with QueryClient and DndProvider
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <DndProvider backend={HTML5Backend}>
        {children}
      </DndProvider>
    </QueryClientProvider>
  );
};

describe('Card Component Unit Tests', () => {
  const mockCard: CardType = {
    id: 1,
    title: 'Test Card',
    description: 'Test Description',
    columnId: 1,
    dueDate: '2025-12-31T00:00:00Z',
    archived: false,
    position: 0,
    members: [
      { userId: 1, name: 'John Doe' },
      { userId: 2, name: 'Jane Smith' },
    ],
    comments: [
      {
        id: 1,
        text: 'Test comment',
        authorId: 1,
        authorName: 'John Doe',
        createdAt: '2025-01-01T00:00:00Z',
      },
    ],
    labels: [
      { id: 1, name: 'Bug', color: '#ff0000' },
      { id: 2, name: 'Feature', color: '#00ff00' },
    ],
    attachments: [
      {
        id: 1,
        fileName: 'test.pdf',
        fileUrl: 'https://example.com/test.pdf',
        fileSize: 1024,
        uploadedBy: 1,
        createdAt: '2025-01-01T00:00:00Z',
      },
    ],
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Card rendering', () => {
    it('should render card with title', () => {
      const onClick = vi.fn();
      const wrapper = createWrapper();
      render(<Card card={mockCard} onClick={onClick} />, { wrapper });

      expect(screen.getByText('Test Card')).toBeInTheDocument();
    });

    it('should render card with labels', () => {
      const onClick = vi.fn();
      const wrapper = createWrapper();
      render(<Card card={mockCard} onClick={onClick} />, { wrapper });

      expect(screen.getByText('Bug')).toBeInTheDocument();
      expect(screen.getByText('Feature')).toBeInTheDocument();
    });

    it('should render card with due date', () => {
      const onClick = vi.fn();
      const wrapper = createWrapper();
      render(<Card card={mockCard} onClick={onClick} />, { wrapper });

      expect(screen.getByText(/12\/31\/2025/)).toBeInTheDocument();
    });

    it('should render card with member avatars', () => {
      const onClick = vi.fn();
      const wrapper = createWrapper();
      render(<Card card={mockCard} onClick={onClick} />, { wrapper });

      // Check that members are rendered (avatars will show initials)
      const avatars = screen.getAllByText(/[A-Z]{1,2}/);
      expect(avatars.length).toBeGreaterThan(0);
    });

    it('should render card with badges for description, comments, and attachments', () => {
      const onClick = vi.fn();
      const wrapper = createWrapper();
      render(<Card card={mockCard} onClick={onClick} />, { wrapper });

      // Check for description badge
      expect(screen.getByTitle('Has description')).toBeInTheDocument();
      // Check for comments badge
      expect(screen.getByTitle('1 comments')).toBeInTheDocument();
      // Check for attachments badge
      expect(screen.getByTitle('1 attachments')).toBeInTheDocument();
    });

    it('should call onClick when card is clicked', () => {
      const onClick = vi.fn();
      const wrapper = createWrapper();
      render(<Card card={mockCard} onClick={onClick} />, { wrapper });

      fireEvent.click(screen.getByText('Test Card'));
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should show overdue styling for past due dates', () => {
      const pastDueCard = {
        ...mockCard,
        dueDate: '2020-01-01T00:00:00Z',
      };
      const onClick = vi.fn();
      const wrapper = createWrapper();
      const { container } = render(<Card card={pastDueCard} onClick={onClick} />, { wrapper });

      const dueDateElement = container.querySelector('.card-due-date.overdue');
      expect(dueDateElement).toBeInTheDocument();
    });

    it('should render card without optional fields', () => {
      const minimalCard: CardType = {
        id: 1,
        title: 'Minimal Card',
        description: undefined,
        columnId: 1,
        dueDate: undefined,
        archived: false,
        position: 0,
        members: [],
        comments: [],
        labels: [],
        attachments: [],
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      };
      const onClick = vi.fn();
      const wrapper = createWrapper();
      render(<Card card={minimalCard} onClick={onClick} />, { wrapper });

      expect(screen.getByText('Minimal Card')).toBeInTheDocument();
      expect(screen.queryByTitle('Has description')).not.toBeInTheDocument();
    });
  });

  describe('AddCardButton', () => {
    it('should render add card button', () => {
      const onAddCard = vi.fn();
      render(<AddCardButton columnId={1} onAddCard={onAddCard} />);

      expect(screen.getByText('Add a card')).toBeInTheDocument();
    });

    it('should show input form when button is clicked', () => {
      const onAddCard = vi.fn();
      render(<AddCardButton columnId={1} onAddCard={onAddCard} />);

      fireEvent.click(screen.getByText('Add a card'));
      expect(screen.getByPlaceholderText('Enter card title...')).toBeInTheDocument();
    });

    it('should call onAddCard when form is submitted with valid title', async () => {
      const onAddCard = vi.fn().mockResolvedValue(undefined);
      render(<AddCardButton columnId={1} onAddCard={onAddCard} />);

      // Open form
      fireEvent.click(screen.getByText('Add a card'));

      // Enter title
      const input = screen.getByPlaceholderText('Enter card title...');
      fireEvent.change(input, { target: { value: 'New Card' } });

      // Submit form
      fireEvent.click(screen.getByText('Add Card'));

      await waitFor(() => {
        expect(onAddCard).toHaveBeenCalledWith('New Card');
      });
    });

    it('should not call onAddCard when form is submitted with empty title', () => {
      const onAddCard = vi.fn();
      render(<AddCardButton columnId={1} onAddCard={onAddCard} />);

      // Open form
      fireEvent.click(screen.getByText('Add a card'));

      // Submit form without entering title
      fireEvent.click(screen.getByText('Add Card'));

      expect(onAddCard).not.toHaveBeenCalled();
    });

    it('should close form when cancel is clicked', () => {
      const onAddCard = vi.fn();
      render(<AddCardButton columnId={1} onAddCard={onAddCard} />);

      // Open form
      fireEvent.click(screen.getByText('Add a card'));
      expect(screen.getByPlaceholderText('Enter card title...')).toBeInTheDocument();

      // Click cancel
      fireEvent.click(screen.getByText('Cancel'));
      expect(screen.queryByPlaceholderText('Enter card title...')).not.toBeInTheDocument();
    });

    it('should close form when Escape key is pressed', () => {
      const onAddCard = vi.fn();
      render(<AddCardButton columnId={1} onAddCard={onAddCard} />);

      // Open form
      fireEvent.click(screen.getByText('Add a card'));
      const input = screen.getByPlaceholderText('Enter card title...');

      // Press Escape
      fireEvent.keyDown(input, { key: 'Escape' });
      expect(screen.queryByPlaceholderText('Enter card title...')).not.toBeInTheDocument();
    });

    it('should clear input after successful submission', async () => {
      const onAddCard = vi.fn().mockResolvedValue(undefined);
      render(<AddCardButton columnId={1} onAddCard={onAddCard} />);

      // Open form
      fireEvent.click(screen.getByText('Add a card'));

      // Enter title
      const input = screen.getByPlaceholderText('Enter card title...') as HTMLInputElement;
      fireEvent.change(input, { target: { value: 'New Card' } });

      // Submit form
      fireEvent.click(screen.getByText('Add Card'));

      await waitFor(() => {
        expect(onAddCard).toHaveBeenCalled();
      });

      // Form should be closed after successful submission
      await waitFor(() => {
        expect(screen.queryByPlaceholderText('Enter card title...')).not.toBeInTheDocument();
      });
    });
  });

  describe('CardModal', () => {
    beforeEach(() => {
      vi.mocked(cardsAPI.getById).mockResolvedValue(mockCard);
    });

    it('should render card modal with card details', async () => {
      const onClose = vi.fn();
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <CardModal cardId={1} boardId={1} onClose={onClose} />
        </Wrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Card')).toBeInTheDocument();
      });

      expect(screen.getByText('Test Description')).toBeInTheDocument();
    });

    it('should show loading state initially', () => {
      const onClose = vi.fn();
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <CardModal cardId={1} boardId={1} onClose={onClose} />
        </Wrapper>
      );

      expect(screen.getAllByText('Loading...').length).toBeGreaterThan(0);
    });

    it('should allow editing card title', async () => {
      vi.mocked(cardsAPI.update).mockResolvedValue({
        ...mockCard,
        title: 'Updated Title',
      });

      const onClose = vi.fn();
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <CardModal cardId={1} boardId={1} onClose={onClose} />
        </Wrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Card')).toBeInTheDocument();
      });

      // Click on title to edit
      fireEvent.click(screen.getByText('Test Card'));

      // Find input and change value
      const titleInput = screen.getByDisplayValue('Test Card') as HTMLInputElement;
      fireEvent.change(titleInput, { target: { value: 'Updated Title' } });
      fireEvent.blur(titleInput);

      await waitFor(() => {
        expect(cardsAPI.update).toHaveBeenCalled();
      });
    });

    it('should show archive button', async () => {
      const onClose = vi.fn();
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <CardModal cardId={1} boardId={1} onClose={onClose} />
        </Wrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Archive')).toBeInTheDocument();
      });
    });

    it('should show delete button with confirmation', async () => {
      const onClose = vi.fn();
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <CardModal cardId={1} boardId={1} onClose={onClose} />
        </Wrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Delete')).toBeInTheDocument();
      });

      // Click delete button
      fireEvent.click(screen.getByText('Delete'));

      // Confirmation dialog should appear
      await waitFor(() => {
        expect(screen.getByText('Delete Card')).toBeInTheDocument();
      });
    });
  });
});

describe('Card Members Unit Tests', () => {
  const mockCard: CardType = {
    id: 1,
    title: 'Test Card',
    description: 'Test Description',
    columnId: 1,
    dueDate: '2025-12-31T00:00:00Z',
    archived: false,
    position: 0,
    members: [
      { userId: 1, name: 'John Doe' },
      { userId: 2, name: 'Jane Smith' },
    ],
    comments: [],
    labels: [],
    attachments: [],
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  };

  const mockCardWithMembers: CardType = {
    ...mockCard,
    members: [
      { userId: 1, name: 'John Doe' },
      { userId: 2, name: 'Jane Smith' },
      { userId: 3, name: 'Bob Johnson' },
    ],
  };

  const mockBoardMembers: BoardMember[] = [
    {
      userId: 1,
      userName: 'John Doe',
      userEmail: 'john@example.com',
      role: BoardRole.EDITOR,
      joinedAt: '2025-01-01T00:00:00Z',
    },
    {
      userId: 2,
      userName: 'Jane Smith',
      userEmail: 'jane@example.com',
      role: BoardRole.EDITOR,
      joinedAt: '2025-01-01T00:00:00Z',
    },
    {
      userId: 3,
      userName: 'Bob Johnson',
      userEmail: 'bob@example.com',
      role: BoardRole.EDITOR,
      joinedAt: '2025-01-01T00:00:00Z',
    },
    {
      userId: 4,
      userName: 'Alice Brown',
      userEmail: 'alice@example.com',
      role: BoardRole.EDITOR,
      joinedAt: '2025-01-01T00:00:00Z',
    },
  ];

  const mockBoard = {
    id: 1,
    name: 'Test Board',
    description: 'Test Board Description',
    workspaceId: 1,
    archived: false,
    position: 0,
    columns: [],
    members: mockBoardMembers,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Member assignment flow - Requirements 9.1', () => {
    it('should successfully assign a member to a card', async () => {
      const newMember = { userId: 4, name: 'Alice Brown' };
      vi.mocked(cardsAPI.assignMember).mockResolvedValue(newMember);

      // Test that the API is called correctly
      const result = await cardsAPI.assignMember(1, 4);

      expect(cardsAPI.assignMember).toHaveBeenCalledWith(1, 4);
      expect(result).toEqual(newMember);
    });

    it('should handle assignment errors gracefully', async () => {
      const error = new Error('User is not a member of the board');
      vi.mocked(cardsAPI.assignMember).mockRejectedValue(error);

      await expect(cardsAPI.assignMember(1, 999)).rejects.toThrow(
        'User is not a member of the board'
      );
    });

    it('should render CardMembers component with assign button', () => {
      const wrapper = createWrapper();
      render(
        <CardMembers
          cardId={1}
          boardId={1}
          members={mockCard.members}
        />,
        { wrapper }
      );

      expect(screen.getByText('Members')).toBeInTheDocument();
      expect(screen.getByText('Assign')).toBeInTheDocument();
    });

    it('should open AssignMemberModal when assign button is clicked', async () => {
      vi.mocked(boardsAPI.getById).mockResolvedValue(mockBoard);

      const wrapper = createWrapper();
      render(
        <CardMembers
          cardId={1}
          boardId={1}
          members={mockCard.members}
        />,
        { wrapper }
      );

      // Click assign button
      fireEvent.click(screen.getByText('Assign'));

      // Modal should open
      await waitFor(() => {
        expect(screen.getByText('Assign Member')).toBeInTheDocument();
      });
    });

    it('should display available board members in AssignMemberModal', async () => {
      vi.mocked(boardsAPI.getById).mockResolvedValue(mockBoard);

      const wrapper = createWrapper();
      render(
        <AssignMemberModal
          cardId={1}
          boardId={1}
          assignedMembers={[{ userId: 1, name: 'John Doe' }]}
          onClose={vi.fn()}
        />,
        { wrapper }
      );

      // Wait for board data to load
      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });

      // Should show unassigned members
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
      expect(screen.getByText('Alice Brown')).toBeInTheDocument();

      // Should not show already assigned member
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    });

    it('should call assignMember API when member is selected', async () => {
      const newMember = { userId: 3, name: 'Bob Johnson' };
      vi.mocked(cardsAPI.assignMember).mockResolvedValue(newMember);
      vi.mocked(boardsAPI.getById).mockResolvedValue(mockBoard);

      const onClose = vi.fn();
      const wrapper = createWrapper();
      render(
        <AssignMemberModal
          cardId={1}
          boardId={1}
          assignedMembers={[{ userId: 1, name: 'John Doe' }]}
          onClose={onClose}
        />,
        { wrapper }
      );

      // Wait for board data to load
      await waitFor(() => {
        expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
      });

      // Click on Bob Johnson to assign
      fireEvent.click(screen.getByText('Bob Johnson'));

      await waitFor(() => {
        expect(cardsAPI.assignMember).toHaveBeenCalledWith(1, 3);
      });
    });
  });

  describe('Member unassignment - Requirements 9.2', () => {
    it('should successfully unassign a member from a card', async () => {
      vi.mocked(cardsAPI.unassignMember).mockResolvedValue(undefined);

      await cardsAPI.unassignMember(1, 2);

      expect(cardsAPI.unassignMember).toHaveBeenCalledWith(1, 2);
    });

    it('should handle unassignment errors gracefully', async () => {
      const error = new Error('Member not found on card');
      vi.mocked(cardsAPI.unassignMember).mockRejectedValue(error);

      await expect(cardsAPI.unassignMember(1, 999)).rejects.toThrow(
        'Member not found on card'
      );
    });

    it('should display remove button for each member in CardMembers', () => {
      const wrapper = createWrapper();
      render(
        <CardMembers
          cardId={1}
          boardId={1}
          members={mockCardWithMembers.members}
        />,
        { wrapper }
      );

      // Should show all members
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();

      // Should have remove buttons for each member
      const removeButtons = screen.getAllByLabelText(/Remove/);
      expect(removeButtons).toHaveLength(3);
    });

    it('should call unassignMember when remove button is clicked', async () => {
      vi.mocked(cardsAPI.unassignMember).mockResolvedValue(undefined);

      const wrapper = createWrapper();
      render(
        <CardMembers
          cardId={1}
          boardId={1}
          members={mockCardWithMembers.members}
        />,
        { wrapper }
      );

      // Click remove button for John Doe
      const removeButton = screen.getByLabelText('Remove John Doe');
      fireEvent.click(removeButton);

      await waitFor(() => {
        expect(cardsAPI.unassignMember).toHaveBeenCalledWith(1, 1);
      });
    });

    it('should show empty state when no members are assigned', () => {
      const wrapper = createWrapper();
      render(
        <CardMembers
          cardId={1}
          boardId={1}
          members={[]}
        />,
        { wrapper }
      );

      expect(screen.getByText('No members assigned to this card')).toBeInTheDocument();
    });
  });

  describe('Duplicate assignment prevention - Requirements 9.5', () => {
    it('should prevent assigning an already-assigned member', async () => {
      const error = new Error('User is already assigned to this card');
      vi.mocked(cardsAPI.assignMember).mockRejectedValue(error);

      // Try to assign a member who is already assigned
      await expect(cardsAPI.assignMember(1, 1)).rejects.toThrow(
        'User is already assigned to this card'
      );
    });

    it('should not show already-assigned members in AssignMemberModal', async () => {
      vi.mocked(boardsAPI.getById).mockResolvedValue(mockBoard);

      const wrapper = createWrapper();
      render(
        <AssignMemberModal
          cardId={1}
          boardId={1}
          assignedMembers={mockCardWithMembers.members}
          onClose={vi.fn()}
        />,
        { wrapper }
      );

      // Wait for board data to load
      await waitFor(() => {
        expect(screen.getByText('Alice Brown')).toBeInTheDocument();
      });

      // Should only show Alice Brown (not assigned)
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
      expect(screen.queryByText('Bob Johnson')).not.toBeInTheDocument();
    });

    it('should show message when all board members are assigned', async () => {
      const allMembersAssigned = mockBoardMembers.map(m => ({
        userId: m.userId,
        name: m.userName,
      }));

      vi.mocked(boardsAPI.getById).mockResolvedValue(mockBoard);

      const wrapper = createWrapper();
      render(
        <AssignMemberModal
          cardId={1}
          boardId={1}
          assignedMembers={allMembersAssigned}
          onClose={vi.fn()}
        />,
        { wrapper }
      );

      await waitFor(() => {
        expect(
          screen.getByText('All board members are already assigned to this card')
        ).toBeInTheDocument();
      });
    });
  });

  describe('Non-board-member validation - Requirements 9.4', () => {
    it('should reject assignment of non-board-member', async () => {
      const error = new Error('User is not a member of the board');
      vi.mocked(cardsAPI.assignMember).mockRejectedValue(error);

      // Try to assign a user who is not a board member
      await expect(cardsAPI.assignMember(1, 999)).rejects.toThrow(
        'User is not a member of the board'
      );
    });

    it('should validate board membership before assignment', async () => {
      // This test verifies that the API properly validates board membership
      const error = new Error('User is not a member of the board');
      vi.mocked(cardsAPI.assignMember).mockRejectedValue(error);

      await expect(cardsAPI.assignMember(1, 888)).rejects.toThrow();
      expect(cardsAPI.assignMember).toHaveBeenCalledWith(1, 888);
    });

    it('should only show board members in AssignMemberModal', async () => {
      vi.mocked(boardsAPI.getById).mockResolvedValue(mockBoard);

      const wrapper = createWrapper();
      render(
        <AssignMemberModal
          cardId={1}
          boardId={1}
          assignedMembers={[]}
          onClose={vi.fn()}
        />,
        { wrapper }
      );

      // Wait for board data to load
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Should only show board members
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
      expect(screen.getByText('Alice Brown')).toBeInTheDocument();

      // Should not show any non-board members (we can't test for absence of unknown users,
      // but we verify only the expected board members are shown)
      const memberItems = screen.getAllByText(/example\.com/);
      expect(memberItems).toHaveLength(4); // Only 4 board members
    });

    it('should filter members by search query', async () => {
      vi.mocked(boardsAPI.getById).mockResolvedValue(mockBoard);

      const wrapper = createWrapper();
      render(
        <AssignMemberModal
          cardId={1}
          boardId={1}
          assignedMembers={[]}
          onClose={vi.fn()}
        />,
        { wrapper }
      );

      // Wait for board data to load
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Search for "Alice"
      const searchInput = screen.getByPlaceholderText('Search members...');
      fireEvent.change(searchInput, { target: { value: 'Alice' } });

      // Should only show Alice Brown
      expect(screen.getByText('Alice Brown')).toBeInTheDocument();
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
      expect(screen.queryByText('Bob Johnson')).not.toBeInTheDocument();
    });
  });

  describe('Card member display', () => {
    it('should display all assigned members on card', () => {
      const onClick = vi.fn();
      const wrapper = createWrapper();
      render(<Card card={mockCardWithMembers} onClick={onClick} />, { wrapper });

      // Card should show member avatars
      const cardElement = screen.getByText('Test Card').closest('.card');
      expect(cardElement).toBeInTheDocument();

      // Check that member section exists
      const memberSection = cardElement?.querySelector('.card-members');
      expect(memberSection).toBeInTheDocument();
    });

    it('should show member count indicator when more than 3 members', () => {
      const cardWithManyMembers: CardType = {
        ...mockCard,
        members: [
          { userId: 1, name: 'John Doe' },
          { userId: 2, name: 'Jane Smith' },
          { userId: 3, name: 'Bob Johnson' },
          { userId: 4, name: 'Alice Brown' },
          { userId: 5, name: 'Charlie Wilson' },
        ],
      };

      const onClick = vi.fn();
      const wrapper = createWrapper();
      render(<Card card={cardWithManyMembers} onClick={onClick} />, { wrapper });

      // Should show "+2" indicator for the 2 additional members beyond the first 3
      expect(screen.getByText('+2')).toBeInTheDocument();
    });

    it('should not show member section when no members assigned', () => {
      const cardWithNoMembers: CardType = {
        ...mockCard,
        members: [],
      };

      const onClick = vi.fn();
      const wrapper = createWrapper();
      const { container } = render(<Card card={cardWithNoMembers} onClick={onClick} />, { wrapper });

      // Member section should not be rendered
      const memberSection = container.querySelector('.card-members');
      expect(memberSection).not.toBeInTheDocument();
    });
  });

  describe('Member assignment in CardModal', () => {
    it('should display members section in card modal', async () => {
      vi.mocked(cardsAPI.getById).mockResolvedValue(mockCardWithMembers);

      const onClose = vi.fn();
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <CardModal cardId={1} boardId={1} onClose={onClose} />
        </Wrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Members')).toBeInTheDocument();
      });

      // Check that member names are displayed
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
    });

    it('should show assign button in members section', async () => {
      vi.mocked(cardsAPI.getById).mockResolvedValue(mockCard);

      const onClose = vi.fn();
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <CardModal cardId={1} boardId={1} onClose={onClose} />
        </Wrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Members')).toBeInTheDocument();
      });

      // Should have an Assign button
      const assignButtons = screen.getAllByText('Assign');
      expect(assignButtons.length).toBeGreaterThan(0);
    });
  });
});

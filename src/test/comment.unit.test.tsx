import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { CardComments } from '../components/card/CardComments';
import { Comment } from '../components/card/Comment';
import { CommentForm } from '../components/card/CommentForm';
import { Comment as CommentType } from '../types/models';
import { commentsAPI } from '../api/endpoints/comments';
import { useAuthStore } from '../store/auth.store';

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

// Mock auth store
vi.mock('../store/auth.store', () => ({
  useAuthStore: vi.fn(),
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

describe('Comment Component Unit Tests', () => {
  const mockComment: CommentType = {
    id: 1,
    text: 'This is a test comment',
    cardId: 1,
    authorId: 1,
    authorName: 'John Doe',
    createdAt: '2025-01-01T10:00:00Z',
    updatedAt: '2025-01-01T10:00:00Z',
  };

  const mockUser = {
    id: 1,
    email: 'john@example.com',
    name: 'John Doe',
    createdAt: '2025-01-01T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuthStore).mockReturnValue({
      user: mockUser,
      token: 'mock-token',
      isAuthenticated: true,
      isLoading: false,
      error: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      loadUser: vi.fn(),
      clearError: vi.fn(),
    });
  });

  /**
   * Test comment creation
   * Requirement 11.1: Comment creation displays on card
   */
  describe('Comment Creation', () => {
    it('should render comment form when user is authenticated', () => {
      const onSubmit = vi.fn();
      render(<CommentForm onSubmit={onSubmit} isSubmitting={false} />);

      expect(screen.getByPlaceholderText('Write a comment...')).toBeInTheDocument();
    });

    it('should not render comment form when user is not authenticated', () => {
      vi.mocked(useAuthStore).mockReturnValue({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        loadUser: vi.fn(),
        clearError: vi.fn(),
      });

      const onSubmit = vi.fn();
      const { container } = render(<CommentForm onSubmit={onSubmit} isSubmitting={false} />);

      expect(container.firstChild).toBeNull();
    });

    it('should call onSubmit when comment is posted', async () => {
      const onSubmit = vi.fn();
      render(<CommentForm onSubmit={onSubmit} isSubmitting={false} />);

      const textarea = screen.getByPlaceholderText('Write a comment...');
      fireEvent.change(textarea, { target: { value: 'New comment' } });
      fireEvent.focus(textarea);

      await waitFor(() => {
        expect(screen.getByText('Post')).toBeInTheDocument();
      });

      const postButton = screen.getByText('Post');
      fireEvent.click(postButton);

      expect(onSubmit).toHaveBeenCalledWith('New comment');
    });

    it('should not submit empty comments', () => {
      const onSubmit = vi.fn();
      render(<CommentForm onSubmit={onSubmit} isSubmitting={false} />);

      const textarea = screen.getByPlaceholderText('Write a comment...');
      fireEvent.focus(textarea);

      const postButton = screen.getByText('Post');
      expect(postButton).toBeDisabled();

      fireEvent.click(postButton);
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('should clear input after successful submission', async () => {
      const onSubmit = vi.fn();
      const { rerender } = render(<CommentForm onSubmit={onSubmit} isSubmitting={false} />);

      const textarea = screen.getByPlaceholderText('Write a comment...') as HTMLTextAreaElement;
      fireEvent.change(textarea, { target: { value: 'New comment' } });
      fireEvent.focus(textarea);

      const postButton = screen.getByText('Post');
      fireEvent.click(postButton);

      // Simulate successful submission by re-rendering
      rerender(<CommentForm onSubmit={onSubmit} isSubmitting={false} />);

      expect(textarea.value).toBe('');
    });
  });

  /**
   * Test comment editing
   * Requirement 11.2: Comment update shows edited indicator
   */
  describe('Comment Editing', () => {
    it('should show edit button for comment author', () => {
      const onEdit = vi.fn();
      const onDelete = vi.fn();

      render(
        <Comment
          comment={mockComment}
          onEdit={onEdit}
          onDelete={onDelete}
          isEditing={false}
          isDeleting={false}
        />
      );

      expect(screen.getByText('Edit')).toBeInTheDocument();
    });

    it('should not show edit button for non-author', () => {
      vi.mocked(useAuthStore).mockReturnValue({
        user: { ...mockUser, id: 2 }, // Different user ID
        token: 'mock-token',
        isAuthenticated: true,
        isLoading: false,
        error: null,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        loadUser: vi.fn(),
        clearError: vi.fn(),
      });

      const onEdit = vi.fn();
      const onDelete = vi.fn();

      render(
        <Comment
          comment={mockComment}
          onEdit={onEdit}
          onDelete={onDelete}
          isEditing={false}
          isDeleting={false}
        />
      );

      expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    });

    it('should show edit form when edit button is clicked', () => {
      const onEdit = vi.fn();
      const onDelete = vi.fn();

      render(
        <Comment
          comment={mockComment}
          onEdit={onEdit}
          onDelete={onDelete}
          isEditing={false}
          isDeleting={false}
        />
      );

      const editButton = screen.getByText('Edit');
      fireEvent.click(editButton);

      expect(screen.getByDisplayValue(mockComment.text)).toBeInTheDocument();
      expect(screen.getByText('Save')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('should call onEdit when save button is clicked', () => {
      const onEdit = vi.fn();
      const onDelete = vi.fn();

      render(
        <Comment
          comment={mockComment}
          onEdit={onEdit}
          onDelete={onDelete}
          isEditing={false}
          isDeleting={false}
        />
      );

      const editButton = screen.getByText('Edit');
      fireEvent.click(editButton);

      const textarea = screen.getByDisplayValue(mockComment.text);
      fireEvent.change(textarea, { target: { value: 'Updated comment' } });

      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      expect(onEdit).toHaveBeenCalledWith(mockComment.id, 'Updated comment');
    });

    it('should show edited indicator when comment is edited', () => {
      const editedComment: CommentType = {
        ...mockComment,
        updatedAt: '2025-01-01T11:00:00Z', // Different from createdAt
      };

      const onEdit = vi.fn();
      const onDelete = vi.fn();

      render(
        <Comment
          comment={editedComment}
          onEdit={onEdit}
          onDelete={onDelete}
          isEditing={false}
          isDeleting={false}
        />
      );

      expect(screen.getByText(/\(edited\)/i)).toBeInTheDocument();
    });
  });

  /**
   * Test comment deletion
   * Requirement 11.3: Comment deletion removes from card
   */
  describe('Comment Deletion', () => {
    it('should show delete button for comment author', () => {
      const onEdit = vi.fn();
      const onDelete = vi.fn();

      render(
        <Comment
          comment={mockComment}
          onEdit={onEdit}
          onDelete={onDelete}
          isEditing={false}
          isDeleting={false}
        />
      );

      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    it('should show confirmation dialog when delete button is clicked', () => {
      const onEdit = vi.fn();
      const onDelete = vi.fn();

      render(
        <Comment
          comment={mockComment}
          onEdit={onEdit}
          onDelete={onDelete}
          isEditing={false}
          isDeleting={false}
        />
      );

      const deleteButton = screen.getByText('Delete');
      fireEvent.click(deleteButton);

      expect(screen.getByText('Delete Comment')).toBeInTheDocument();
      expect(screen.getByText(/Are you sure you want to delete this comment/i)).toBeInTheDocument();
    });

    it('should call onDelete when confirmed', async () => {
      const onEdit = vi.fn();
      const onDelete = vi.fn();

      render(
        <Comment
          comment={mockComment}
          onEdit={onEdit}
          onDelete={onDelete}
          isEditing={false}
          isDeleting={false}
        />
      );

      const deleteButton = screen.getByText('Delete');
      fireEvent.click(deleteButton);

      // Wait for the confirm dialog to appear
      await waitFor(() => {
        expect(screen.getByText('Delete Comment')).toBeInTheDocument();
      });

      // Find all Delete buttons and click the one in the dialog
      const allDeleteButtons = screen.getAllByText('Delete');
      const confirmButton = allDeleteButtons[allDeleteButtons.length - 1]; // Last one is in the dialog
      fireEvent.click(confirmButton);

      expect(onDelete).toHaveBeenCalledWith(mockComment.id);
    });
  });

  /**
   * Test author-only permissions
   * Requirement 11.5: Unauthorized comment edit shows error
   */
  describe('Author-Only Permissions', () => {
    it('should not show edit/delete buttons for non-author', () => {
      vi.mocked(useAuthStore).mockReturnValue({
        user: { ...mockUser, id: 999 }, // Different user ID
        token: 'mock-token',
        isAuthenticated: true,
        isLoading: false,
        error: null,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        loadUser: vi.fn(),
        clearError: vi.fn(),
      });

      const onEdit = vi.fn();
      const onDelete = vi.fn();

      render(
        <Comment
          comment={mockComment}
          onEdit={onEdit}
          onDelete={onDelete}
          isEditing={false}
          isDeleting={false}
        />
      );

      expect(screen.queryByText('Edit')).not.toBeInTheDocument();
      expect(screen.queryByText('Delete')).not.toBeInTheDocument();
    });
  });

  /**
   * Test CardComments component
   * Requirement 11.4: Comments display in chronological order
   */
  describe('CardComments Component', () => {
    it('should display loading state', () => {
      vi.mocked(commentsAPI.getByCard).mockReturnValue(
        new Promise(() => {}) // Never resolves
      );

      const wrapper = createWrapper();
      render(<CardComments cardId={1} />, { wrapper });

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should display empty state when no comments', async () => {
      vi.mocked(commentsAPI.getByCard).mockResolvedValue([]);

      const wrapper = createWrapper();
      render(<CardComments cardId={1} />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText(/No comments yet/i)).toBeInTheDocument();
      });
    });

    it('should display comments in chronological order', async () => {
      const comments: CommentType[] = [
        {
          id: 1,
          text: 'First comment',
          cardId: 1,
          authorId: 1,
          authorName: 'John Doe',
          createdAt: '2025-01-01T10:00:00Z',
          updatedAt: '2025-01-01T10:00:00Z',
        },
        {
          id: 2,
          text: 'Second comment',
          cardId: 1,
          authorId: 2,
          authorName: 'Jane Smith',
          createdAt: '2025-01-01T11:00:00Z',
          updatedAt: '2025-01-01T11:00:00Z',
        },
        {
          id: 3,
          text: 'Third comment',
          cardId: 1,
          authorId: 1,
          authorName: 'John Doe',
          createdAt: '2025-01-01T12:00:00Z',
          updatedAt: '2025-01-01T12:00:00Z',
        },
      ];

      vi.mocked(commentsAPI.getByCard).mockResolvedValue(comments);

      const wrapper = createWrapper();
      render(<CardComments cardId={1} />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText('First comment')).toBeInTheDocument();
      });

      const commentElements = screen.getAllByText(/comment/i);
      const firstIndex = commentElements.findIndex((el) => el.textContent?.includes('First'));
      const secondIndex = commentElements.findIndex((el) => el.textContent?.includes('Second'));
      const thirdIndex = commentElements.findIndex((el) => el.textContent?.includes('Third'));

      expect(firstIndex).toBeLessThan(secondIndex);
      expect(secondIndex).toBeLessThan(thirdIndex);
    });

    it('should display comment count', async () => {
      const comments: CommentType[] = [
        {
          id: 1,
          text: 'First comment',
          cardId: 1,
          authorId: 1,
          authorName: 'John Doe',
          createdAt: '2025-01-01T10:00:00Z',
          updatedAt: '2025-01-01T10:00:00Z',
        },
        {
          id: 2,
          text: 'Second comment',
          cardId: 1,
          authorId: 2,
          authorName: 'Jane Smith',
          createdAt: '2025-01-01T11:00:00Z',
          updatedAt: '2025-01-01T11:00:00Z',
        },
      ];

      vi.mocked(commentsAPI.getByCard).mockResolvedValue(comments);

      const wrapper = createWrapper();
      render(<CardComments cardId={1} />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText('(2)')).toBeInTheDocument();
      });
    });
  });
});

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { Label } from '../components/label/Label';
import { LabelManager } from '../components/label/LabelManager';
import { CreateLabelModal } from '../components/label/CreateLabelModal';
import { EditLabelModal } from '../components/label/EditLabelModal';
import { AttachLabelModal } from '../components/label/AttachLabelModal';
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

const mockLabel = {
  id: 1,
  name: 'Bug',
  color: '#eb5a46',
};

const mockLabels = [
  { id: 1, name: 'Bug', color: '#eb5a46', boardId: 1, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 2, name: 'Feature', color: '#61bd4f', boardId: 1, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 3, name: 'Enhancement', color: '#0079bf', boardId: 1, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
];

describe('Label Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Test Label component rendering
   * Requirements: 10.4, 10.5
   */
  describe('Label Component', () => {
    it('should render label with correct name and color', () => {
      render(<Label label={mockLabel} />);
      
      const labelElement = screen.getByText('Bug');
      expect(labelElement).toBeInTheDocument();
      
      const labelContainer = labelElement.closest('.label');
      expect(labelContainer).toHaveStyle({ backgroundColor: '#eb5a46' });
    });

    it('should call onClick when label is clicked', () => {
      const handleClick = vi.fn();
      render(<Label label={mockLabel} onClick={handleClick} />);
      
      const labelElement = screen.getByText('Bug');
      fireEvent.click(labelElement);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should show remove button when removable is true', () => {
      const handleRemove = vi.fn();
      render(<Label label={mockLabel} removable onRemove={handleRemove} />);
      
      const removeButton = screen.getByLabelText('Remove Bug label');
      expect(removeButton).toBeInTheDocument();
    });

    it('should call onRemove when remove button is clicked', () => {
      const handleRemove = vi.fn();
      render(<Label label={mockLabel} removable onRemove={handleRemove} />);
      
      const removeButton = screen.getByLabelText('Remove Bug label');
      fireEvent.click(removeButton);
      
      expect(handleRemove).toHaveBeenCalledTimes(1);
    });

    it('should not show remove button when removable is false', () => {
      render(<Label label={mockLabel} removable={false} />);
      
      const removeButton = screen.queryByLabelText('Remove Bug label');
      expect(removeButton).not.toBeInTheDocument();
    });
  });

  /**
   * Test CreateLabelModal
   * Requirements: 10.1
   */
  describe('CreateLabelModal', () => {
    it('should render modal when open', () => {
      render(
        <CreateLabelModal isOpen={true} onClose={vi.fn()} boardId={1} />,
        { wrapper: createWrapper() }
      );
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter label name')).toBeInTheDocument();
    });

    it('should not render modal when closed', () => {
      render(
        <CreateLabelModal isOpen={false} onClose={vi.fn()} boardId={1} />,
        { wrapper: createWrapper() }
      );
      
      expect(screen.queryByText('Create Label')).not.toBeInTheDocument();
    });

    it('should disable submit button when name is empty', () => {
      render(
        <CreateLabelModal isOpen={true} onClose={vi.fn()} boardId={1} />,
        { wrapper: createWrapper() }
      );
      
      const submitButton = screen.getByRole('button', { name: /create label/i });
      expect(submitButton).toBeDisabled();
    });

    it('should create label with valid data', async () => {
      const mockCreatedLabel = {
        id: 1,
        name: 'New Label',
        color: '#61bd4f',
        boardId: 1,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };
      
      vi.mocked(labelsAPI.create).mockResolvedValue(mockCreatedLabel);
      
      const handleClose = vi.fn();
      render(
        <CreateLabelModal isOpen={true} onClose={handleClose} boardId={1} />,
        { wrapper: createWrapper() }
      );
      
      const nameInput = screen.getByPlaceholderText('Enter label name');
      fireEvent.change(nameInput, { target: { value: 'New Label' } });
      
      const submitButton = screen.getByRole('button', { name: /create label/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(labelsAPI.create).toHaveBeenCalledWith(1, {
          name: 'New Label',
          color: '#61bd4f',
        });
      });
    });

    it('should allow selecting different colors', () => {
      render(
        <CreateLabelModal isOpen={true} onClose={vi.fn()} boardId={1} />,
        { wrapper: createWrapper() }
      );
      
      const colorButtons = screen.getAllByRole('button').filter(btn => 
        btn.getAttribute('aria-label')?.includes('Select')
      );
      
      expect(colorButtons.length).toBeGreaterThan(0);
      
      // Click on a color button
      fireEvent.click(colorButtons[1]);
      
      // Verify the color is selected (has check mark)
      expect(colorButtons[1]).toHaveTextContent('✓');
    });
  });

  /**
   * Test EditLabelModal
   * Requirements: 10.2, 10.3
   */
  describe('EditLabelModal', () => {
    const fullMockLabel = {
      id: 1,
      name: 'Bug',
      color: '#eb5a46',
      boardId: 1,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    };

    it('should render modal with existing label data', () => {
      render(
        <EditLabelModal isOpen={true} onClose={vi.fn()} label={fullMockLabel} />,
        { wrapper: createWrapper() }
      );
      
      expect(screen.getByText('Edit Label')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Bug')).toBeInTheDocument();
    });

    it('should update label with new data', async () => {
      const mockUpdatedLabel = {
        ...fullMockLabel,
        name: 'Updated Bug',
      };
      
      vi.mocked(labelsAPI.update).mockResolvedValue(mockUpdatedLabel);
      
      render(
        <EditLabelModal isOpen={true} onClose={vi.fn()} label={fullMockLabel} />,
        { wrapper: createWrapper() }
      );
      
      const nameInput = screen.getByDisplayValue('Bug');
      fireEvent.change(nameInput, { target: { value: 'Updated Bug' } });
      
      const saveButton = screen.getByText('Save Changes');
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(labelsAPI.update).toHaveBeenCalledWith(1, {
          name: 'Updated Bug',
          color: '#eb5a46',
        });
      });
    });

    it('should show delete confirmation dialog', async () => {
      render(
        <EditLabelModal isOpen={true} onClose={vi.fn()} label={fullMockLabel} />,
        { wrapper: createWrapper() }
      );
      
      const deleteButton = screen.getByText('Delete');
      fireEvent.click(deleteButton);
      
      await waitFor(() => {
        expect(screen.getByText('Delete Label')).toBeInTheDocument();
        expect(screen.getByText(/Are you sure you want to delete "Bug"/)).toBeInTheDocument();
      });
    });

    it('should delete label when confirmed', async () => {
      vi.mocked(labelsAPI.delete).mockResolvedValue(undefined);
      
      render(
        <EditLabelModal isOpen={true} onClose={vi.fn()} label={fullMockLabel} />,
        { wrapper: createWrapper() }
      );
      
      const deleteButton = screen.getByText('Delete');
      fireEvent.click(deleteButton);
      
      await waitFor(() => {
        expect(screen.getByText('Delete Label')).toBeInTheDocument();
      });
      
      const confirmButton = screen.getAllByText('Delete')[1]; // Second Delete button in confirm dialog
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(labelsAPI.delete).toHaveBeenCalled();
        const callArgs = vi.mocked(labelsAPI.delete).mock.calls[0];
        expect(callArgs[0]).toBe(1);
      });
    });
  });

  /**
   * Test AttachLabelModal
   * Requirements: 10.4, 10.5
   */
  describe('AttachLabelModal', () => {
    it('should render modal with available labels', async () => {
      vi.mocked(labelsAPI.getByBoard).mockResolvedValue(mockLabels);
      
      render(
        <AttachLabelModal
          isOpen={true}
          onClose={vi.fn()}
          cardId={1}
          boardId={1}
          attachedLabels={[]}
        />,
        { wrapper: createWrapper() }
      );
      
      await waitFor(() => {
        expect(screen.getByText('Bug')).toBeInTheDocument();
        expect(screen.getByText('Feature')).toBeInTheDocument();
        expect(screen.getByText('Enhancement')).toBeInTheDocument();
      });
    });

    it('should show attached labels with check mark', async () => {
      vi.mocked(labelsAPI.getByBoard).mockResolvedValue(mockLabels);
      
      render(
        <AttachLabelModal
          isOpen={true}
          onClose={vi.fn()}
          cardId={1}
          boardId={1}
          attachedLabels={[mockLabels[0]]}
        />,
        { wrapper: createWrapper() }
      );
      
      await waitFor(() => {
        const attachedButton = screen.getByText('Bug').closest('button');
        expect(attachedButton).toHaveClass('attach-label-modal__button--attached');
      });
    });

    it('should attach label when clicked', async () => {
      vi.mocked(labelsAPI.getByBoard).mockResolvedValue(mockLabels);
      vi.mocked(labelsAPI.attachToCard).mockResolvedValue(undefined);
      
      render(
        <AttachLabelModal
          isOpen={true}
          onClose={vi.fn()}
          cardId={1}
          boardId={1}
          attachedLabels={[]}
        />,
        { wrapper: createWrapper() }
      );
      
      await waitFor(() => {
        expect(screen.getByText('Bug')).toBeInTheDocument();
      });
      
      const labelButton = screen.getByText('Bug').closest('button');
      if (labelButton) {
        fireEvent.click(labelButton);
      }
      
      await waitFor(() => {
        expect(labelsAPI.attachToCard).toHaveBeenCalledWith(1, 1);
      });
    });

    it('should detach label when clicked on attached label', async () => {
      vi.mocked(labelsAPI.getByBoard).mockResolvedValue(mockLabels);
      vi.mocked(labelsAPI.detachFromCard).mockResolvedValue(undefined);
      
      render(
        <AttachLabelModal
          isOpen={true}
          onClose={vi.fn()}
          cardId={1}
          boardId={1}
          attachedLabels={[mockLabels[0]]}
        />,
        { wrapper: createWrapper() }
      );
      
      await waitFor(() => {
        expect(screen.getByText('Bug')).toBeInTheDocument();
      });
      
      const labelButton = screen.getByText('Bug').closest('button');
      if (labelButton) {
        fireEvent.click(labelButton);
      }
      
      await waitFor(() => {
        expect(labelsAPI.detachFromCard).toHaveBeenCalledWith(1, 1);
      });
    });

    it('should show empty state when no labels exist', async () => {
      vi.mocked(labelsAPI.getByBoard).mockResolvedValue([]);
      
      render(
        <AttachLabelModal
          isOpen={true}
          onClose={vi.fn()}
          cardId={1}
          boardId={1}
          attachedLabels={[]}
        />,
        { wrapper: createWrapper() }
      );
      
      await waitFor(() => {
        expect(screen.getByText(/No labels available/)).toBeInTheDocument();
      });
    });
  });

  /**
   * Test LabelManager
   * Requirements: 10.1, 10.2, 10.3
   */
  describe('LabelManager', () => {
    it('should render labels list', async () => {
      vi.mocked(labelsAPI.getByBoard).mockResolvedValue(mockLabels);
      
      render(<LabelManager boardId={1} />, { wrapper: createWrapper() });
      
      await waitFor(() => {
        expect(screen.getByText('Bug')).toBeInTheDocument();
        expect(screen.getByText('Feature')).toBeInTheDocument();
        expect(screen.getByText('Enhancement')).toBeInTheDocument();
      });
    });

    it('should show create button', async () => {
      vi.mocked(labelsAPI.getByBoard).mockResolvedValue(mockLabels);
      
      render(<LabelManager boardId={1} />, { wrapper: createWrapper() });
      
      await waitFor(() => {
        expect(screen.getByText('Create Label')).toBeInTheDocument();
      });
    });

    it('should open create modal when create button is clicked', async () => {
      vi.mocked(labelsAPI.getByBoard).mockResolvedValue(mockLabels);
      
      render(<LabelManager boardId={1} />, { wrapper: createWrapper() });
      
      await waitFor(() => {
        expect(screen.getByText('Create Label')).toBeInTheDocument();
      });
      
      const createButton = screen.getByText('Create Label');
      fireEvent.click(createButton);
      
      await waitFor(() => {
        // Modal should open with title
        const modalTitles = screen.getAllByText('Create Label');
        expect(modalTitles.length).toBeGreaterThan(1);
      });
    });

    it('should show empty state when no labels exist', async () => {
      vi.mocked(labelsAPI.getByBoard).mockResolvedValue([]);
      
      render(<LabelManager boardId={1} />, { wrapper: createWrapper() });
      
      await waitFor(() => {
        expect(screen.getByText(/No labels yet/)).toBeInTheDocument();
      });
    });

    it('should show loading state', () => {
      vi.mocked(labelsAPI.getByBoard).mockImplementation(() => new Promise(() => {}));
      
      render(<LabelManager boardId={1} />, { wrapper: createWrapper() });
      
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });
});

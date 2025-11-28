import React, { useState } from 'react';
import { useCreateBoard } from '../../hooks/useBoards';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import './CreateBoardModal.css';

export interface CreateBoardModalProps {
  workspaceId: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

/**
 * CreateBoardModal Component
 * Modal for creating a new board
 * Implements Requirement 4.1: Board creation succeeds for workspace members
 */
export const CreateBoardModal: React.FC<CreateBoardModalProps> = ({
  workspaceId,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<{ name?: string }>({});

  const createBoard = useCreateBoard(workspaceId);

  const validateForm = (): boolean => {
    const newErrors: { name?: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Board name is required';
    } else if (name.trim().length > 100) {
      newErrors.name = 'Board name must be less than 100 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await createBoard.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined
      });

      // Reset form
      setName('');
      setDescription('');
      setErrors({});

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const handleClose = () => {
    if (!createBoard.isPending) {
      setName('');
      setDescription('');
      setErrors({});
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create Board"
      size="md"
    >
      <form onSubmit={handleSubmit} className="create-board-modal__form">
        <Input
          label="Board Name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          placeholder="Enter board name"
          required
          autoFocus
        />

        <Input
          label="Description (optional)"
          type="textarea"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter board description"
          rows={3}
        />

        <div className="create-board-modal__actions">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={createBoard.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={createBoard.isPending}
          >
            Create Board
          </Button>
        </div>
      </form>
    </Modal>
  );
};

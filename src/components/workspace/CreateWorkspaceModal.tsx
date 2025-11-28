import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { useCreateWorkspace } from '../../hooks/useWorkspaces';
import './CreateWorkspaceModal.css';

export interface CreateWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

/**
 * CreateWorkspaceModal Component
 * Modal for creating a new workspace
 * Implements Requirement 2.2: Workspace creation assigns OWNER role
 */
export const CreateWorkspaceModal: React.FC<CreateWorkspaceModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<{ name?: string; description?: string }>({});

  const createWorkspace = useCreateWorkspace();

  const validateForm = (): boolean => {
    const newErrors: { name?: string; description?: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Workspace name is required';
    } else if (name.length > 100) {
      newErrors.name = 'Workspace name must be less than 100 characters';
    }

    if (description && description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
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
      await createWorkspace.mutateAsync({
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
      // Error is handled by the mutation hook
    }
  };

  const handleClose = () => {
    if (!createWorkspace.isPending) {
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
      title="Create Workspace"
      size="md"
      footer={
        <>
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={createWorkspace.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            loading={createWorkspace.isPending}
          >
            Create Workspace
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="create-workspace-form">
        <Input
          label="Workspace Name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          placeholder="Enter workspace name"
          autoFocus
          required
        />

        <Input
          label="Description (Optional)"
          type="textarea"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          error={errors.description}
          placeholder="Enter workspace description"
          rows={4}
        />
      </form>
    </Modal>
  );
};

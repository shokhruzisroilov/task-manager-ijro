import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Workspace, WorkspaceRole } from '../../types/models';
import { useUpdateWorkspace, useDeleteWorkspace } from '../../hooks/useWorkspaces';
import { useAuthStore } from '../../store/auth.store';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { WorkspaceMemberManager } from './WorkspaceMemberManager';
import './WorkspaceSettings.css';

export interface WorkspaceSettingsProps {
  workspace: Workspace;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * WorkspaceSettings Component
 * Modal for managing workspace settings
 * Implements Requirements 2.3, 2.4
 */
export const WorkspaceSettings: React.FC<WorkspaceSettingsProps> = ({
  workspace,
  isOpen,
  onClose
}) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'general' | 'members'>('general');
  const [name, setName] = useState(workspace.name);
  const [description, setDescription] = useState(workspace.description || '');
  const [errors, setErrors] = useState<{ name?: string; description?: string }>({});
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const updateWorkspace = useUpdateWorkspace();
  const deleteWorkspace = useDeleteWorkspace();

  // Get current user's role
  const currentUserMember = workspace.members.find(m => m.userId === user?.id);
  const userRole = currentUserMember?.role;
  const canEdit = userRole === WorkspaceRole.OWNER || userRole === WorkspaceRole.ADMIN;
  const canDelete = userRole === WorkspaceRole.OWNER;

  useEffect(() => {
    setName(workspace.name);
    setDescription(workspace.description || '');
  }, [workspace]);

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

  const handleSave = async () => {
    if (!validateForm() || !canEdit) {
      return;
    }

    try {
      await updateWorkspace.mutateAsync({
        id: workspace.id,
        data: {
          name: name.trim(),
          description: description.trim() || undefined
        }
      });
    } catch (error) {
      // Error is handled by the mutation hook
    }
  };

  const handleDelete = async () => {
    try {
      await deleteWorkspace.mutateAsync(workspace.id);
      setIsDeleteDialogOpen(false);
      onClose();
      navigate('/workspaces');
    } catch (error) {
      // Error is handled by the mutation hook
    }
  };

  const handleClose = () => {
    if (!updateWorkspace.isPending && !deleteWorkspace.isPending) {
      setName(workspace.name);
      setDescription(workspace.description || '');
      setErrors({});
      setActiveTab('general');
      onClose();
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="Workspace Settings"
        size="lg"
      >
        <div className="workspace-settings">
          <div className="workspace-settings__tabs">
            <button
              className={`workspace-settings__tab ${activeTab === 'general' ? 'workspace-settings__tab--active' : ''}`}
              onClick={() => setActiveTab('general')}
            >
              General
            </button>
            <button
              className={`workspace-settings__tab ${activeTab === 'members' ? 'workspace-settings__tab--active' : ''}`}
              onClick={() => setActiveTab('members')}
            >
              Members
            </button>
          </div>

          <div className="workspace-settings__content">
            {activeTab === 'general' && (
              <div className="workspace-settings__general">
                <Input
                  label="Workspace Name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  error={errors.name}
                  placeholder="Enter workspace name"
                  disabled={!canEdit}
                />

                <Input
                  label="Description (Optional)"
                  type="textarea"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  error={errors.description}
                  placeholder="Enter workspace description"
                  rows={4}
                  disabled={!canEdit}
                />

                {canEdit && (
                  <div className="workspace-settings__actions">
                    <Button
                      variant="primary"
                      onClick={handleSave}
                      loading={updateWorkspace.isPending}
                    >
                      Save Changes
                    </Button>
                  </div>
                )}

                {canDelete && (
                  <div className="workspace-settings__danger-zone">
                    <h3>Danger Zone</h3>
                    <p>
                      Deleting this workspace will permanently remove all boards, columns, cards, and associated data.
                      This action cannot be undone.
                    </p>
                    <Button
                      variant="danger"
                      onClick={() => setIsDeleteDialogOpen(true)}
                    >
                      Delete Workspace
                    </Button>
                  </div>
                )}

                {!canEdit && (
                  <p className="workspace-settings__no-permission">
                    You don't have permission to edit this workspace.
                  </p>
                )}
              </div>
            )}

            {activeTab === 'members' && (
              <WorkspaceMemberManager
                workspaceId={workspace.id}
                members={workspace.members}
                currentUserRole={userRole}
              />
            )}
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        title="Delete Workspace"
        message={`Are you sure you want to delete "${workspace.name}"? This action cannot be undone and will remove all boards, columns, and cards.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmVariant="danger"
        onConfirm={handleDelete}
        onCancel={() => setIsDeleteDialogOpen(false)}
        loading={deleteWorkspace.isPending}
      />
    </>
  );
};

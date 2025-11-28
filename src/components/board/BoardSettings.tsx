import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Board } from '../../types/models';
import { useUpdateBoard, useArchiveBoard, useDeleteBoard } from '../../hooks/useBoards';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { BoardMemberManager } from './BoardMemberManager';
import { LabelManager } from '../label/LabelManager';
import './BoardSettings.css';

export interface BoardSettingsProps {
  board: Board;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * BoardSettings Component
 * Modal for managing board settings
 * Implements Requirements 4.3, 4.4, 4.5
 */
export const BoardSettings: React.FC<BoardSettingsProps> = ({
  board,
  isOpen,
  onClose
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'details' | 'members' | 'labels'>('details');
  const [name, setName] = useState(board.name);
  const [description, setDescription] = useState(board.description || '');
  const [errors, setErrors] = useState<{ name?: string }>({});
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const updateBoard = useUpdateBoard();
  const archiveBoard = useArchiveBoard();
  const deleteBoard = useDeleteBoard();

  // Reset form when board changes
  React.useEffect(() => {
    setName(board.name);
    setDescription(board.description || '');
    setErrors({});
  }, [board]);

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
      await updateBoard.mutateAsync({
        id: board.id,
        data: {
          name: name.trim(),
          description: description.trim() || undefined
        }
      });
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const handleArchive = async () => {
    try {
      await archiveBoard.mutateAsync({
        id: board.id,
        archived: !board.archived
      });
      setShowArchiveConfirm(false);
      onClose();
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const handleDelete = async () => {
    try {
      await deleteBoard.mutateAsync(board.id);
      setShowDeleteConfirm(false);
      onClose();
      navigate(`/workspaces/${board.workspaceId}`);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const handleClose = () => {
    if (!updateBoard.isPending && !archiveBoard.isPending && !deleteBoard.isPending) {
      setActiveTab('details');
      setName(board.name);
      setDescription(board.description || '');
      setErrors({});
      onClose();
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="Board Settings"
        size="lg"
      >
        <div className="board-settings">
          <div className="board-settings__tabs">
            <button
              className={`board-settings__tab ${
                activeTab === 'details' ? 'board-settings__tab--active' : ''
              }`}
              onClick={() => setActiveTab('details')}
            >
              Details
            </button>
            <button
              className={`board-settings__tab ${
                activeTab === 'members' ? 'board-settings__tab--active' : ''
              }`}
              onClick={() => setActiveTab('members')}
            >
              Members
            </button>
            <button
              className={`board-settings__tab ${
                activeTab === 'labels' ? 'board-settings__tab--active' : ''
              }`}
              onClick={() => setActiveTab('labels')}
            >
              Labels
            </button>
          </div>

          <div className="board-settings__content">
            {activeTab === 'details' && (
              <form onSubmit={handleSubmit} className="board-settings__form">
                <Input
                  label="Board Name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  error={errors.name}
                  placeholder="Enter board name"
                  required
                />

                <Input
                  label="Description (optional)"
                  type="textarea"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter board description"
                  rows={3}
                />

                <div className="board-settings__actions">
                  <Button
                    type="submit"
                    loading={updateBoard.isPending}
                  >
                    Save Changes
                  </Button>
                </div>

                <div className="board-settings__danger-zone">
                  <h3 className="board-settings__danger-title">Danger Zone</h3>
                  
                  <div className="board-settings__danger-action">
                    <div>
                      <h4>{board.archived ? 'Unarchive Board' : 'Archive Board'}</h4>
                      <p>
                        {board.archived
                          ? 'Restore this board to active boards list'
                          : 'Hide this board from active boards list'}
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      onClick={() => setShowArchiveConfirm(true)}
                    >
                      {board.archived ? 'Unarchive' : 'Archive'}
                    </Button>
                  </div>

                  <div className="board-settings__danger-action">
                    <div>
                      <h4>Delete Board</h4>
                      <p>Permanently delete this board and all its data</p>
                    </div>
                    <Button
                      variant="danger"
                      onClick={() => setShowDeleteConfirm(true)}
                    >
                      Delete Board
                    </Button>
                  </div>
                </div>
              </form>
            )}

            {activeTab === 'members' && (
              <BoardMemberManager boardId={board.id} />
            )}

            {activeTab === 'labels' && (
              <LabelManager boardId={board.id} />
            )}
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={showArchiveConfirm}
        title={board.archived ? 'Unarchive Board' : 'Archive Board'}
        message={
          board.archived
            ? 'Are you sure you want to unarchive this board? It will be visible in the active boards list.'
            : 'Are you sure you want to archive this board? It will be hidden from the active boards list.'
        }
        confirmText={board.archived ? 'Unarchive' : 'Archive'}
        onConfirm={handleArchive}
        onCancel={() => setShowArchiveConfirm(false)}
        loading={archiveBoard.isPending}
      />

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Board"
        message="Are you sure you want to delete this board? This action cannot be undone and will delete all columns, cards, and associated data."
        confirmText="Delete Board"
        confirmVariant="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        loading={deleteBoard.isPending}
      />
    </>
  );
};

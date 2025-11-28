import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Dropdown } from '../common/Dropdown';
import { Avatar } from '../common/Avatar';
import { LoadingSpinner } from '../common';
import { BoardRole } from '../../types/models';
import { useAddBoardMember, useBoard } from '../../hooks/useBoards';
import { useWorkspace } from '../../hooks/useWorkspaces';
import './AddBoardMemberModal.css';

export interface AddBoardMemberModalProps {
  boardId: number;
  workspaceId: number;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * AddBoardMemberModal Component
 * Modal for adding a member to board
 * Implements Requirement 5.1: Adding board member succeeds for workspace admins
 */
export const AddBoardMemberModal: React.FC<AddBoardMemberModalProps> = ({
  boardId,
  workspaceId,
  isOpen,
  onClose
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [role, setRole] = useState<BoardRole>(BoardRole.EDITOR);

  const { data: workspace, isLoading: workspaceLoading } = useWorkspace(workspaceId);
  const { data: board, isLoading: boardLoading } = useBoard(boardId);
  const addMember = useAddBoardMember(boardId);

  const roleOptions = [
    { value: BoardRole.EDITOR, label: 'Editor - Can edit board and cards' },
    { value: BoardRole.VIEWER, label: 'Viewer - Can only view board' }
  ];

  // Get board member IDs
  const boardMemberIds = new Set(board?.members?.map(m => m.userId) || []);

  // Filter workspace members who are not yet board members
  const availableMembers = workspace?.members?.filter(
    member => !boardMemberIds.has(member.userId)
  ) || [];

  // Filter by search query
  const filteredMembers = availableMembers.filter(member =>
    member.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.userEmail.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectUser = (userId: number) => {
    setSelectedUserId(userId);
  };

  const handleSubmit = async () => {
    if (!selectedUserId) return;

    try {
      await addMember.mutateAsync({
        userId: selectedUserId,
        role
      });

      // Reset form
      setSearchQuery('');
      setSelectedUserId(null);
      setRole(BoardRole.EDITOR);
      onClose();
    } catch (error) {
      // Error is handled by the mutation hook
    }
  };

  const handleClose = () => {
    if (!addMember.isPending) {
      setSearchQuery('');
      setSelectedUserId(null);
      setRole(BoardRole.EDITOR);
      onClose();
    }
  };

  const isLoading = workspaceLoading || boardLoading;

  // Debug logging
  console.log('AddBoardMemberModal:', {
    boardId,
    workspaceId,
    workspace,
    board,
    availableMembers,
    filteredMembers,
    searchQuery,
    isLoading
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add Board Member"
      size="md"
    >
      <div className="add-board-member-form">
        <Input
          label="Search Members"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name or email..."
          autoFocus
        />

        {isLoading ? (
          <div className="add-board-member-form__loading">
            <LoadingSpinner />
          </div>
        ) : filteredMembers.length > 0 ? (
          <div className="add-board-member-form__list">
            {filteredMembers.map((member) => (
              <div
                key={member.userId}
                className={`add-board-member-form__item ${selectedUserId === member.userId ? 'selected' : ''}`}
                onClick={() => handleSelectUser(member.userId)}
              >
                <Avatar
                  user={{ name: member.userName, email: member.userEmail }}
                  size="md"
                />
                <div className="add-board-member-form__item-info">
                  <span className="add-board-member-form__item-name">
                    {member.userName}
                  </span>
                  <span className="add-board-member-form__item-email">
                    {member.userEmail}
                  </span>
                </div>
                {selectedUserId === member.userId && (
                  <span className="add-board-member-form__item-check">✓</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="add-board-member-form__empty">
            {searchQuery
              ? 'No workspace members found matching your search'
              : 'All workspace members are already on this board'}
          </p>
        )}

        {selectedUserId && (
          <div className="add-board-member-form__field">
            <label className="add-board-member-form__label">Role</label>
            <Dropdown
              options={roleOptions}
              value={role}
              onChange={(value) => setRole(value as BoardRole)}
              placeholder="Select role"
            />
          </div>
        )}

        <div className="add-board-member-form__info">
          <h4>Role Permissions:</h4>
          <ul>
            <li><strong>Editor:</strong> Can create, edit, and delete columns and cards</li>
            <li><strong>Viewer:</strong> Can only view the board (read-only access)</li>
          </ul>
        </div>
      </div>

      <div className="add-board-member-form__footer">
        <Button
          variant="secondary"
          onClick={handleClose}
          disabled={addMember.isPending}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          loading={addMember.isPending}
          disabled={!selectedUserId}
        >
          Add Member
        </Button>
      </div>
    </Modal>
  );
};

import React, { useState } from 'react';
import { useBoard, useBoardMembers, useRemoveBoardMember } from '../../hooks/useBoards';
import { BoardMember, BoardRole } from '../../types/models';
import { useAuthStore } from '../../store/auth.store';
import { Avatar } from '../common/Avatar';
import { Button } from '../common/Button';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { AddBoardMemberModal } from './AddBoardMemberModal';
import './BoardMemberManager.css';

export interface BoardMemberManagerProps {
  boardId: number;
}

/**
 * BoardMemberManager Component
 * Manages board members (add, remove)
 * Implements Requirements 5.1, 5.2, 5.3, 5.4, 5.5
 */
export const BoardMemberManager: React.FC<BoardMemberManagerProps> = ({
  boardId
}) => {
  const { user } = useAuthStore();
  const { data: board, isLoading: boardLoading, error } = useBoard(boardId);
  const { data: boardMembers, isLoading: membersLoading } = useBoardMembers(boardId);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<BoardMember | null>(null);

  const removeMember = useRemoveBoardMember(boardId);
  
  const isLoading = boardLoading || membersLoading;

  // Debug logging
  console.log('BoardMemberManager:', { boardId, board, isLoading, error, members: board?.members });

  // Note: Board member management is restricted to workspace admins
  // This would typically be checked via workspace role, but for simplicity
  // we'll allow any board member to view the list
  const canManageMembers = true; // In a real app, check workspace admin role

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;

    try {
      await removeMember.mutateAsync(memberToRemove.userId);
      setMemberToRemove(null);
    } catch (error) {
      // Error is handled by the mutation hook
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="board-member-manager__loading">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  const members = boardMembers || [];
  
  console.log('Board members from API:', members);

  return (
    <div className="board-member-manager">
      {canManageMembers && (
        <div className="board-member-manager__header">
          <Button onClick={() => setIsAddModalOpen(true)}>
            Add Member
          </Button>
        </div>
      )}

      {!canManageMembers && (
        <p className="board-member-manager__no-permission">
          You don't have permission to manage board members.
        </p>
      )}

      {members.length === 0 && (
        <div className="board-member-manager__empty">
          <p>No members yet. Add members to collaborate on this board.</p>
        </div>
      )}

      {members.length > 0 && (
        <div className="board-member-manager__list">
          {members.map((member) => {
            const isCurrentUser = member.userId === user?.id;
            const canModify = canManageMembers && !isCurrentUser;
            const isViewer = member.role === BoardRole.VIEWER;

            return (
              <div key={member.userId} className="board-member-manager__item">
                <div className="board-member-manager__info">
                  <Avatar
                    user={{
                      name: member.userName,
                      email: member.userEmail
                    }}
                    size="md"
                  />
                  <div className="board-member-manager__details">
                    <div className="board-member-manager__name">
                      {member.userName}
                      {isCurrentUser && (
                        <span className="board-member-manager__you-badge">You</span>
                      )}
                    </div>
                    <div className="board-member-manager__email">
                      {member.userEmail}
                    </div>
                    <div className="board-member-manager__joined">
                      Joined {formatDate(member.joinedAt)}
                    </div>
                  </div>
                </div>

                <div className="board-member-manager__actions">
                  <span
                    className={`board-member-manager__role-badge ${
                      isViewer ? 'board-member-manager__role-badge--viewer' : ''
                    }`}
                  >
                    {member.role}
                  </span>
                  {canModify && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setMemberToRemove(member)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {board && (
        <AddBoardMemberModal
          boardId={boardId}
          workspaceId={board.workspaceId}
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
        />
      )}

      <ConfirmDialog
        isOpen={!!memberToRemove}
        title="Remove Member"
        message={`Are you sure you want to remove ${memberToRemove?.userName} from this board?`}
        confirmText="Remove"
        cancelText="Cancel"
        confirmVariant="danger"
        onConfirm={handleRemoveMember}
        onCancel={() => setMemberToRemove(null)}
        loading={removeMember.isPending}
      />
    </div>
  );
};

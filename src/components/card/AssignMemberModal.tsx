import React, { useState } from 'react';
import { Modal, Button, LoadingSpinner } from '../common';
import { Avatar } from '../common/Avatar';
import { useBoardMembers } from '../../hooks/useBoards';
import { useAssignCardMember } from '../../hooks/useCards';
import { CardMember } from '../../types/models';
import './AssignMemberModal.css';

interface AssignMemberModalProps {
  cardId: number;
  boardId: number;
  assignedMembers: CardMember[];
  onClose: () => void;
}

/**
 * AssignMemberModal component
 * Modal for assigning board members to a card
 * Requirements: 9.1, 9.4, 9.5
 */
export const AssignMemberModal: React.FC<AssignMemberModalProps> = ({
  cardId,
  boardId,
  assignedMembers,
  onClose
}) => {
  const { data: boardMembers, isLoading } = useBoardMembers(boardId);
  const assignMember = useAssignCardMember(cardId);
  const [searchQuery, setSearchQuery] = useState('');

  const assignedUserIds = new Set(assignedMembers.map(m => m.userId));

  const availableMembers = boardMembers?.filter(
    member => !assignedUserIds.has(member.userId)
  ) || [];

  const filteredMembers = availableMembers.filter(member =>
    member.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.userEmail.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAssign = async (userId: number) => {
    try {
      await assignMember.mutateAsync(userId);
      onClose();
    } catch (error) {
      // Error handled by hook
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Assign Member"
      className="assign-member-modal"
    >
      <div className="assign-member-modal__content">
        <input
          type="text"
          placeholder="Search members..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="assign-member-modal__search"
        />

        {isLoading ? (
          <div className="assign-member-modal__loading">
            <LoadingSpinner />
          </div>
        ) : filteredMembers.length > 0 ? (
          <div className="assign-member-modal__list">
            {filteredMembers.map((member) => (
              <div
                key={member.userId}
                className="assign-member-modal__item"
                onClick={() => handleAssign(member.userId)}
              >
                <Avatar
                  user={{ name: member.userName, email: member.userEmail }}
                  size="md"
                />
                <div className="assign-member-modal__item-info">
                  <span className="assign-member-modal__item-name">
                    {member.userName}
                  </span>
                  <span className="assign-member-modal__item-email">
                    {member.userEmail}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="assign-member-modal__empty">
            {searchQuery
              ? 'No members found matching your search'
              : 'All board members are already assigned to this card'}
          </p>
        )}
      </div>

      <div className="assign-member-modal__footer">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </Modal>
  );
};

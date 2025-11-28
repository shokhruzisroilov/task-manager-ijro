import React, { useState } from 'react';
import { CardMember } from '../../types/models';
import { Avatar } from '../common/Avatar';
import { Button } from '../common/Button';
import { useUnassignCardMember } from '../../hooks/useCards';
import { AssignMemberModal } from './AssignMemberModal';
import './CardMembers.css';

interface CardMembersProps {
  cardId: number;
  boardId: number;
  members: CardMember[];
}

/**
 * CardMembers component
 * Displays and manages card member assignments
 * Requirements: 9.1, 9.2, 9.3
 */
export const CardMembers: React.FC<CardMembersProps> = ({
  cardId,
  boardId,
  members
}) => {
  const [showAssignModal, setShowAssignModal] = useState(false);
  const unassignMember = useUnassignCardMember(cardId);

  const handleUnassign = async (userId: number) => {
    try {
      await unassignMember.mutateAsync(userId);
    } catch (error) {
      // Error handled by hook
    }
  };

  return (
    <div className="card-members-section">
      <div className="card-members-section__header">
        <h3 className="card-members-section__title">Members</h3>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowAssignModal(true)}
        >
          Assign
        </Button>
      </div>

      {members.length > 0 ? (
        <div className="card-members-section__list">
          {members.map((member) => (
            <div key={member.userId} className="card-member-item">
              <Avatar
                user={{ name: member.name, email: '' }}
                size="md"
              />
              <span className="card-member-item__name">{member.name}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleUnassign(member.userId)}
                className="card-member-item__remove"
                aria-label={`Remove ${member.name}`}
              >
                ✕
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <p className="card-members-section__empty">
          No members assigned to this card
        </p>
      )}

      {showAssignModal && (
        <AssignMemberModal
          cardId={cardId}
          boardId={boardId}
          assignedMembers={members}
          onClose={() => setShowAssignModal(false)}
        />
      )}
    </div>
  );
};

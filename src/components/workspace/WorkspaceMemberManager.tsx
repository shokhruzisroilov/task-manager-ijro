import React, { useState } from 'react';
import { WorkspaceMember, WorkspaceRole } from '../../types/models';
import {
  useRemoveWorkspaceMember,
  useUpdateWorkspaceMemberRole
} from '../../hooks/useWorkspaces';
import { useAuthStore } from '../../store/auth.store';
import { Avatar } from '../common/Avatar';
import { Button } from '../common/Button';
import { Dropdown } from '../common/Dropdown';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { AddMemberModal } from './AddMemberModal';
import './WorkspaceMemberManager.css';

export interface WorkspaceMemberManagerProps {
  workspaceId: number;
  members: WorkspaceMember[];
  currentUserRole?: WorkspaceRole;
}

/**
 * WorkspaceMemberManager Component
 * Manages workspace members (add, remove, update role)
 * Implements Requirements 3.1, 3.2, 3.3, 3.4
 */
export const WorkspaceMemberManager: React.FC<WorkspaceMemberManagerProps> = ({
  workspaceId,
  members,
  currentUserRole
}) => {
  const { user } = useAuthStore();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<WorkspaceMember | null>(null);

  const removeMember = useRemoveWorkspaceMember(workspaceId);
  const updateMemberRole = useUpdateWorkspaceMemberRole(workspaceId);

  const canManageMembers = currentUserRole === WorkspaceRole.OWNER || currentUserRole === WorkspaceRole.ADMIN;

  const roleOptions = [
    { value: WorkspaceRole.OWNER, label: 'Owner' },
    { value: WorkspaceRole.ADMIN, label: 'Admin' },
    { value: WorkspaceRole.MEMBER, label: 'Member' }
  ];

  const handleRoleChange = async (memberId: number, newRole: WorkspaceRole) => {
    try {
      await updateMemberRole.mutateAsync({
        memberId,
        data: { role: newRole }
      });
    } catch (error) {
      // Error is handled by the mutation hook
    }
  };

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

  return (
    <div className="workspace-member-manager">
      {canManageMembers && (
        <div className="workspace-member-manager__header">
          <Button onClick={() => setIsAddModalOpen(true)}>
            Add Member
          </Button>
        </div>
      )}

      {!canManageMembers && (
        <p className="workspace-member-manager__no-permission">
          You don't have permission to manage members.
        </p>
      )}

      <div className="workspace-member-manager__list">
        {members.map((member) => {
          const isCurrentUser = member.userId === user?.id;
          const canModify = canManageMembers && !isCurrentUser;

          return (
            <div key={member.userId} className="workspace-member-manager__item">
              <div className="workspace-member-manager__info">
                <Avatar
                  user={{
                    name: member.userName,
                    email: member.userEmail
                  }}
                  size="md"
                />
                <div className="workspace-member-manager__details">
                  <div className="workspace-member-manager__name">
                    {member.userName}
                    {isCurrentUser && (
                      <span className="workspace-member-manager__you-badge">You</span>
                    )}
                  </div>
                  <div className="workspace-member-manager__email">
                    {member.userEmail}
                  </div>
                  <div className="workspace-member-manager__joined">
                    Joined {formatDate(member.joinedAt)}
                  </div>
                </div>
              </div>

              <div className="workspace-member-manager__actions">
                {canModify ? (
                  <>
                    <Dropdown
                      options={roleOptions}
                      value={member.role}
                      onChange={(value) => handleRoleChange(member.userId, value as WorkspaceRole)}
                      placeholder="Select role"
                    />
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setMemberToRemove(member)}
                    >
                      Remove
                    </Button>
                  </>
                ) : (
                  <span className="workspace-member-manager__role-badge">
                    {member.role}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <AddMemberModal
        workspaceId={workspaceId}
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      <ConfirmDialog
        isOpen={!!memberToRemove}
        title="Remove Member"
        message={`Are you sure you want to remove ${memberToRemove?.userName} from this workspace?`}
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

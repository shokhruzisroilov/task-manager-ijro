import React, { useState, useMemo } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Dropdown } from '../common/Dropdown';
import { Avatar } from '../common/Avatar';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { WorkspaceRole } from '../../types/models';
import { useAddWorkspaceMember } from '../../hooks/useWorkspaces';
import { useSearchUsers } from '../../hooks/useUsers';
import './AddMemberModal.css';

export interface AddMemberModalProps {
  workspaceId: number;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * AddMemberModal Component
 * Modal for adding a member to workspace
 * Implements Requirement 3.1: Adding member succeeds for authorized users
 */
export const AddMemberModal: React.FC<AddMemberModalProps> = ({
  workspaceId,
  isOpen,
  onClose
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [role, setRole] = useState<WorkspaceRole>(WorkspaceRole.MEMBER);
  const [errors, setErrors] = useState<{ user?: string }>({});

  const { data: users, isLoading: isSearching } = useSearchUsers(searchQuery, isOpen);
  const addMember = useAddWorkspaceMember(workspaceId);

  // Filter users based on search query (frontend filtering for better UX)
  const filteredUsers = useMemo(() => {
    if (!users) return [];
    if (!searchQuery.trim()) return users;
    
    const query = searchQuery.toLowerCase();
    return users.filter(user => 
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query)
    );
  }, [users, searchQuery]);

  const selectedUser = filteredUsers.find(u => u.id === selectedUserId);

  const roleOptions = [
    { value: WorkspaceRole.OWNER, label: 'Owner' },
    { value: WorkspaceRole.ADMIN, label: 'Admin' },
    { value: WorkspaceRole.MEMBER, label: 'Member' }
  ];

  const validateForm = (): boolean => {
    const newErrors: { user?: string } = {};

    if (!selectedUserId) {
      newErrors.user = 'Please select a user';
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
      await addMember.mutateAsync({
        userId: selectedUserId!,
        role
      });

      // Reset form
      setSearchQuery('');
      setSelectedUserId(null);
      setRole(WorkspaceRole.MEMBER);
      setErrors({});
      onClose();
    } catch (error) {
      // Error is handled by the mutation hook
    }
  };

  const handleClose = () => {
    if (!addMember.isPending) {
      setSearchQuery('');
      setSelectedUserId(null);
      setRole(WorkspaceRole.MEMBER);
      setErrors({});
      onClose();
    }
  };

  const handleSelectUser = (userId: number) => {
    setSelectedUserId(userId);
    setErrors({});
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add Member"
      size="md"
      footer={
        <>
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
        </>
      }
    >
      <form onSubmit={handleSubmit} className="add-member-form">
        {/* Selected User Display */}
        {selectedUser && (
          <div className="add-member-form__selected-user">
            <Avatar user={{ name: selectedUser.name, email: selectedUser.email }} size="md" />
            <div className="add-member-form__selected-user-info">
              <span className="add-member-form__selected-user-name">{selectedUser.name}</span>
              <span className="add-member-form__selected-user-email">{selectedUser.email}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedUserId(null)}
              type="button"
            >
              ✕
            </Button>
          </div>
        )}

        {/* Search Input */}
        {!selectedUser && (
          <>
            <Input
              label="Search User"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              error={errors.user}
              placeholder="Search by name or email..."
              autoFocus
            />

            {/* User List */}
            <div className="add-member-form__user-list">
              {isSearching ? (
                <div className="add-member-form__loading">
                  <LoadingSpinner size="sm" />
                  <span>Searching users...</span>
                </div>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="add-member-form__user-item"
                    onClick={() => handleSelectUser(user.id)}
                  >
                    <Avatar user={{ name: user.name, email: user.email }} size="sm" />
                    <div className="add-member-form__user-item-info">
                      <span className="add-member-form__user-item-name">{user.name}</span>
                      <span className="add-member-form__user-item-email">{user.email}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="add-member-form__no-results">
                  {searchQuery ? 'No users found' : 'Start typing to search users'}
                </p>
              )}
            </div>
          </>
        )}

        {/* Role Selection */}
        <div className="add-member-form__field">
          <label className="add-member-form__label">Role</label>
          <Dropdown
            options={roleOptions}
            value={role}
            onChange={(value) => setRole(value as WorkspaceRole)}
            placeholder="Select role"
          />
        </div>
      </form>
    </Modal>
  );
};

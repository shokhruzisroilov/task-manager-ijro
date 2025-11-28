import React, { useState } from 'react';
import { Workspace } from '../../types/models';
import { WorkspaceSettings } from './WorkspaceSettings';
import { Avatar } from '../common/Avatar';
import './WorkspaceCard.css';

export interface WorkspaceCardProps {
  workspace: Workspace;
  onClick: () => void;
}

/**
 * WorkspaceCard Component
 * Displays a single workspace with actions
 * Implements Requirements 2.1, 2.3
 */
export const WorkspaceCard: React.FC<WorkspaceCardProps> = ({
  workspace,
  onClick
}) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleSettingsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSettingsOpen(true);
  };

  const handleCardClick = () => {
    onClick();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <>
      <div
        className="workspace-card"
        onClick={handleCardClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-label={`Open workspace ${workspace.name}`}
      >
        <div className="workspace-card__header">
          <h3 className="workspace-card__name">{workspace.name}</h3>
          <button
            className="workspace-card__settings-btn"
            onClick={handleSettingsClick}
            aria-label="Workspace settings"
          >
            ⚙️
          </button>
        </div>

        {workspace.description && (
          <p className="workspace-card__description">
            {workspace.description}
          </p>
        )}

        <div className="workspace-card__footer">
          <div className="workspace-card__members">
            <div className="workspace-card__avatars">
              {workspace.members.slice(0, 3).map((member) => (
                <Avatar
                  key={member.userId}
                  user={{ name: member.userName, email: member.userEmail }}
                  size="sm"
                />
              ))}
              {workspace.members.length > 3 && (
                <span className="workspace-card__more-members">
                  +{workspace.members.length - 3}
                </span>
              )}
            </div>
            <span className="workspace-card__member-count">
              {workspace.members.length} {workspace.members.length === 1 ? 'member' : 'members'}
            </span>
          </div>
        </div>
      </div>

      <WorkspaceSettings
        workspace={workspace}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
};

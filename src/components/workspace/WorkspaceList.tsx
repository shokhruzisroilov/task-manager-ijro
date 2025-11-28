import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspaces } from '../../hooks/useWorkspaces';
import { WorkspaceCard } from './WorkspaceCard';
import { CreateWorkspaceModal } from './CreateWorkspaceModal';
import { Button } from '../common/Button';
import { LoadingSpinner } from '../common/LoadingSpinner';
import './WorkspaceList.css';

/**
 * WorkspaceList Component
 * Displays all workspaces for the current user
 * Implements Requirement 2.1: Display all user workspaces
 */
export const WorkspaceList: React.FC = () => {
  const navigate = useNavigate();
  const { data: workspaces, isLoading, error } = useWorkspaces();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleWorkspaceClick = (workspaceId: number) => {
    navigate(`/workspaces/${workspaceId}`);
  };

  const handleCreateClick = () => {
    setIsCreateModalOpen(true);
  };

  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className="workspace-list__loading">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="workspace-list__error">
        <p>Failed to load workspaces. Please try again.</p>
      </div>
    );
  }

  return (
    <main className="workspace-list" role="main" aria-label="Workspaces">
      <header className="workspace-list__header">
        <h1 className="workspace-list__title">My Workspaces</h1>
        <Button onClick={handleCreateClick} aria-label="Create new workspace">
          Create Workspace
        </Button>
      </header>

      {workspaces && workspaces.length > 0 ? (
        <div className="workspace-list__grid" role="list" aria-label="Workspace list">
          {workspaces.map((workspace) => (
            <div key={workspace.id} role="listitem">
              <WorkspaceCard
                workspace={workspace}
                onClick={() => handleWorkspaceClick(workspace.id)}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="workspace-list__empty">
          <p>No workspaces yet. Create your first workspace to get started!</p>
          <Button onClick={handleCreateClick} aria-label="Create your first workspace">
            Create Your First Workspace
          </Button>
        </div>
      )}

      <CreateWorkspaceModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </main>
  );
};

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '../../components/layout';
import { BoardList } from '../../components/board';
import { useWorkspace } from '../../hooks';
import { LoadingSpinner } from '../../components/common';
import './WorkspaceBoardsPage.css';

/**
 * WorkspaceBoardsPage Component
 * Page for displaying boards within a workspace
 * Implements Requirements 4.1, 4.2
 */
export const WorkspaceBoardsPage: React.FC = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const { data: workspace, isLoading, error } = useWorkspace(Number(workspaceId));

  if (isLoading) {
    return (
      <MainLayout>
        <div className="workspace-boards-page__loading">
          <LoadingSpinner />
        </div>
      </MainLayout>
    );
  }

  if (error || !workspace) {
    return (
      <MainLayout>
        <div className="workspace-boards-page__error">
          <h2>Workspace not found</h2>
          <p>The workspace you're looking for doesn't exist or you don't have access to it.</p>
          <button onClick={() => navigate('/workspaces')}>Back to Workspaces</button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title={workspace.name}>
      <div className="workspace-boards-page">
        <BoardList workspaceId={Number(workspaceId)} />
      </div>
    </MainLayout>
  );
};

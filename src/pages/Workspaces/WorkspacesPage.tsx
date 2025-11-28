import React from 'react';
import { MainLayout } from '../../components/layout';
import { WorkspaceList } from '../../components/workspace';
import './WorkspacesPage.css';

/**
 * WorkspacesPage Component
 * Main page for displaying and managing workspaces
 * Implements Requirements 2.1, 2.2, 2.3, 2.4
 */
export const WorkspacesPage: React.FC = () => {
  return (
    <MainLayout title="Workspaces">
      <div className="workspaces-page">
        <WorkspaceList />
      </div>
    </MainLayout>
  );
};

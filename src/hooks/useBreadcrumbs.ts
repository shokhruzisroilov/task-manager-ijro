import { useMemo } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useWorkspace } from './useWorkspaces';
import { useBoard } from './useBoards';

export interface BreadcrumbItem {
  label: string;
  path?: string;
  icon?: string;
}

/**
 * Hook to generate breadcrumbs based on current route
 */
export function useBreadcrumbs(): BreadcrumbItem[] {
  const location = useLocation();
  const params = useParams<{ workspaceId?: string; boardId?: string; cardId?: string }>();
  
  const workspaceId = params.workspaceId ? Number(params.workspaceId) : 0;
  const boardId = params.boardId ? Number(params.boardId) : 0;
  
  const { data: workspace } = useWorkspace(workspaceId);
  const { data: board } = useBoard(boardId);

  return useMemo(() => {
    const breadcrumbs: BreadcrumbItem[] = [];

    // Home/Workspaces
    if (location.pathname !== '/workspaces') {
      breadcrumbs.push({
        label: 'Workspaces',
        path: '/workspaces',
        icon: '🏠'
      });
    }

    // Add workspace if we're in a workspace context
    if (workspace) {
      breadcrumbs.push({
        label: workspace.name,
        path: `/workspaces/${workspace.id}`,
        icon: '📁'
      });
    }

    // Add board if we're viewing a board
    if (board) {
      breadcrumbs.push({
        label: board.name,
        path: `/boards/${board.id}`,
        icon: '📋'
      });
    }

    // Add card if we're viewing a card
    if (params.cardId) {
      breadcrumbs.push({
        label: `Card #${params.cardId}`,
        icon: '🎴'
      });
    }

    return breadcrumbs;
  }, [location.pathname, workspace, board, params.cardId]);
}

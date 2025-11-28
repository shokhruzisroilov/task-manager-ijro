import React from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useWorkspace, useBoard } from '../../hooks';
import { cn } from '../../utils/cn';
import './Breadcrumbs.css';

export interface BreadcrumbItem {
  label: string;
  path?: string;
  icon?: string;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  className?: string;
}

/**
 * Breadcrumbs Component
 * Navigation breadcrumbs for hierarchical navigation
 * Automatically generates breadcrumbs based on current route
 */
export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, className }) => {
  const location = useLocation();
  const params = useParams<{ workspaceId?: string; boardId?: string; cardId?: string }>();
  
  const workspaceId = params.workspaceId ? Number(params.workspaceId) : 0;
  const boardId = params.boardId ? Number(params.boardId) : 0;
  
  const { data: workspace } = useWorkspace(workspaceId);
  const { data: board } = useBoard(boardId);

  // Generate breadcrumbs automatically if not provided
  const breadcrumbs = items || generateBreadcrumbs(location.pathname, params, workspace, board);

  if (breadcrumbs.length === 0) {
    return null;
  }

  return (
    <nav className={cn('breadcrumbs', className)} aria-label="Breadcrumb">
      <ol className="breadcrumbs__list">
        {breadcrumbs.map((item, index) => {
          const isLast = index === breadcrumbs.length - 1;

          return (
            <motion.li
              key={index}
              className="breadcrumbs__item"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              {!isLast && item.path ? (
                <Link to={item.path} className="breadcrumbs__link">
                  {item.icon && <span className="breadcrumbs__icon">{item.icon}</span>}
                  <span>{item.label}</span>
                </Link>
              ) : (
                <span className="breadcrumbs__current">
                  {item.icon && <span className="breadcrumbs__icon">{item.icon}</span>}
                  <span>{item.label}</span>
                </span>
              )}
              {!isLast && (
                <span className="breadcrumbs__separator" aria-hidden="true">
                  →
                </span>
              )}
            </motion.li>
          );
        })}
      </ol>
    </nav>
  );
};

/**
 * Generate breadcrumbs based on current path
 */
function generateBreadcrumbs(
  pathname: string,
  params: { workspaceId?: string; boardId?: string; cardId?: string },
  workspace?: { id: number; name: string } | null,
  board?: { id: number; name: string; workspaceId: number } | null
): BreadcrumbItem[] {
  const breadcrumbs: BreadcrumbItem[] = [];

  // Home/Workspaces
  if (pathname !== '/workspaces') {
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
}

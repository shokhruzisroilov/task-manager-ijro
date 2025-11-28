import React from 'react';
import { useIsMobile } from '../../hooks';
import './TopBar.css';

interface TopBarProps {
  title?: string;
  onMenuClick: () => void;
  actions?: React.ReactNode;
}

/**
 * TopBar Component
 * Responsive top navigation bar
 * Implements Requirements 14.1, 14.2, 14.3
 */
export const TopBar: React.FC<TopBarProps> = ({ title, onMenuClick, actions }) => {
  const isMobile = useIsMobile();

  return (
    <header className="topbar">
      {isMobile && (
        <button
          className="topbar__menu-button"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <span className="topbar__menu-icon">☰</span>
        </button>
      )}

      {title && <h1 className="topbar__title">{title}</h1>}

      {actions && <div className="topbar__actions">{actions}</div>}
    </header>
  );
};

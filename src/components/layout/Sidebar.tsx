import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/auth.store';
import { useIsMobile } from '../../hooks';
import { cn } from '../../utils/cn';
import './Sidebar.css';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const isMobile = useIsMobile();

  const handleLogout = () => {
    logout();
    if (isMobile) {
      onClose();
    }
  };

  const handleLinkClick = () => {
    if (isMobile) {
      onClose();
    }
  };

  return (
    <>
      <AnimatePresence>
        {isMobile && isOpen && (
          <motion.div
            className="sidebar__backdrop"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </AnimatePresence>

      <aside className={cn('sidebar', isOpen && 'sidebar--open')}>
        <div className="sidebar__header">
          <h2 className="sidebar__title">Trello Clone</h2>
          {isMobile && (
            <motion.button
              className="sidebar__close"
              onClick={onClose}
              aria-label="Close sidebar"
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
            >
              ✕
            </motion.button>
          )}
        </div>

        <nav className="sidebar__nav">
          <Link
            to="/workspaces"
            className={cn(
              'sidebar__link',
              location.pathname === '/workspaces' && 'sidebar__link--active'
            )}
            onClick={handleLinkClick}
          >
            <span className="sidebar__link-icon">📋</span>
            <span className="sidebar__link-text">Workspaces</span>
          </Link>
        </nav>

        <div className="sidebar__footer">
          {user && (
            <div className="sidebar__user">
              <motion.div
                className="sidebar__user-info"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="sidebar__user-name">{user.name}</div>
                <div className="sidebar__user-email">{user.email}</div>
              </motion.div>
              <motion.button
                className="sidebar__logout"
                onClick={handleLogout}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Logout
              </motion.button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

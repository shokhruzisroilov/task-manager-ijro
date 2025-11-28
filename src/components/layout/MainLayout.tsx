import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { Breadcrumbs, BreadcrumbItem } from './Breadcrumbs';
import { useIsMobile } from '../../hooks';
import './MainLayout.css';

interface MainLayoutProps {
  children: React.ReactNode;
  title?: string;
  actions?: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  showBreadcrumbs?: boolean;
}

/**
 * MainLayout Component
 * Main application layout with responsive sidebar and topbar
 * Implements Requirements 14.1, 14.2, 14.3
 */
export const MainLayout: React.FC<MainLayoutProps> = ({ 
  children, 
  title, 
  actions,
  breadcrumbs,
  showBreadcrumbs = true
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  const handleMenuClick = () => {
    setSidebarOpen(true);
  };

  const handleSidebarClose = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="main-layout">
      <Sidebar isOpen={sidebarOpen} onClose={handleSidebarClose} />
      
      <div className="main-layout__content">
        <TopBar title={title} onMenuClick={handleMenuClick} actions={actions} />
        
        <main className="main-layout__main">
          {showBreadcrumbs && <Breadcrumbs items={breadcrumbs} />}
          {children}
        </main>
      </div>
    </div>
  );
};

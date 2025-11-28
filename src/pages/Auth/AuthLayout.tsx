import React from 'react';
import './Auth.css';

interface AuthLayoutProps {
  children: React.ReactNode;
}

/**
 * AuthLayout Component
 * Wrapper layout for authentication pages
 * Provides consistent styling and structure
 */
export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="auth-layout">
      <div className="auth-layout__container">
        <div className="auth-layout__header">
          <h1 className="auth-layout__logo">Trello Clone</h1>
          <p className="auth-layout__tagline">Organize your work and life</p>
        </div>
        
        <div className="auth-layout__content">
          {children}
        </div>
        
        <div className="auth-layout__footer">
          <p>&copy; 2024 Trello Clone. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

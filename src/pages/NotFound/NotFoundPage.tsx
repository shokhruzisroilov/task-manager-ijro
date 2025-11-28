import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import './NotFoundPage.css';

/**
 * NotFoundPage Component
 * 404 error page
 */
export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  const handleGoHome = () => {
    if (isAuthenticated) {
      navigate('/workspaces');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="not-found-page">
      <div className="not-found-page__content">
        <h1 className="not-found-page__title">404</h1>
        <h2 className="not-found-page__subtitle">Page Not Found</h2>
        <p className="not-found-page__message">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <button 
          className="not-found-page__button"
          onClick={handleGoHome}
        >
          {isAuthenticated ? 'Go to Workspaces' : 'Go to Login'}
        </button>
      </div>
    </div>
  );
};

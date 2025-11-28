import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import { LoadingSpinner } from '../common';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * ProtectedRoute Component
 * Guards routes that require authentication
 * Implements Requirements 1.4, 15.4
 * 
 * This component:
 * - Checks if user is authenticated before rendering protected content
 * - Shows loading state while verifying authentication
 * - Redirects to login if not authenticated
 * - Preserves the intended destination for redirect after login
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, loadUser } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    // Load user on mount if not already loaded and not currently loading
    // This ensures we verify the token on protected route access
    if (!isAuthenticated && !isLoading) {
      loadUser();
    }
  }, [isAuthenticated, isLoading, loadUser]);

  // Show loading spinner while checking authentication
  // Requirement 1.4: Check authentication status before rendering
  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        backgroundColor: '#f7fafc'
      }}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Redirect to login if not authenticated
  // Requirement 15.4: Preserve the intended destination for redirect after login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Render protected content
  return <>{children}</>;
};

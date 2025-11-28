import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import { Button, Input } from '../../components/common';
import './Auth.css';

interface LoginFormProps {
  onSuccess?: () => void;
}

/**
 * LoginForm Component
 * Handles user login with email and password
 * Implements Requirements 1.3, 15.4
 */
export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, error, isLoading, clearError } = useAuthStore();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sessionExpiredMessage, setSessionExpiredMessage] = useState<string | null>(null);

  // Check if user was redirected due to session expiration
  // Requirement 15.4: Display message when session expires
  useEffect(() => {
    const redirectPath = sessionStorage.getItem('redirect_after_login');
    if (redirectPath) {
      setSessionExpiredMessage('Your session has expired. Please login again.');
    }
  }, []);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    // Clear global error
    if (error) {
      clearError();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await login(formData.email, formData.password);
      
      // Requirement 15.4: Redirect to preserved destination after login
      const redirectPath = sessionStorage.getItem('redirect_after_login');
      const locationState = location.state as { from?: { pathname: string } };
      
      if (onSuccess) {
        onSuccess();
      } else if (redirectPath) {
        // Clear the stored redirect path
        sessionStorage.removeItem('redirect_after_login');
        navigate(redirectPath, { replace: true });
      } else if (locationState?.from) {
        // Redirect to the page they tried to access
        navigate(locationState.from.pathname, { replace: true });
      } else {
        // Default redirect to workspaces
        navigate('/workspaces', { replace: true });
      }
    } catch (err) {
      // Error is handled by the store
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <h2 className="auth-form__title">Login</h2>
      
      {sessionExpiredMessage && (
        <div className="auth-form__info" role="alert">
          {sessionExpiredMessage}
        </div>
      )}
      
      {error && (
        <div className="auth-form__error" role="alert">
          {error}
        </div>
      )}

      <Input
        label="Email"
        type="email"
        name="email"
        value={formData.email}
        onChange={handleChange}
        error={errors.email}
        placeholder="Enter your email"
        autoComplete="email"
        required
      />

      <Input
        label="Password"
        type="password"
        name="password"
        value={formData.password}
        onChange={handleChange}
        error={errors.password}
        placeholder="Enter your password"
        autoComplete="current-password"
        required
      />

      <Button
        type="submit"
        variant="primary"
        loading={isLoading}
        disabled={isLoading}
        fullWidth
      >
        {isLoading ? 'Logging in...' : 'Login'}
      </Button>

      <p className="auth-form__footer">
        Don't have an account?{' '}
        <a href="/register" className="auth-form__link">
          Register
        </a>
      </p>
    </form>
  );
};

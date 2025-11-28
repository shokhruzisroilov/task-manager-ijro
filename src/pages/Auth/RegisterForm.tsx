import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import { Button, Input } from '../../components/common';
import './Auth.css';

interface RegisterFormProps {
  onSuccess?: () => void;
}

/**
 * RegisterForm Component
 * Handles user registration with email, password, and name
 * Implements Requirements 1.1, 1.2
 */
export const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess }) => {
  const navigate = useNavigate();
  const { register, error, isLoading, clearError } = useAuthStore();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Name validation
    if (!formData.name || !formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
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
      await register(formData);
      
      if (onSuccess) {
        onSuccess();
      } else {
        // Navigate to email verification page
        navigate('/verify-email', { state: { email: formData.email } });
      }
    } catch (err) {
      // Error is handled by the store
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <h2 className="auth-form__title">Register</h2>
      
      {error && (
        <div className="auth-form__error" role="alert">
          {error}
        </div>
      )}

      <Input
        label="Name"
        type="text"
        name="name"
        value={formData.name}
        onChange={handleChange}
        error={errors.name}
        placeholder="Enter your name"
        autoComplete="name"
        required
      />

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
        placeholder="Enter your password (min 8 characters)"
        autoComplete="new-password"
        required
      />

      <Button
        type="submit"
        variant="primary"
        loading={isLoading}
        disabled={isLoading}
        fullWidth
      >
        {isLoading ? 'Creating account...' : 'Register'}
      </Button>

      <p className="auth-form__footer">
        Already have an account?{' '}
        <a href="/login" className="auth-form__link">
          Login
        </a>
      </p>
    </form>
  );
};

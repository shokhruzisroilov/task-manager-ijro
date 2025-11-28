import React from 'react';
import './FieldError.css';

export interface FieldErrorProps {
  error?: string;
  className?: string;
}

/**
 * FieldError component displays validation errors for form fields
 */
export const FieldError: React.FC<FieldErrorProps> = ({ error, className = '' }) => {
  if (!error) {
    return null;
  }

  return (
    <div className={`field-error ${className}`} role="alert">
      {error}
    </div>
  );
};

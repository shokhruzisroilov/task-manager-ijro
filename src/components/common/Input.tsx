import React, { forwardRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import './Input.css';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
  label?: string;
  error?: string;
  type?: 'text' | 'email' | 'password' | 'textarea';
  rows?: number;
  icon?: React.ReactNode;
  clearable?: boolean;
  onClear?: () => void;
}

export const Input = forwardRef<HTMLInputElement | HTMLTextAreaElement, InputProps>(({
  label,
  error,
  type = 'text',
  className,
  id,
  rows = 4,
  icon,
  clearable,
  onClear,
  value,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const hasError = !!error;
  const hasValue = value !== undefined && value !== '';

  const inputType = type === 'password' && showPassword ? 'text' : type;

  const renderInput = () => {
    const commonProps = {
      id: inputId,
      className: cn(
        'input__field',
        hasError && 'input__field--error',
        isFocused && 'input__field--focused',
        icon && 'input__field--with-icon'
      ),
      'aria-invalid': hasError,
      'aria-describedby': hasError ? `${inputId}-error` : undefined,
      onFocus: () => setIsFocused(true),
      onBlur: () => setIsFocused(false),
      value,
    };

    if (type === 'textarea') {
      return (
        <textarea
          ref={ref as React.Ref<HTMLTextAreaElement>}
          rows={rows}
          {...commonProps}
          {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
        />
      );
    }

    return (
      <input
        ref={ref as React.Ref<HTMLInputElement>}
        type={inputType}
        {...commonProps}
        {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
      />
    );
  };

  return (
    <div className={cn('input', className)}>
      {label && (
        <motion.label
          htmlFor={inputId}
          className="input__label"
          animate={{ color: hasError ? '#eb5a46' : isFocused ? '#0079bf' : '#172b4d' }}
        >
          {label}
        </motion.label>
      )}
      
      <div className="input__wrapper">
        {icon && <span className="input__icon">{icon}</span>}
        {renderInput()}
        
        {type === 'password' && (
          <button
            type="button"
            className="input__action"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? '👁️' : '👁️‍🗨️'}
          </button>
        )}
        
        {clearable && hasValue && (
          <button
            type="button"
            className="input__action"
            onClick={onClear}
            aria-label="Clear input"
          >
            ✕
          </button>
        )}
      </div>

      <AnimatePresence>
        {error && (
          <motion.span
            id={`${inputId}-error`}
            className="input__error"
            role="alert"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {error}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
});

Input.displayName = 'Input';

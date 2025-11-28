import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';
import './LoadingSpinner.css';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color,
  className
}) => {
  return (
    <motion.div
      className={cn('loading-spinner', `loading-spinner--${size}`, className)}
      role="status"
      aria-label="Loading"
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    >
      <svg
        className="loading-spinner__svg"
        viewBox="0 0 50 50"
        style={{ color: color || '#0079bf' }}
      >
        <circle
          className="loading-spinner__circle"
          cx="25"
          cy="25"
          r="20"
          fill="none"
          strokeWidth="4"
        />
      </svg>
      <span className="loading-spinner__sr-only">Loading...</span>
    </motion.div>
  );
};

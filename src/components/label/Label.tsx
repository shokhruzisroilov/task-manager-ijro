import React, { useMemo } from 'react';
import { LabelSummary } from '../../types';
import { getContrastingTextColor } from '../../utils/colorContrast';
import './Label.css';

export interface LabelProps {
  label: LabelSummary;
  onClick?: () => void;
  onRemove?: () => void;
  size?: 'sm' | 'md';
  removable?: boolean;
}

/**
 * Label component for displaying labels on cards
 * Implements Requirements 10.4, 10.5
 */
export const Label: React.FC<LabelProps> = ({
  label,
  onClick,
  onRemove,
  size = 'md',
  removable = false
}) => {
  // Calculate contrasting text color for accessibility
  const textColor = useMemo(() => getContrastingTextColor(label.color), [label.color]);

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove?.();
  };

  return (
    <div
      className={`label label--${size} ${onClick ? 'label--clickable' : ''}`}
      style={{ backgroundColor: label.color, color: textColor }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={`${label.name} label`}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <span className="label__name">{label.name}</span>
      {removable && onRemove && (
        <button
          className="label__remove"
          onClick={handleRemove}
          aria-label={`Remove ${label.name} label`}
          type="button"
        >
          ×
        </button>
      )}
    </div>
  );
};

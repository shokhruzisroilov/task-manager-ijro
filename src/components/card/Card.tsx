import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card as CardType } from '../../types/models';
import { Avatar } from '../common/Avatar';
import { useDraggableCard } from '../../hooks/useDragAndDrop';
import { cn } from '../../utils/cn';
import { formatDate } from '../../utils/formatDate';
import './Card.css';

interface CardProps {
  card: CardType;
  onClick: () => void;
  isFocused?: boolean;
  onFocus?: () => void;
}

export const Card: React.FC<CardProps> = React.memo(({ card, onClick, isFocused, onFocus }) => {
  const { isDragging, drag, preview } = useDraggableCard(card);
  const mouseDownPos = React.useRef<{ x: number; y: number } | null>(null);
  
  // Sort labels alphabetically by name
  const sortedLabels = React.useMemo(() => {
    if (!card.labels || card.labels.length === 0) return [];
    return [...card.labels].sort((a, b) => a.name.localeCompare(b.name));
  }, [card.labels]);
  
  const getDueDateStatus = useCallback(() => {
    if (!card.dueDate) return null;
    const date = new Date(card.dueDate);
    const now = new Date();
    const isOverdue = date < now && !card.archived;
    
    return {
      isOverdue,
      formatted: formatDate(card.dueDate, 'MMM d')
    };
  }, [card.dueDate, card.archived]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  }, [onClick]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    mouseDownPos.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (mouseDownPos.current) {
      const deltaX = Math.abs(e.clientX - mouseDownPos.current.x);
      const deltaY = Math.abs(e.clientY - mouseDownPos.current.y);
      
      if (deltaX < 5 && deltaY < 5 && !isDragging) {
        onClick();
      }
    }
    mouseDownPos.current = null;
  }, [onClick, isDragging]);

  const setRefs = useCallback((node: HTMLDivElement | null) => {
    drag(node);
    preview(node);
  }, [drag, preview]);

  const dueDateStatus = getDueDateStatus();

  return (
    <motion.div 
      ref={setRefs}
      className={cn(
        'card',
        isDragging && 'card--dragging',
        isFocused && 'card--focused'
      )}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onKeyDown={handleKeyDown}
      onFocus={onFocus}
      tabIndex={0}
      role="button"
      aria-label={`Card: ${card.title}`}
      data-card-id={card.id}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      {sortedLabels.length > 0 && (
        <div className="card-labels">
          {sortedLabels.map((label) => (
            <motion.span
              key={label.id}
              className="card-label"
              style={{ backgroundColor: label.color }}
              title={label.name}
              whileHover={{ scale: 1.05 }}
            >
              {label.name}
            </motion.span>
          ))}
        </div>
      )}

      <h4 className="card-title">{card.title}</h4>

      <div className="card-footer">
        {dueDateStatus && (
          <div className={cn('card-due-date', dueDateStatus.isOverdue && 'overdue')}>
            <span className="icon">📅</span>
            <span>{dueDateStatus.formatted}</span>
          </div>
        )}

        <div className="card-badges">
          {card.description && (
            <span className="card-badge" title="Has description">
              📝
            </span>
          )}
          {card.comments && card.comments.length > 0 && (
            <span className="card-badge" title={`${card.comments.length} comments`}>
              💬 {card.comments.length}
            </span>
          )}
          {card.attachments && card.attachments.length > 0 && (
            <span className="card-badge" title={`${card.attachments.length} attachments`}>
              📎 {card.attachments.length}
            </span>
          )}
        </div>
        
        {card.members && card.members.length > 0 && (
          <div className="card-members">
            {card.members.slice(0, 3).map((member) => (
              <Avatar
                key={member.userId}
                user={{ name: member.name, email: '' }}
                size="sm"
              />
            ))}
            {card.members.length > 3 && (
              <span className="card-members-more">+{card.members.length - 3}</span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
});

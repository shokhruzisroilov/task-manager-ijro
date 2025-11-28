import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ColumnResponse } from '../../types';
import { useCards, useCreateCard, useMoveCard } from '../../hooks/useCards';
import { useUpdateColumn, useDeleteColumn } from '../../hooks/useColumns';
import { LoadingSpinner, Input, ConfirmDialog } from '../common';
import { Card } from '../card/Card';
import { AddCardButton } from '../card/AddCardButton';
import { useDroppableColumn, useDraggableColumn, CardDragItem } from '../../hooks/useDragAndDrop';
import './Column.css';

interface ColumnProps {
  column: ColumnResponse;
  boardId: number;
}

/**
 * Column Component
 * Display a single column with its cards
 * Implements Requirements 4.2, 6.1, 6.2, 6.4, 6.3, 8.1, 8.2, 8.3
 */
export const Column: React.FC<ColumnProps> = React.memo(({ column, boardId }) => {
  const navigate = useNavigate();
  const { data: cards, isLoading } = useCards(column.id);
  const updateColumn = useUpdateColumn();
  const deleteColumn = useDeleteColumn();
  const createCard = useCreateCard(column.id);
  const moveCard = useMoveCard();

  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(column.name);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Sort cards by position - memoized to avoid re-sorting on every render
  const sortedCards = useMemo(() => 
    cards ? [...cards].sort((a, b) => a.position - b.position) : [],
    [cards]
  );

  // Handle card drop with error handling
  const handleCardDrop = useCallback(async (item: CardDragItem, targetPosition: number) => {
    // If dropping in the same column at the same position, do nothing
    if (item.columnId === column.id && item.position === targetPosition) {
      return;
    }

    try {
      // Calculate the actual target position
      let newPosition = targetPosition;
      if (targetPosition === -1) {
        // Drop at the end
        newPosition = sortedCards.length;
      }

      // Perform the move operation
      await moveCard.mutateAsync({
        id: item.id,
        data: {
          targetColumnId: column.id,
          newPosition,
        },
      });
    } catch (error) {
      // Error is handled by the hook with toast notification
      // The UI will automatically revert to the previous state
      // due to React Query's optimistic update rollback
      console.error('Failed to move card:', error);
      
      // Additional error handling could be added here if needed
      // For example, showing a specific error message or logging to an error tracking service
    }
  }, [column.id, sortedCards.length, moveCard]);

  // Set up drop zone for the column
  const { isOver, canDrop, drop } = useDroppableColumn(column.id, handleCardDrop);

  // Set up drag for the column itself
  const { isDragging: isColumnDragging, drag: dragColumn, preview: previewColumn } = useDraggableColumn({
    ...column,
    boardId: column.boardId || 0, // Ensure boardId is present
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const handleRename = useCallback(async () => {
    if (!editedName.trim() || editedName === column.name) {
      setIsEditing(false);
      setEditedName(column.name);
      return;
    }

    try {
      await updateColumn.mutateAsync({
        id: column.id,
        data: { name: editedName.trim() }
      });
      setIsEditing(false);
    } catch (error) {
      // Error is handled by the hook
      setEditedName(column.name);
    }
  }, [editedName, column.name, updateColumn]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRename();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditedName(column.name);
    }
  }, [handleRename, column.name]);

  const handleDelete = useCallback(async () => {
    try {
      await deleteColumn.mutateAsync(column.id);
      setShowDeleteConfirm(false);
    } catch (error) {
      // Error is handled by the hook
    }
  }, [column.id, deleteColumn]);

  const handleAddCard = useCallback(async (title: string) => {
    await createCard.mutateAsync({ title });
  }, [createCard]);

  const handleCardClick = useCallback((cardId: number) => {
    navigate(`/boards/${boardId}/cards/${cardId}`);
  }, [navigate, boardId]);

  const handleMenuAction = useCallback((action: 'rename' | 'delete') => {
    setShowMenu(false);
    if (action === 'rename') {
      setIsEditing(true);
    } else if (action === 'delete') {
      setShowDeleteConfirm(true);
    }
  }, []);

  return (
    <section 
      ref={(node) => {
        drop(node);
        previewColumn(node);
      }}
      className={`column ${isOver && canDrop ? 'column--drop-target' : ''} ${isColumnDragging ? 'column--dragging' : ''}`}
      aria-label={`${column.name} column`}
    >
      <div className="column__header">
        <div 
          ref={dragColumn} 
          className="column__drag-handle" 
          title="Drag to reorder"
        >
          <span>⋮⋮</span>
        </div>
        {isEditing ? (
          <Input
            type="text"
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={handleKeyDown}
            autoFocus
            className="column__title-input"
          />
        ) : (
          <>
            <h3 className="column__title" onClick={() => setIsEditing(true)}>
              {column.name}
            </h3>
            <span className="column__count">{sortedCards.length}</span>
            <div className="column__menu" ref={menuRef}>
              <button
                className="column__menu-button"
                type="button"
                aria-label="Column menu"
                onClick={() => setShowMenu(!showMenu)}
              >
                <span>⋮</span>
              </button>
              {showMenu && (
                <div className="column__menu-dropdown">
                  <button
                    className="column__menu-item"
                    onClick={() => handleMenuAction('rename')}
                    type="button"
                  >
                    Rename
                  </button>
                  <button
                    className="column__menu-item column__menu-item--danger"
                    onClick={() => handleMenuAction('delete')}
                    type="button"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <div className="column__content" role="list" aria-label={`${column.name} cards`}>
        {isLoading ? (
          <div className="column__loading">
            <LoadingSpinner size="sm" />
          </div>
        ) : sortedCards.length === 0 ? (
          <div className="column__empty">
            <p>No cards yet</p>
          </div>
        ) : (
          <div className="column__cards">
            {sortedCards.map((card) => (
              <div key={card.id} role="listitem">
                <Card
                  card={card}
                  onClick={() => handleCardClick(card.id)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="column__footer">
        <AddCardButton columnId={column.id} onAddCard={handleAddCard} />
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Column"
        message={`Are you sure you want to delete "${column.name}"? This will also delete all ${sortedCards.length} card(s) in this column.`}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        confirmText="Delete"
        confirmVariant="danger"
      />
    </section>
  );
});

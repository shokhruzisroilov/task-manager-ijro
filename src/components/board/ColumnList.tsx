import React, { useMemo, useCallback } from 'react';
import { ColumnResponse } from '../../types';
import { Column } from './Column';
import { AddColumnButton } from './AddColumnButton';
import { useUpdateColumnPosition } from '../../hooks/useColumns';
import { useDroppableBoard, ColumnDragItem } from '../../hooks/useDragAndDrop';
import './ColumnList.css';

interface ColumnListProps {
  boardId: number;
  columns: ColumnResponse[];
}

/**
 * ColumnList Component
 * Display and manage columns with horizontal scrolling
 * Implements Requirements 4.2, 6.1, 6.2, 6.3, 6.4, 8.3
 */
export const ColumnList: React.FC<ColumnListProps> = React.memo(({ boardId, columns }) => {
  const updateColumnPosition = useUpdateColumnPosition();

  // Sort columns by position - memoized to avoid re-sorting on every render
  const sortedColumns = useMemo(() => 
    [...columns].sort((a, b) => a.position - b.position),
    [columns]
  );

  // Handle column drop with error handling
  const handleColumnDrop = useCallback(async (item: ColumnDragItem, targetPosition: number) => {
    // If dropping at the same position, do nothing
    if (item.position === targetPosition) {
      return;
    }

    try {
      // Calculate the actual target position
      let newPosition = targetPosition;
      if (targetPosition === -1) {
        // Drop at the end
        newPosition = sortedColumns.length - 1;
      }

      // Perform the move operation
      await updateColumnPosition.mutateAsync({
        id: item.id,
        newPosition,
      });
    } catch (error) {
      // Error is handled by the hook with toast notification
      // The UI will automatically revert to the previous state
      // due to React Query's optimistic update rollback
      console.error('Failed to move column:', error);
      
      // Additional error handling could be added here if needed
      // For example, showing a specific error message or logging to an error tracking service
    }
  }, [sortedColumns.length, updateColumnPosition]);

  // Set up drop zone for the board
  const { isOver, drop } = useDroppableBoard(boardId, handleColumnDrop);

  return (
    <div 
      ref={drop}
      className={`column-list ${isOver ? 'column-list--drop-target' : ''}`}
    >
      <div className="column-list__container">
        {sortedColumns.map((column) => (
          <Column key={column.id} column={column} boardId={boardId} />
        ))}
        
        <AddColumnButton boardId={boardId} />
      </div>
    </div>
  );
});

import { useState, useCallback } from 'react';

interface DragDropItem {
  id: number;
  type: 'card' | 'column';
}

interface Position {
  columnId?: number;
  position: number;
}

/**
 * Hook to provide keyboard alternatives for drag and drop
 * Implements Requirements 17.5: Keyboard alternatives for drag-drop
 */
export const useKeyboardDragDrop = () => {
  const [selectedItem, setSelectedItem] = useState<DragDropItem | null>(null);
  const [mode, setMode] = useState<'select' | 'move'>('select');

  const selectItem = useCallback((item: DragDropItem) => {
    setSelectedItem(item);
    setMode('move');
  }, []);

  const cancelSelection = useCallback(() => {
    setSelectedItem(null);
    setMode('select');
  }, []);

  const moveItem = useCallback(
    (targetPosition: Position, onMove: (item: DragDropItem, target: Position) => void) => {
      if (selectedItem) {
        onMove(selectedItem, targetPosition);
        setSelectedItem(null);
        setMode('select');
      }
    },
    [selectedItem]
  );

  const handleKeyDown = useCallback(
    (
      e: React.KeyboardEvent,
      item: DragDropItem,
      onMove: (item: DragDropItem, target: Position) => void,
      currentPosition: Position
    ) => {
      // Space or Enter to select/deselect
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (mode === 'select') {
          selectItem(item);
        } else if (selectedItem?.id === item.id) {
          cancelSelection();
        }
        return;
      }

      // Escape to cancel
      if (e.key === 'Escape') {
        e.preventDefault();
        cancelSelection();
        return;
      }

      // Arrow keys to move (only when item is selected)
      if (mode === 'move' && selectedItem?.id === item.id) {
        e.preventDefault();
        
        switch (e.key) {
          case 'ArrowUp':
            // Move up in same column
            if (currentPosition.position > 0) {
              moveItem(
                {
                  columnId: currentPosition.columnId,
                  position: currentPosition.position - 1,
                },
                onMove
              );
            }
            break;
          case 'ArrowDown':
            // Move down in same column
            moveItem(
              {
                columnId: currentPosition.columnId,
                position: currentPosition.position + 1,
              },
              onMove
            );
            break;
          case 'ArrowLeft':
            // Move to previous column (for cards)
            if (item.type === 'card' && currentPosition.columnId) {
              moveItem(
                {
                  columnId: currentPosition.columnId - 1,
                  position: 0,
                },
                onMove
              );
            }
            break;
          case 'ArrowRight':
            // Move to next column (for cards)
            if (item.type === 'card' && currentPosition.columnId) {
              moveItem(
                {
                  columnId: currentPosition.columnId + 1,
                  position: 0,
                },
                onMove
              );
            }
            break;
        }
      }
    },
    [mode, selectedItem, selectItem, cancelSelection, moveItem]
  );

  return {
    selectedItem,
    mode,
    selectItem,
    cancelSelection,
    moveItem,
    handleKeyDown,
  };
};

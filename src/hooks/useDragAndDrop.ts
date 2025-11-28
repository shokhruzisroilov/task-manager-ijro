import { useDrag, useDrop, DragSourceMonitor, DropTargetMonitor } from 'react-dnd';
import { Card, Column } from '../types/models';

// Drag item types
export const ItemTypes = {
  CARD: 'CARD',
  COLUMN: 'COLUMN',
} as const;

// Drag item interfaces
export interface CardDragItem {
  type: typeof ItemTypes.CARD;
  id: number;
  columnId: number;
  position: number;
}

export interface ColumnDragItem {
  type: typeof ItemTypes.COLUMN;
  id: number;
  boardId: number;
  position: number;
}

// Hook for draggable cards
export const useDraggableCard = (card: Card) => {
  const [{ isDragging }, drag, preview] = useDrag<
    CardDragItem,
    void,
    { isDragging: boolean }
  >({
    type: ItemTypes.CARD,
    item: {
      type: ItemTypes.CARD,
      id: card.id,
      columnId: card.columnId,
      position: card.position,
    },
    collect: (monitor: DragSourceMonitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return { isDragging, drag, preview };
};

// Hook for droppable columns (for cards)
export const useDroppableColumn = (
  columnId: number,
  onDrop: (item: CardDragItem, targetPosition: number) => void
) => {
  const [{ isOver, canDrop }, drop] = useDrop<
    CardDragItem,
    void,
    { isOver: boolean; canDrop: boolean }
  >({
    accept: ItemTypes.CARD,
    drop: (item: CardDragItem, monitor: DropTargetMonitor) => {
      const didDrop = monitor.didDrop();
      if (didDrop) {
        return;
      }
      
      // Drop at the end of the column
      onDrop(item, -1);
    },
    collect: (monitor: DropTargetMonitor) => ({
      isOver: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop(),
    }),
  });

  return { isOver, canDrop, drop };
};

// Hook for droppable card positions (for inserting between cards)
export const useDroppableCardPosition = (
  columnId: number,
  position: number,
  onDrop: (item: CardDragItem, targetPosition: number) => void
) => {
  const [{ isOver }, drop] = useDrop<
    CardDragItem,
    void,
    { isOver: boolean }
  >({
    accept: ItemTypes.CARD,
    drop: (item: CardDragItem) => {
      onDrop(item, position);
    },
    collect: (monitor: DropTargetMonitor) => ({
      isOver: monitor.isOver({ shallow: true }),
    }),
  });

  return { isOver, drop };
};

// Hook for draggable columns
export const useDraggableColumn = (column: Column) => {
  const [{ isDragging }, drag, preview] = useDrag<
    ColumnDragItem,
    void,
    { isDragging: boolean }
  >({
    type: ItemTypes.COLUMN,
    item: {
      type: ItemTypes.COLUMN,
      id: column.id,
      boardId: column.boardId,
      position: column.position,
    },
    collect: (monitor: DragSourceMonitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return { isDragging, drag, preview };
};

// Hook for droppable board (for columns)
export const useDroppableBoard = (
  boardId: number,
  onDrop: (item: ColumnDragItem, targetPosition: number) => void
) => {
  const [{ isOver }, drop] = useDrop<
    ColumnDragItem,
    void,
    { isOver: boolean }
  >({
    accept: ItemTypes.COLUMN,
    drop: (item: ColumnDragItem, monitor: DropTargetMonitor) => {
      const didDrop = monitor.didDrop();
      if (didDrop) {
        return;
      }
      
      // Drop at the end
      onDrop(item, -1);
    },
    collect: (monitor: DropTargetMonitor) => ({
      isOver: monitor.isOver({ shallow: true }),
    }),
  });

  return { isOver, drop };
};

// Hook for droppable column positions (for inserting between columns)
export const useDroppableColumnPosition = (
  boardId: number,
  position: number,
  onDrop: (item: ColumnDragItem, targetPosition: number) => void
) => {
  const [{ isOver }, drop] = useDrop<
    ColumnDragItem,
    void,
    { isOver: boolean }
  >({
    accept: ItemTypes.COLUMN,
    drop: (item: ColumnDragItem) => {
      onDrop(item, position);
    },
    collect: (monitor: DropTargetMonitor) => ({
      isOver: monitor.isOver({ shallow: true }),
    }),
  });

  return { isOver, drop };
};

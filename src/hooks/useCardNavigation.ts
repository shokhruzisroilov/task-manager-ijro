import { useState, useCallback, useEffect } from 'react';

interface Card {
  id: number;
  position: number;
  columnId: number;
}

interface Column {
  id: number;
  position: number;
  cards: Card[];
}

/**
 * Hook to handle keyboard navigation between cards
 * Supports arrow key navigation within and across columns
 */
export const useCardNavigation = (columns: Column[]) => {
  const [focusedCardId, setFocusedCardId] = useState<number | null>(null);
  const [focusedColumnId, setFocusedColumnId] = useState<number | null>(null);

  // Find card and column indices
  const findCardPosition = useCallback((cardId: number) => {
    for (let colIndex = 0; colIndex < columns.length; colIndex++) {
      const column = columns[colIndex];
      const cardIndex = column.cards.findIndex(c => c.id === cardId);
      if (cardIndex !== -1) {
        return { colIndex, cardIndex, column };
      }
    }
    return null;
  }, [columns]);

  const navigateUp = useCallback(() => {
    if (!focusedCardId) return;

    const position = findCardPosition(focusedCardId);
    if (!position) return;

    const { colIndex, cardIndex, column } = position;

    // Move to previous card in same column
    if (cardIndex > 0) {
      const prevCard = column.cards[cardIndex - 1];
      setFocusedCardId(prevCard.id);
      
      // Focus the card element
      const cardElement = document.querySelector(`[data-card-id="${prevCard.id}"]`) as HTMLElement;
      cardElement?.focus();
    }
  }, [focusedCardId, findCardPosition]);

  const navigateDown = useCallback(() => {
    if (!focusedCardId) return;

    const position = findCardPosition(focusedCardId);
    if (!position) return;

    const { colIndex, cardIndex, column } = position;

    // Move to next card in same column
    if (cardIndex < column.cards.length - 1) {
      const nextCard = column.cards[cardIndex + 1];
      setFocusedCardId(nextCard.id);
      
      // Focus the card element
      const cardElement = document.querySelector(`[data-card-id="${nextCard.id}"]`) as HTMLElement;
      cardElement?.focus();
    }
  }, [focusedCardId, findCardPosition]);

  const navigateLeft = useCallback(() => {
    if (!focusedCardId) return;

    const position = findCardPosition(focusedCardId);
    if (!position) return;

    const { colIndex } = position;

    // Move to previous column
    if (colIndex > 0) {
      const prevColumn = columns[colIndex - 1];
      if (prevColumn.cards.length > 0) {
        const firstCard = prevColumn.cards[0];
        setFocusedCardId(firstCard.id);
        setFocusedColumnId(prevColumn.id);
        
        // Focus the card element
        const cardElement = document.querySelector(`[data-card-id="${firstCard.id}"]`) as HTMLElement;
        cardElement?.focus();
      }
    }
  }, [focusedCardId, findCardPosition, columns]);

  const navigateRight = useCallback(() => {
    if (!focusedCardId) return;

    const position = findCardPosition(focusedCardId);
    if (!position) return;

    const { colIndex } = position;

    // Move to next column
    if (colIndex < columns.length - 1) {
      const nextColumn = columns[colIndex + 1];
      if (nextColumn.cards.length > 0) {
        const firstCard = nextColumn.cards[0];
        setFocusedCardId(firstCard.id);
        setFocusedColumnId(nextColumn.id);
        
        // Focus the card element
        const cardElement = document.querySelector(`[data-card-id="${firstCard.id}"]`) as HTMLElement;
        cardElement?.focus();
      }
    }
  }, [focusedCardId, findCardPosition, columns]);

  return {
    focusedCardId,
    focusedColumnId,
    setFocusedCardId,
    setFocusedColumnId,
    navigateUp,
    navigateDown,
    navigateLeft,
    navigateRight,
  };
};

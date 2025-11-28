import React, { useState, lazy, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBoard } from '../../hooks/useBoards';
import { useColumns } from '../../hooks/useColumns';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { LoadingSpinner, Button } from '../../components/common';
import { ColumnList } from '../../components/board/ColumnList';
import { BoardSettings } from '../../components/board/BoardSettings';
import { Breadcrumbs } from '../../components/layout/Breadcrumbs';
import './BoardView.css';

// Lazy load CardModal
const CardModal = lazy(() => import('../../components/card/CardModal').then(module => ({ default: module.CardModal })));

/**
 * BoardView Component
 * Main board display with columns layout
 * Implements Requirements 4.2, 6.1
 */
export const BoardView: React.FC = () => {
  const { boardId, cardId } = useParams<{ boardId: string; cardId?: string }>();
  const navigate = useNavigate();
  const numericBoardId = Number(boardId);
  const numericCardId = cardId ? Number(cardId) : null;
  const [searchOpen, setSearchOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const { data: board, isLoading: boardLoading, error: boardError } = useBoard(numericBoardId);
  const { data: columns, isLoading: columnsLoading } = useColumns(numericBoardId);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onSearch: () => setSearchOpen(true),
    onEscape: () => setSearchOpen(false),
  });

  if (boardLoading || columnsLoading) {
    return (
      <div className="board-view__loading">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (boardError || !board) {
    return (
      <div className="board-view__error">
        <h2>Board not found</h2>
        <p>The board you're looking for doesn't exist or you don't have access to it.</p>
      </div>
    );
  }

  const handleCloseCard = () => {
    navigate(`/boards/${boardId}`);
  };

  return (
    <main className="board-view" role="main" aria-label="Board view">
      <div className="board-view__navbar">
        <Breadcrumbs />
        <Button onClick={() => setShowSettings(true)} size="sm">
          ⚙️ Settings
        </Button>
      </div>

      <div className="board-view__content" role="region" aria-label="Board columns">
        <ColumnList boardId={numericBoardId} columns={columns || []} />
      </div>

      {numericCardId && (
        <Suspense fallback={<LoadingSpinner />}>
          <CardModal
            cardId={numericCardId}
            boardId={numericBoardId}
            onClose={handleCloseCard}
          />
        </Suspense>
      )}

      {showSettings && (
        <BoardSettings
          board={board}
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </main>
  );
};

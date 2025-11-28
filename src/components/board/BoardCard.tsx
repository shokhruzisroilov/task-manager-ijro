import React, { useState } from 'react';
import { Board } from '../../types/models';
import { BoardSettings } from './BoardSettings';
import './BoardCard.css';

export interface BoardCardProps {
  board: Board;
  onClick: () => void;
}

/**
 * BoardCard Component
 * Displays a single board with actions
 * Implements Requirements 4.1, 4.3
 */
export const BoardCard: React.FC<BoardCardProps> = ({ board, onClick }) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleSettingsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSettingsOpen(true);
  };

  const handleCardClick = () => {
    onClick();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <>
      <div
        className="board-card"
        onClick={handleCardClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-label={`Open board ${board.name}`}
      >
        <div className="board-card__header">
          <h3 className="board-card__name">{board.name}</h3>
          <button
            className="board-card__settings-btn"
            onClick={handleSettingsClick}
            aria-label="Board settings"
          >
            ⚙️
          </button>
        </div>

        {board.description && (
          <p className="board-card__description">{board.description}</p>
        )}

        <div className="board-card__footer">
          <span className="board-card__column-count">
            {board.columns?.length || 0}{' '}
            {board.columns?.length === 1 ? 'column' : 'columns'}
          </span>
        </div>
      </div>

      <BoardSettings
        board={board}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
};

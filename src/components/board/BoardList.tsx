import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBoards } from '../../hooks/useBoards';
import { BoardCard } from './BoardCard';
import { CreateBoardModal } from './CreateBoardModal';
import { Button } from '../common/Button';
import { LoadingSpinner } from '../common/LoadingSpinner';
import './BoardList.css';

export interface BoardListProps {
  workspaceId: number;
}

/**
 * BoardList Component
 * Displays all boards in a workspace
 * Implements Requirement 4.1: Board creation succeeds for workspace members
 */
export const BoardList: React.FC<BoardListProps> = ({ workspaceId }) => {
  const navigate = useNavigate();
  const { data: boards, isLoading, error } = useBoards(workspaceId);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleBoardClick = (boardId: number) => {
    navigate(`/boards/${boardId}`);
  };

  const handleCreateClick = () => {
    setIsCreateModalOpen(true);
  };

  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className="board-list__loading">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="board-list__error">
        <p>Failed to load boards. Please try again.</p>
      </div>
    );
  }

  // Filter out archived boards
  const activeBoards = boards?.filter(board => !board.archived) || [];

  return (
    <div className="board-list">
      <div className="board-list__header">
        <h1 className="board-list__title">Boards</h1>
        <Button onClick={handleCreateClick}>
          Create Board
        </Button>
      </div>

      {activeBoards.length > 0 ? (
        <div className="board-list__grid">
          {activeBoards.map((board) => (
            <BoardCard
              key={board.id}
              board={board}
              onClick={() => handleBoardClick(board.id)}
            />
          ))}
        </div>
      ) : (
        <div className="board-list__empty">
          <p>No boards yet. Create your first board to get started!</p>
          <Button onClick={handleCreateClick}>
            Create Your First Board
          </Button>
        </div>
      )}

      <CreateBoardModal
        workspaceId={workspaceId}
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
};

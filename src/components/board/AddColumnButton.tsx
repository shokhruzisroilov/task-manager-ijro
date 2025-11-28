import React, { useState } from 'react';
import { useCreateColumn } from '../../hooks/useColumns';
import { Button, Input } from '../common';
import './AddColumnButton.css';

interface AddColumnButtonProps {
  boardId: number;
}

/**
 * AddColumnButton Component
 * Create new columns in a board
 * Implements Requirement 6.1: Column creation adds at end position
 */
export const AddColumnButton: React.FC<AddColumnButtonProps> = ({ boardId }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [columnName, setColumnName] = useState('');
  const createColumn = useCreateColumn(boardId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!columnName.trim()) {
      return;
    }

    try {
      await createColumn.mutateAsync({ name: columnName.trim() });
      setColumnName('');
      setIsAdding(false);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleCancel = () => {
    setColumnName('');
    setIsAdding(false);
  };

  if (isAdding) {
    return (
      <div className="add-column-button add-column-button--form">
        <form onSubmit={handleSubmit} className="add-column-button__form">
          <Input
            type="text"
            value={columnName}
            onChange={(e) => setColumnName(e.target.value)}
            placeholder="Enter column name..."
            autoFocus
            className="add-column-button__input"
          />
          <div className="add-column-button__actions">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={!columnName.trim() || createColumn.isPending}
              loading={createColumn.isPending}
            >
              Add Column
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              disabled={createColumn.isPending}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="add-column-button">
      <button
        className="add-column-button__trigger"
        onClick={() => setIsAdding(true)}
        type="button"
      >
        <span className="add-column-button__icon">+</span>
        <span className="add-column-button__text">Add Column</span>
      </button>
    </div>
  );
};

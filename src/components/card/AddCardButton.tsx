import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import './AddCardButton.css';

interface AddCardButtonProps {
  columnId: number;
  onAddCard: (title: string) => Promise<void>;
}

export const AddCardButton: React.FC<AddCardButtonProps> = ({ columnId, onAddCard }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAdding && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAdding]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      return;
    }

    setIsLoading(true);
    try {
      await onAddCard(title.trim());
      setTitle('');
      setIsAdding(false);
    } catch (error) {
      console.error('Failed to add card:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setTitle('');
    setIsAdding(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (!isAdding) {
    return (
      <button
        className="add-card-button"
        onClick={() => setIsAdding(true)}
      >
        <span className="add-card-icon">+</span>
        <span>Add a card</span>
      </button>
    );
  }

  return (
    <form className="add-card-form" onSubmit={handleSubmit}>
      <Input
        ref={inputRef}
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Enter card title..."
        disabled={isLoading}
      />
      <div className="add-card-actions">
        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={!title.trim() || isLoading}
          loading={isLoading}
        >
          Add Card
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
};

import React, { useState } from 'react';
import { Button, Input } from '../common';
import { useAuthStore } from '../../store/auth.store';
import './CommentForm.css';

interface CommentFormProps {
  onSubmit: (text: string) => void;
  isSubmitting: boolean;
}

/**
 * CommentForm component for creating new comments
 * Implements Requirement 11.1: Comment creation
 */
export const CommentForm: React.FC<CommentFormProps> = ({ onSubmit, isSubmitting }) => {
  const { user } = useAuthStore();
  const [text, setText] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!text.trim()) return;

    onSubmit(text.trim());
    setText('');
    setIsFocused(false);
  };

  const handleCancel = () => {
    setText('');
    setIsFocused(false);
  };

  if (!user) {
    return null;
  }

  return (
    <form className="comment-form" onSubmit={handleSubmit}>
      <div className="comment-form__header">
        <div className="comment-form__avatar">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div className="comment-form__input-wrapper">
          <Input
            type="textarea"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onFocus={() => setIsFocused(true)}
            placeholder="Write a comment..."
            rows={isFocused ? 3 : 1}
            disabled={isSubmitting}
          />
        </div>
      </div>

      {isFocused && (
        <div className="comment-form__actions">
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={!text.trim() || isSubmitting}
          >
            {isSubmitting ? 'Posting...' : 'Post'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      )}
    </form>
  );
};

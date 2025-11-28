import React, { useState } from 'react';
import { Button, Input, ConfirmDialog } from '../common';
import { useAuthStore } from '../../store/auth.store';
import { Comment as CommentType } from '../../types';
import './Comment.css';

interface CommentProps {
  comment: CommentType;
  onEdit: (id: number, text: string) => void;
  onDelete: (id: number) => void;
  isEditing: boolean;
  isDeleting: boolean;
}

/**
 * Comment component for displaying individual comments
 * Implements Requirements 11.1, 11.2, 11.3, 11.4, 11.5
 */
export const Comment: React.FC<CommentProps> = ({
  comment,
  onEdit,
  onDelete,
  isEditing,
  isDeleting
}) => {
  const { user } = useAuthStore();
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedText, setEditedText] = useState(comment.text);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isAuthor = user?.id === comment.authorId;
  const wasEdited = comment.updatedAt !== comment.createdAt;

  const handleSaveEdit = () => {
    if (!editedText.trim()) {
      setEditedText(comment.text);
      setIsEditMode(false);
      return;
    }

    if (editedText.trim() !== comment.text) {
      onEdit(comment.id, editedText.trim());
    }
    setIsEditMode(false);
  };

  const handleCancelEdit = () => {
    setEditedText(comment.text);
    setIsEditMode(false);
  };

  const handleDelete = () => {
    onDelete(comment.id);
    setShowDeleteConfirm(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  return (
    <>
      <div className="comment">
        <div className="comment__header">
          <div className="comment__author-info">
            <div className="comment__avatar">
              {comment.authorName.charAt(0).toUpperCase()}
            </div>
            <div className="comment__meta">
              <span className="comment__author">{comment.authorName}</span>
              <span className="comment__date">
                {formatDate(comment.createdAt)}
                {wasEdited && <span className="comment__edited"> (edited)</span>}
              </span>
            </div>
          </div>
          {isAuthor && !isEditMode && (
            <div className="comment__actions">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditMode(true)}
                disabled={isEditing || isDeleting}
              >
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isEditing || isDeleting}
              >
                Delete
              </Button>
            </div>
          )}
        </div>

        <div className="comment__body">
          {isEditMode ? (
            <div className="comment__edit">
              <Input
                type="textarea"
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                rows={3}
                autoFocus
                disabled={isEditing}
              />
              <div className="comment__edit-actions">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSaveEdit}
                  disabled={isEditing || !editedText.trim()}
                >
                  {isEditing ? 'Saving...' : 'Save'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelEdit}
                  disabled={isEditing}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="comment__text">{comment.text}</p>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Comment"
        message="Are you sure you want to delete this comment? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        confirmText="Delete"
        confirmVariant="danger"
      />
    </>
  );
};

import React, { useState } from 'react';
import { LoadingSpinner } from '../common';
import { Comment } from './Comment';
import { CommentForm } from './CommentForm';
import { useComments, useCreateComment, useUpdateComment, useDeleteComment } from '../../hooks/useComments';
import { useAuthStore } from '../../store/auth.store';
import './CardComments.css';

interface CardCommentsProps {
  cardId: number;
}

/**
 * CardComments component for displaying and managing card comments
 * Implements Requirements 11.1, 11.2, 11.3, 11.4, 11.5
 * 
 * Requirement 11.1: Comment creation displays on card
 * Requirement 11.2: Comment update shows edited indicator
 * Requirement 11.3: Comment deletion removes from card
 * Requirement 11.4: Comments display in chronological order
 * Requirement 11.5: Unauthorized comment edit shows error
 */
export const CardComments: React.FC<CardCommentsProps> = ({ cardId }) => {
  const { user } = useAuthStore();
  const { data: comments, isLoading } = useComments(cardId);
  const createComment = useCreateComment(cardId);
  const updateComment = useUpdateComment();
  const deleteComment = useDeleteComment();

  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [deletingCommentId, setDeletingCommentId] = useState<number | null>(null);

  const handleCreateComment = async (text: string) => {
    try {
      await createComment.mutateAsync({ text });
    } catch (error: any) {
      // Error handled by hook
      console.error('Failed to create comment:', error);
    }
  };

  const handleEditComment = async (id: number, text: string) => {
    setEditingCommentId(id);
    try {
      await updateComment.mutateAsync({ id, data: { text } });
    } catch (error: any) {
      // Error handled by hook
      console.error('Failed to update comment:', error);
    } finally {
      setEditingCommentId(null);
    }
  };

  const handleDeleteComment = async (id: number) => {
    setDeletingCommentId(id);
    try {
      await deleteComment.mutateAsync(id);
    } catch (error: any) {
      // Error handled by hook
      console.error('Failed to delete comment:', error);
    } finally {
      setDeletingCommentId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="card-comments__loading">
        <LoadingSpinner size="sm" />
      </div>
    );
  }

  // Sort comments in chronological order (oldest first)
  // Requirement 11.4: Comments display in chronological order
  const sortedComments = comments
    ? [...comments].sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
    : [];

  return (
    <div className="card-comments">
      <div className="card-comments__header">
        <h3 className="card-comments__title">
          💬 Comments
          {sortedComments.length > 0 && (
            <span className="card-comments__count">({sortedComments.length})</span>
          )}
        </h3>
      </div>

      {sortedComments.length > 0 ? (
        <div className="card-comments__list">
          {sortedComments.map((comment) => (
            <Comment
              key={comment.id}
              comment={comment}
              onEdit={handleEditComment}
              onDelete={handleDeleteComment}
              isEditing={editingCommentId === comment.id}
              isDeleting={deletingCommentId === comment.id}
            />
          ))}
        </div>
      ) : (
        <p className="card-comments__empty">
          No comments yet. Be the first to comment!
        </p>
      )}

      {user && (
        <CommentForm
          onSubmit={handleCreateComment}
          isSubmitting={createComment.isPending}
        />
      )}
    </div>
  );
};

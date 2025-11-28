import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useCard, useUpdateCard, useArchiveCard, useDeleteCard } from '../../hooks/useCards';
import { Modal, Button, Input, LoadingSpinner, ConfirmDialog } from '../common';
import { CardMembers } from './CardMembers';
import { CardComments } from './CardComments';
import { AttachmentList } from './AttachmentList';
import { Breadcrumbs } from '../layout/Breadcrumbs';
import './CardModal.css';

// Lazy load heavy modal
const AttachLabelModal = lazy(() => import('../label').then(module => ({ default: module.AttachLabelModal })));

interface CardModalProps {
  cardId: number;
  boardId: number;
  onClose: () => void;
}

export const CardModal: React.FC<CardModalProps> = React.memo(({ cardId, boardId, onClose }) => {
  const { data: card, isLoading } = useCard(cardId);
  const updateCard = useUpdateCard();
  const archiveCard = useArchiveCard();
  const deleteCard = useDeleteCard();

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLabelModal, setShowLabelModal] = useState(false);

  useEffect(() => {
    if (card) {
      setEditedTitle(card.title);
      setEditedDescription(card.description || '');
      const dateValue = card.dueDate;
      if (dateValue !== undefined && dateValue !== null) {
        setDueDate(dateValue.split('T')[0] as string);
      } else {
        setDueDate('');
      }
    }
  }, [card]);

  const handleUpdateTitle = useCallback(async () => {
    if (!card || !editedTitle.trim() || editedTitle === card.title) {
      setIsEditingTitle(false);
      if (card) setEditedTitle(card.title);
      return;
    }

    try {
      await updateCard.mutateAsync({
        id: cardId,
        data: {
          title: editedTitle.trim(),
          description: card.description,
          dueDate: card.dueDate
        }
      });
      setIsEditingTitle(false);
    } catch (error) {
      setEditedTitle(card.title);
    }
  }, [cardId, editedTitle, card, updateCard]);

  const handleUpdateDescription = useCallback(async () => {
    if (!card || editedDescription === (card.description || '')) {
      setIsEditingDescription(false);
      return;
    }

    try {
      await updateCard.mutateAsync({
        id: cardId,
        data: {
          title: card.title,
          description: editedDescription.trim() || undefined,
          dueDate: card.dueDate
        }
      });
      setIsEditingDescription(false);
    } catch (error) {
      setEditedDescription(card.description || '');
    }
  }, [cardId, editedDescription, card, updateCard]);

  const handleUpdateDueDate = useCallback(async (newDueDate: string) => {
    if (!card) return;
    
    try {
      await updateCard.mutateAsync({
        id: cardId,
        data: {
          title: card.title,
          description: card.description,
          dueDate: newDueDate || undefined
        }
      });
      setDueDate(newDueDate);
    } catch (error) {
      const dateValue = card.dueDate;
      if (dateValue !== undefined && dateValue !== null) {
        setDueDate(dateValue.split('T')[0] as string);
      } else {
        setDueDate('');
      }
    }
  }, [cardId, card, updateCard]);

  const handleArchive = useCallback(async () => {
    if (!card) return;
    
    try {
      await archiveCard.mutateAsync({ id: cardId, archived: !card.archived });
      onClose();
    } catch (error) {
      // Error handled by hook
    }
  }, [cardId, card, archiveCard, onClose]);

  const handleDelete = useCallback(async () => {
    try {
      await deleteCard.mutateAsync(cardId);
      setShowDeleteConfirm(false);
      onClose();
    } catch (error) {
      // Error handled by hook
    }
  }, [cardId, deleteCard, onClose]);

  const formatDate = useCallback((dateString?: string) => {
    if (!dateString) return 'No due date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }, []);

  if (isLoading || !card) {
    return (
      <Modal isOpen={true} onClose={onClose} title="Loading...">
        <div className="card-modal__loading">
          <LoadingSpinner />
        </div>
      </Modal>
    );
  }

  return (
    <>
      <Modal
        isOpen={true}
        onClose={onClose}
        title=""
        size="lg"
      >
        <div className="card-modal__content">
          {/* Breadcrumbs */}
          <Breadcrumbs />
          
          {/* Title Section */}
          <div className="card-modal__section">
            <div className="card-modal__icon">📋</div>
            <div className="card-modal__section-content">
              {isEditingTitle ? (
                <Input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  onBlur={handleUpdateTitle}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleUpdateTitle();
                    if (e.key === 'Escape') {
                      setIsEditingTitle(false);
                      setEditedTitle(card.title);
                    }
                  }}
                  autoFocus
                  className="card-modal__title-input"
                />
              ) : (
                <h2
                  className="card-modal__title"
                  onClick={() => setIsEditingTitle(true)}
                >
                  {card.title}
                </h2>
              )}
              <p className="card-modal__subtitle">
                in column <span className="card-modal__column-name">{/* Column name */}</span>
              </p>
            </div>
          </div>

          {/* Main Content */}
          <div className="card-modal__main">
            {/* Left Column */}
            <div className="card-modal__left">
              {/* Members Section */}
              <div className="card-modal__section">
                <CardMembers
                  cardId={cardId}
                  boardId={boardId}
                  members={card.members || []}
                />
              </div>

              {/* Labels Section */}
              <div className="card-modal__section">
                <div className="card-modal__section-header">
                  <h3 className="card-modal__section-title">Labels</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowLabelModal(true)}
                  >
                    {card.labels && card.labels.length > 0 ? 'Edit' : 'Add'}
                  </Button>
                </div>
                {card.labels && card.labels.length > 0 ? (
                  <div className="card-modal__labels">
                    {card.labels.map((label) => (
                      <span
                        key={label.id}
                        className="card-modal__label"
                        style={{ backgroundColor: label.color }}
                      >
                        {label.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="card-modal__empty">No labels</p>
                )}
              </div>

              {/* Due Date Section */}
              <div className="card-modal__section">
                <h3 className="card-modal__section-title">Due Date</h3>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => handleUpdateDueDate(e.target.value)}
                  className="card-modal__date-input"
                />
                {card.dueDate && (
                  <p className="card-modal__date-display">{formatDate(card.dueDate)}</p>
                )}
              </div>

              {/* Description Section */}
              <div className="card-modal__section">
                <div className="card-modal__section-header">
                  <div className="card-modal__icon">📝</div>
                  <h3 className="card-modal__section-title">Description</h3>
                </div>
                {isEditingDescription ? (
                  <div className="card-modal__description-edit">
                    <Input
                      type="textarea"
                      value={editedDescription}
                      onChange={(e) => setEditedDescription(e.target.value)}
                      rows={6}
                      placeholder="Add a more detailed description..."
                    />
                    <div className="card-modal__description-actions">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleUpdateDescription}
                      >
                        Save
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setIsEditingDescription(false);
                          setEditedDescription(card.description || '');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="card-modal__description"
                    onClick={() => setIsEditingDescription(true)}
                  >
                    {card.description || (
                      <p className="card-modal__description-placeholder">
                        Add a more detailed description...
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Comments Section */}
              <div className="card-modal__section">
                <CardComments cardId={cardId} />
              </div>

              {/* Attachments Section */}
              <div className="card-modal__section">
                <div className="card-modal__section-header">
                  <div className="card-modal__icon">📎</div>
                  <h3 className="card-modal__section-title">Attachments</h3>
                </div>
                <AttachmentList cardId={cardId} />
              </div>
            </div>

            {/* Right Column - Actions */}
            <div className="card-modal__right">
              <div className="card-modal__actions">
                <h3 className="card-modal__actions-title">Actions</h3>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleArchive}
                  className="card-modal__action-button"
                >
                  {card.archived ? 'Unarchive' : 'Archive'}
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="card-modal__action-button"
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Card"
        message={`Are you sure you want to delete "${card.title}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        confirmText="Delete"
        confirmVariant="danger"
      />

      {showLabelModal && (
        <Suspense fallback={<LoadingSpinner />}>
          <AttachLabelModal
            isOpen={showLabelModal}
            onClose={() => setShowLabelModal(false)}
            cardId={cardId}
            boardId={boardId}
            attachedLabels={card.labels || []}
          />
        </Suspense>
      )}
    </>
  );
});

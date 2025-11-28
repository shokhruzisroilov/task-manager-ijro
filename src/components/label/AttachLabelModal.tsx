import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { useLabels, useAttachLabel, useDetachLabel } from '../../hooks/useLabels';
import { Label } from './Label';
import { LabelSummary } from '../../types';
import './AttachLabelModal.css';

export interface AttachLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardId: number;
  boardId: number;
  attachedLabels: LabelSummary[];
}

/**
 * Modal for attaching/detaching labels to/from cards
 * Implements Requirements 10.4, 10.5
 */
export const AttachLabelModal: React.FC<AttachLabelModalProps> = ({
  isOpen,
  onClose,
  cardId,
  boardId,
  attachedLabels
}) => {
  const { data: boardLabels, isLoading, error } = useLabels(boardId);
  const attachLabel = useAttachLabel(cardId);
  const detachLabel = useDetachLabel(cardId);
  const [processingLabelId, setProcessingLabelId] = useState<number | null>(null);

  const isLabelAttached = (labelId: number) => {
    return attachedLabels.some(l => l.id === labelId);
  };

  const handleToggleLabel = async (labelId: number) => {
    setProcessingLabelId(labelId);
    try {
      if (isLabelAttached(labelId)) {
        await detachLabel.mutateAsync(labelId);
      } else {
        await attachLabel.mutateAsync(labelId);
      }
    } finally {
      setProcessingLabelId(null);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Labels"
      size="sm"
    >
      <div className="attach-label-modal">
        {isLoading && (
          <div className="attach-label-modal__loading">
            <LoadingSpinner />
          </div>
        )}

        {error && (
          <div className="attach-label-modal__error">
            <p>Failed to load labels</p>
          </div>
        )}

        {boardLabels && boardLabels.length > 0 ? (
          <div className="attach-label-modal__list">
            {boardLabels.map((label) => {
              const attached = isLabelAttached(label.id);
              const processing = processingLabelId === label.id;

              return (
                <div key={label.id} className="attach-label-modal__item">
                  <button
                    className={`attach-label-modal__button ${attached ? 'attach-label-modal__button--attached' : ''}`}
                    onClick={() => handleToggleLabel(label.id)}
                    disabled={processing}
                  >
                    <Label label={label} size="md" />
                    {attached && (
                      <span className="attach-label-modal__check">✓</span>
                    )}
                    {processing && (
                      <span className="attach-label-modal__spinner">
                        <LoadingSpinner size="sm" />
                      </span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          !isLoading && (
            <div className="attach-label-modal__empty">
              <p>No labels available. Create labels in the board settings first.</p>
            </div>
          )
        )}

        <div className="attach-label-modal__footer">
          <Button
            variant="secondary"
            onClick={onClose}
            fullWidth
          >
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

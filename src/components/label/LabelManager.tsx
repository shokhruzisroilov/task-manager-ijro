import React, { useState } from 'react';
import { Button } from '../common/Button';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { useLabels } from '../../hooks/useLabels';
import { Label } from './Label';
import { CreateLabelModal } from './CreateLabelModal';
import { EditLabelModal } from './EditLabelModal';
import { Label as LabelType } from '../../types';
import './LabelManager.css';

export interface LabelManagerProps {
  boardId: number;
}

/**
 * Component for managing board labels
 * Implements Requirements 10.1, 10.2, 10.3
 */
export const LabelManager: React.FC<LabelManagerProps> = ({ boardId }) => {
  const { data: labels, isLoading, error } = useLabels(boardId);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingLabel, setEditingLabel] = useState<LabelType | null>(null);

  if (isLoading) {
    return (
      <div className="label-manager__loading">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="label-manager__error">
        <p>Failed to load labels</p>
      </div>
    );
  }

  return (
    <div className="label-manager">
      <div className="label-manager__header">
        <h3 className="label-manager__title">Labels</h3>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowCreateModal(true)}
        >
          Create Label
        </Button>
      </div>

      {labels && labels.length > 0 ? (
        <div className="label-manager__list">
          {labels.map((label) => (
            <div key={label.id} className="label-manager__item">
              <Label
                label={label}
                onClick={() => setEditingLabel(label)}
                size="md"
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="label-manager__empty">
          <p>No labels yet. Create one to get started!</p>
        </div>
      )}

      <CreateLabelModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        boardId={boardId}
      />

      {editingLabel && (
        <EditLabelModal
          isOpen={!!editingLabel}
          onClose={() => setEditingLabel(null)}
          label={editingLabel}
        />
      )}
    </div>
  );
};

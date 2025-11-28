import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { useUpdateLabel, useDeleteLabel } from '../../hooks/useLabels';
import { Label as LabelType } from '../../types';
import { ConfirmDialog } from '../common/ConfirmDialog';
import './EditLabelModal.css';

export interface EditLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  label: LabelType;
}

const LABEL_COLORS = [
  { name: 'Green', value: '#61bd4f' },
  { name: 'Yellow', value: '#f2d600' },
  { name: 'Orange', value: '#ff9f1a' },
  { name: 'Red', value: '#eb5a46' },
  { name: 'Purple', value: '#c377e0' },
  { name: 'Blue', value: '#0079bf' },
  { name: 'Sky', value: '#00c2e0' },
  { name: 'Lime', value: '#51e898' },
  { name: 'Pink', value: '#ff78cb' },
  { name: 'Black', value: '#344563' },
];

/**
 * Modal for editing existing labels
 * Implements Requirements 10.2, 10.3
 */
export const EditLabelModal: React.FC<EditLabelModalProps> = ({
  isOpen,
  onClose,
  label
}) => {
  const [name, setName] = useState(label.name);
  const [selectedColor, setSelectedColor] = useState(label.color);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const updateLabel = useUpdateLabel();
  const deleteLabel = useDeleteLabel();

  useEffect(() => {
    if (isOpen) {
      setName(label.name);
      setSelectedColor(label.color);
      setError('');
    }
  }, [isOpen, label]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Label name is required');
      return;
    }

    if (name.length > 50) {
      setError('Label name must be 50 characters or less');
      return;
    }

    try {
      await updateLabel.mutateAsync({
        id: label.id,
        data: {
          name: name.trim(),
          color: selectedColor
        }
      });
      onClose();
    } catch (err) {
      setError('Failed to update label');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteLabel.mutateAsync(label.id);
      setShowDeleteConfirm(false);
      onClose();
    } catch (err) {
      setError('Failed to delete label');
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Edit Label"
        size="sm"
      >
        <form onSubmit={handleSubmit} className="edit-label-form">
          <div className="form-group">
            <Input
              label="Label Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter label name"
              error={error}
              maxLength={50}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Color</label>
            <div className="color-picker">
              {LABEL_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  className={`color-option ${selectedColor === color.value ? 'color-option--selected' : ''}`}
                  style={{ backgroundColor: color.value }}
                  onClick={() => setSelectedColor(color.value)}
                  aria-label={`Select ${color.name} color`}
                  title={color.name}
                >
                  {selectedColor === color.value && (
                    <span className="color-option__check">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="label-preview">
            <label className="form-label">Preview</label>
            <div
              className="label-preview__item"
              style={{ backgroundColor: selectedColor }}
            >
              {name || 'Label name'}
            </div>
          </div>

          <div className="modal-actions">
            <Button
              type="button"
              variant="danger"
              onClick={() => setShowDeleteConfirm(true)}
            >
              Delete
            </Button>
            <div style={{ flex: 1 }} />
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={updateLabel.isPending}
              disabled={!name.trim()}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Label"
        message={`Are you sure you want to delete "${label.name}"? This will remove it from all cards.`}
        confirmText="Delete"
        confirmVariant="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        loading={deleteLabel.isPending}
      />
    </>
  );
};

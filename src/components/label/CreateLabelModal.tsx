import React, { useState, useMemo } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { useCreateLabel } from '../../hooks/useLabels';
import { validateLabelColor, getContrastingTextColor } from '../../utils/colorContrast';
import './CreateLabelModal.css';

export interface CreateLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  boardId: number;
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
 * Modal for creating new labels
 * Implements Requirement 10.1: Label creation succeeds with valid data
 */
export const CreateLabelModal: React.FC<CreateLabelModalProps> = ({
  isOpen,
  onClose,
  boardId
}) => {
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(LABEL_COLORS[0].value);
  const [error, setError] = useState('');

  const createLabel = useCreateLabel(boardId);

  // Calculate text color for preview
  const previewTextColor = useMemo(() => getContrastingTextColor(selectedColor), [selectedColor]);

  // Validate color contrast
  const colorValidation = useMemo(() => validateLabelColor(selectedColor), [selectedColor]);

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
      await createLabel.mutateAsync({
        name: name.trim(),
        color: selectedColor
      });
      handleClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to create label');
    }
  };

  const handleClose = () => {
    setName('');
    setSelectedColor(LABEL_COLORS[0].value);
    setError('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create Label"
      size="sm"
    >
      <form onSubmit={handleSubmit} className="create-label-form">
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
            style={{ backgroundColor: selectedColor, color: previewTextColor }}
          >
            {name || 'Label name'}
          </div>
          {!colorValidation.isValid && (
            <p className="color-warning" role="alert">
              ⚠️ This color may have insufficient contrast (ratio: {colorValidation.contrastRatio.toFixed(2)}:1)
            </p>
          )}
        </div>

        <div className="modal-actions">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={createLabel.isPending}
            disabled={!name.trim()}
          >
            Create Label
          </Button>
        </div>
      </form>
    </Modal>
  );
};

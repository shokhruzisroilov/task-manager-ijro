import React from 'react';
import { UploadProgress } from '../../types/models';
import './UploadProgressBar.css';

interface UploadProgressBarProps {
  upload: UploadProgress;
  onPause?: () => void;
  onResume?: () => void;
  onCancel?: () => void;
}

/**
 * UploadProgressBar Component
 * Displays upload progress with pause/resume/cancel controls
 * Requirements: 12.1
 */
export const UploadProgressBar: React.FC<UploadProgressBarProps> = ({
  upload,
  onPause,
  onResume,
  onCancel
}) => {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const getStatusText = (): string => {
    switch (upload.status) {
      case 'pending':
        return 'Pending...';
      case 'uploading':
        return 'Uploading...';
      case 'paused':
        return 'Paused';
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
      default:
        return '';
    }
  };

  const getStatusClass = (): string => {
    switch (upload.status) {
      case 'uploading':
        return 'upload-progress-bar--uploading';
      case 'paused':
        return 'upload-progress-bar--paused';
      case 'completed':
        return 'upload-progress-bar--completed';
      case 'failed':
        return 'upload-progress-bar--failed';
      default:
        return '';
    }
  };

  return (
    <div className={`upload-progress-bar ${getStatusClass()}`}>
      <div className="upload-progress-bar__header">
        <div className="upload-progress-bar__info">
          <span className="upload-progress-bar__filename" title={upload.fileName}>
            {upload.fileName}
          </span>
          <span className="upload-progress-bar__size">
            {formatFileSize(upload.uploadedBytes)} / {formatFileSize(upload.fileSize)}
          </span>
        </div>
        <div className="upload-progress-bar__controls">
          {upload.status === 'uploading' && onPause && (
            <button
              type="button"
              className="upload-progress-bar__button"
              onClick={onPause}
              aria-label="Pause upload"
              title="Pause"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="4" y="3" width="3" height="10" fill="currentColor" />
                <rect x="9" y="3" width="3" height="10" fill="currentColor" />
              </svg>
            </button>
          )}
          {upload.status === 'paused' && onResume && (
            <button
              type="button"
              className="upload-progress-bar__button"
              onClick={onResume}
              aria-label="Resume upload"
              title="Resume"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M5 3L12 8L5 13V3Z" fill="currentColor" />
              </svg>
            </button>
          )}
          {(upload.status === 'uploading' || upload.status === 'paused') && onCancel && (
            <button
              type="button"
              className="upload-progress-bar__button upload-progress-bar__button--cancel"
              onClick={onCancel}
              aria-label="Cancel upload"
              title="Cancel"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M4 4L12 12M12 4L4 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="upload-progress-bar__progress-container">
        <div
          className="upload-progress-bar__progress-fill"
          style={{ width: `${upload.progress}%` }}
          role="progressbar"
          aria-valuenow={Math.round(upload.progress)}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>

      <div className="upload-progress-bar__footer">
        <span className="upload-progress-bar__status">{getStatusText()}</span>
        <span className="upload-progress-bar__percentage">
          {Math.round(upload.progress)}%
        </span>
      </div>

      {upload.error && (
        <div className="upload-progress-bar__error">
          {upload.error}
        </div>
      )}
    </div>
  );
};

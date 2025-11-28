import { useRef } from 'react';
import { useResumableUpload } from '../../hooks/useResumableUpload';
import { Button } from '../common/Button';
import { UploadProgressBar } from './UploadProgressBar';
import type { Attachment } from '../../types/models';

interface ResumableUploadButtonProps {
  cardId: number;
  onSuccess?: (attachment: Attachment) => void;
  onError?: (error: Error) => void;
  disabled?: boolean;
}

export const ResumableUploadButton: React.FC<ResumableUploadButtonProps> = ({
  cardId,
  onSuccess,
  onError,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    upload,
    cancel,
    reset,
    isUploading,
    progress,
    uploadedBytes,
    totalBytes,
    currentChunk,
    totalChunks,
    error,
  } = useResumableUpload({
    cardId,
    onSuccess: (attachment) => {
      reset();
      onSuccess?.(attachment);
    },
    onError: (err) => {
      onError?.(err);
    },
  });

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await upload(file);
    } catch (err) {
      console.error('Upload failed:', err);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleButtonClick = () => {
    if (isUploading) {
      cancel();
    } else {
      fileInputRef.current?.click();
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  return (
    <div className="resumable-upload-button">
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        disabled={disabled || isUploading}
      />

      <Button
        onClick={handleButtonClick}
        disabled={disabled}
        variant={isUploading ? 'secondary' : 'primary'}
        size="sm"
      >
        {isUploading ? 'Cancel Upload' : 'Upload File'}
      </Button>

      {isUploading && (
        <div className="upload-progress-container">
          <div className="simple-progress-bar">
            <div
              className="simple-progress-fill"
              style={{ width: `${progress}%` }}
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          <div className="upload-stats">
            <span className="upload-bytes">
              {formatBytes(uploadedBytes)} / {formatBytes(totalBytes)}
            </span>
            {totalChunks > 0 && (
              <span className="upload-chunks">
                Chunk {currentChunk} / {totalChunks}
              </span>
            )}
            <span className="upload-percentage">{progress}%</span>
          </div>
        </div>
      )}

      {error && (
        <div className="upload-error">
          <span className="error-icon">⚠️</span>
          <span className="error-message">{error}</span>
        </div>
      )}
    </div>
  );
};

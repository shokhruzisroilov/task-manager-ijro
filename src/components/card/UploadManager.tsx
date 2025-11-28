import React from 'react';
import { UploadProgress } from '../../types/models';
import { UploadProgressBar } from './UploadProgressBar';
import './UploadManager.css';

interface UploadManagerProps {
  uploads: UploadProgress[];
  onPause: (uploadId: string) => void;
  onResume: (uploadId: string) => void;
  onCancel: (uploadId: string) => void;
}

/**
 * UploadManager Component
 * Manages multiple file uploads with progress tracking
 * Requirements: 12.1
 */
export const UploadManager: React.FC<UploadManagerProps> = ({
  uploads,
  onPause,
  onResume,
  onCancel
}) => {
  if (uploads.length === 0) {
    return null;
  }

  const activeUploads = uploads.filter(
    u => u.status !== 'completed' && u.status !== 'failed'
  );
  const completedUploads = uploads.filter(u => u.status === 'completed');
  const failedUploads = uploads.filter(u => u.status === 'failed');

  return (
    <div className="upload-manager">
      <div className="upload-manager__header">
        <h3 className="upload-manager__title">
          Uploads
          {activeUploads.length > 0 && (
            <span className="upload-manager__count">
              {activeUploads.length} active
            </span>
          )}
        </h3>
      </div>

      <div className="upload-manager__list">
        {/* Active uploads */}
        {activeUploads.map(upload => (
          <UploadProgressBar
            key={upload.uploadId}
            upload={upload}
            onPause={() => onPause(upload.uploadId)}
            onResume={() => onResume(upload.uploadId)}
            onCancel={() => onCancel(upload.uploadId)}
          />
        ))}

        {/* Failed uploads */}
        {failedUploads.map(upload => (
          <UploadProgressBar
            key={upload.uploadId}
            upload={upload}
            onCancel={() => onCancel(upload.uploadId)}
          />
        ))}

        {/* Recently completed uploads (shown briefly) */}
        {completedUploads.slice(0, 3).map(upload => (
          <UploadProgressBar
            key={upload.uploadId}
            upload={upload}
          />
        ))}
      </div>
    </div>
  );
};

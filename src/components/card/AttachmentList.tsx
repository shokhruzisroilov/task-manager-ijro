import React, { useState } from 'react';
import { Attachment } from '../../types/models';
import { useAttachments, useDeleteAttachment } from '../../hooks/useAttachments';
import { ConfirmDialog } from '../common';
import { ResumableUploadButton } from './ResumableUploadButton';
import './AttachmentList.css';

interface AttachmentListProps {
  cardId: number;
}

/**
 * AttachmentList Component
 * Displays list of attachments with download and delete functionality
 * Requirements: 12.4, 12.5
 */
export const AttachmentList: React.FC<AttachmentListProps> = ({
  cardId
}) => {
  const { data: attachments = [], isLoading } = useAttachments(cardId);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const deleteAttachment = useDeleteAttachment();

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
  };

  const getFileIcon = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf':
        return '📄';
      case 'doc':
      case 'docx':
        return '📝';
      case 'xls':
      case 'xlsx':
        return '📊';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return '🖼️';
      case 'zip':
      case 'rar':
        return '📦';
      default:
        return '📎';
    }
  };

  const handleDownload = (attachment: Attachment) => {
    window.open(attachment.fileUrl, '_blank');
  };

  const handleDeleteClick = (id: number) => {
    setDeleteId(id);
  };

  const handleDeleteConfirm = async () => {
    if (deleteId) {
      await deleteAttachment.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteId(null);
  };

  if (isLoading) {
    return (
      <div className="attachment-list">
        <p className="attachment-list__empty-message">Loading attachments...</p>
      </div>
    );
  }

  return (
    <>
      <div className="attachment-list">
        <div className="attachment-list__header">
          <ResumableUploadButton cardId={cardId} />
        </div>

        {attachments.length === 0 ? (
          <p className="attachment-list__empty-message">No attachments yet</p>
        ) : (
          <div className="attachment-list__items">
            {attachments.map(attachment => (
            <div key={attachment.id} className="attachment-item">
              <div className="attachment-item__icon">
                {getFileIcon(attachment.fileName)}
              </div>
              <div className="attachment-item__info">
                <div className="attachment-item__name" title={attachment.fileName}>
                  {attachment.fileName}
                </div>
                <div className="attachment-item__meta">
                  <span className="attachment-item__size">
                    {formatFileSize(attachment.fileSize)}
                  </span>
                  <span className="attachment-item__separator">•</span>
                  <span className="attachment-item__date">
                    {formatDate(attachment.createdAt)}
                  </span>
                  <span className="attachment-item__separator">•</span>
                  <span className="attachment-item__uploader">
                    {attachment.uploaderName}
                  </span>
                </div>
              </div>
              <div className="attachment-item__actions">
                <button
                  type="button"
                  className="attachment-item__button"
                  onClick={() => handleDownload(attachment)}
                  aria-label="Download attachment"
                  title="Download"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M8 2V10M8 10L5 7M8 10L11 7M2 14H14"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  className="attachment-item__button attachment-item__button--delete"
                  onClick={() => handleDeleteClick(attachment.id)}
                  aria-label="Delete attachment"
                  title="Delete"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M3 4H13M5 4V3C5 2.44772 5.44772 2 6 2H10C10.5523 2 11 2.44772 11 3V4M6 7V11M10 7V11M4 4H12V13C12 13.5523 11.5523 14 11 14H5C4.44772 14 4 13.5523 4 13V4Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={deleteId !== null}
        title="Delete Attachment"
        message="Are you sure you want to delete this attachment? This action cannot be undone."
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </>
  );
};

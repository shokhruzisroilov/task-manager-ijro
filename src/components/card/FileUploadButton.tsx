import React, { useRef } from 'react';
import './FileUploadButton.css';

interface FileUploadButtonProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
  accept?: string;
}

/**
 * FileUploadButton Component
 * Button for selecting files to upload
 * Requirements: 12.1
 */
export const FileUploadButton: React.FC<FileUploadButtonProps> = ({
  onFileSelect,
  disabled = false,
  accept = '*/*'
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file);
      // Reset input so same file can be selected again
      event.target.value = '';
    }
  };

  return (
    <>
      <button
        type="button"
        className="file-upload-button"
        onClick={handleClick}
        disabled={disabled}
        aria-label="Upload file"
      >
        <svg
          className="file-upload-button__icon"
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M8 2V14M2 8H14"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
        <span>Attach File</span>
      </button>
      <input
        ref={fileInputRef}
        type="file"
        className="file-upload-button__input"
        onChange={handleFileChange}
        accept={accept}
        aria-hidden="true"
      />
    </>
  );
};

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FileUploadButton } from '../components/card/FileUploadButton';
import { UploadProgressBar } from '../components/card/UploadProgressBar';
import { UploadManager } from '../components/card/UploadManager';
import { AttachmentList } from '../components/card/AttachmentList';
import { UploadProgress, Attachment } from '../types/models';

/**
 * Unit tests for upload system components
 * Requirements: 12.1, 12.2, 12.3
 */

describe('Upload System Unit Tests', () => {
  describe('FileUploadButton', () => {
    it('should render upload button', () => {
      const onFileSelect = vi.fn();
      render(<FileUploadButton onFileSelect={onFileSelect} />);
      
      expect(screen.getByRole('button', { name: /upload file/i })).toBeInTheDocument();
    });

    it('should call onFileSelect when file is selected', async () => {
      const onFileSelect = vi.fn();
      render(<FileUploadButton onFileSelect={onFileSelect} />);
      
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      Object.defineProperty(input, 'files', {
        value: [file],
        writable: false
      });
      
      fireEvent.change(input);
      
      await waitFor(() => {
        expect(onFileSelect).toHaveBeenCalledWith(file);
      });
    });

    it('should be disabled when disabled prop is true', () => {
      const onFileSelect = vi.fn();
      render(<FileUploadButton onFileSelect={onFileSelect} disabled={true} />);
      
      const button = screen.getByRole('button', { name: /upload file/i });
      expect(button).toBeDisabled();
    });

    it('should accept specific file types', () => {
      const onFileSelect = vi.fn();
      render(<FileUploadButton onFileSelect={onFileSelect} accept=".pdf,.doc" />);
      
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(input).toHaveAttribute('accept', '.pdf,.doc');
    });
  });

  describe('UploadProgressBar', () => {
    const mockUpload: UploadProgress = {
      uploadId: 'test-123',
      fileName: 'test.pdf',
      fileSize: 1024 * 1024, // 1MB
      uploadedBytes: 512 * 1024, // 512KB
      progress: 50,
      status: 'uploading'
    };

    it('should display file name and progress', () => {
      render(<UploadProgressBar upload={mockUpload} />);
      
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('should display file size correctly', () => {
      render(<UploadProgressBar upload={mockUpload} />);
      
      expect(screen.getByText(/512\.0 KB/)).toBeInTheDocument();
      expect(screen.getByText(/1\.0 MB/)).toBeInTheDocument();
    });

    it('should show pause button when uploading', () => {
      const onPause = vi.fn();
      render(<UploadProgressBar upload={mockUpload} onPause={onPause} />);
      
      const pauseButton = screen.getByRole('button', { name: /pause upload/i });
      expect(pauseButton).toBeInTheDocument();
      
      fireEvent.click(pauseButton);
      expect(onPause).toHaveBeenCalled();
    });

    it('should show resume button when paused', () => {
      const pausedUpload = { ...mockUpload, status: 'paused' as const };
      const onResume = vi.fn();
      render(<UploadProgressBar upload={pausedUpload} onResume={onResume} />);
      
      const resumeButton = screen.getByRole('button', { name: /resume upload/i });
      expect(resumeButton).toBeInTheDocument();
      
      fireEvent.click(resumeButton);
      expect(onResume).toHaveBeenCalled();
    });

    it('should show cancel button', () => {
      const onCancel = vi.fn();
      render(<UploadProgressBar upload={mockUpload} onCancel={onCancel} />);
      
      const cancelButton = screen.getByRole('button', { name: /cancel upload/i });
      expect(cancelButton).toBeInTheDocument();
      
      fireEvent.click(cancelButton);
      expect(onCancel).toHaveBeenCalled();
    });

    it('should display error message when upload fails', () => {
      const failedUpload = {
        ...mockUpload,
        status: 'failed' as const,
        error: 'Upload failed due to network error'
      };
      render(<UploadProgressBar upload={failedUpload} />);
      
      expect(screen.getByText(/Upload failed due to network error/i)).toBeInTheDocument();
    });

    it('should show completed status', () => {
      const completedUpload = { ...mockUpload, status: 'completed' as const, progress: 100 };
      render(<UploadProgressBar upload={completedUpload} />);
      
      expect(screen.getByText('Completed')).toBeInTheDocument();
      expect(screen.getByText('100%')).toBeInTheDocument();
    });
  });

  describe('UploadManager', () => {
    const mockUploads: UploadProgress[] = [
      {
        uploadId: 'upload-1',
        fileName: 'file1.pdf',
        fileSize: 1024 * 1024,
        uploadedBytes: 512 * 1024,
        progress: 50,
        status: 'uploading'
      },
      {
        uploadId: 'upload-2',
        fileName: 'file2.pdf',
        fileSize: 2048 * 1024,
        uploadedBytes: 1024 * 1024,
        progress: 50,
        status: 'paused'
      }
    ];

    it('should display all active uploads', () => {
      const onPause = vi.fn();
      const onResume = vi.fn();
      const onCancel = vi.fn();
      
      render(
        <UploadManager
          uploads={mockUploads}
          onPause={onPause}
          onResume={onResume}
          onCancel={onCancel}
        />
      );
      
      expect(screen.getByText('file1.pdf')).toBeInTheDocument();
      expect(screen.getByText('file2.pdf')).toBeInTheDocument();
      expect(screen.getByText('2 active')).toBeInTheDocument();
    });

    it('should not render when no uploads', () => {
      const { container } = render(
        <UploadManager
          uploads={[]}
          onPause={vi.fn()}
          onResume={vi.fn()}
          onCancel={vi.fn()}
        />
      );
      
      expect(container.firstChild).toBeNull();
    });

    it('should handle pause action', () => {
      const onPause = vi.fn();
      render(
        <UploadManager
          uploads={mockUploads}
          onPause={onPause}
          onResume={vi.fn()}
          onCancel={vi.fn()}
        />
      );
      
      const pauseButtons = screen.getAllByRole('button', { name: /pause upload/i });
      fireEvent.click(pauseButtons[0]);
      
      expect(onPause).toHaveBeenCalledWith('upload-1');
    });

    it('should handle resume action', () => {
      const onResume = vi.fn();
      render(
        <UploadManager
          uploads={mockUploads}
          onPause={vi.fn()}
          onResume={onResume}
          onCancel={vi.fn()}
        />
      );
      
      const resumeButton = screen.getByRole('button', { name: /resume upload/i });
      fireEvent.click(resumeButton);
      
      expect(onResume).toHaveBeenCalledWith('upload-2');
    });

    it('should handle cancel action', () => {
      const onCancel = vi.fn();
      render(
        <UploadManager
          uploads={mockUploads}
          onPause={vi.fn()}
          onResume={vi.fn()}
          onCancel={onCancel}
        />
      );
      
      const cancelButtons = screen.getAllByRole('button', { name: /cancel upload/i });
      fireEvent.click(cancelButtons[0]);
      
      expect(onCancel).toHaveBeenCalledWith('upload-1');
    });
  });

  describe('AttachmentList', () => {
    const mockAttachments: Attachment[] = [
      {
        id: 1,
        fileName: 'document.pdf',
        fileUrl: 'http://example.com/document.pdf',
        fileSize: 1024 * 1024,
        cardId: 1,
        uploadedBy: 1,
        uploaderName: 'John Doe',
        createdAt: new Date().toISOString()
      },
      {
        id: 2,
        fileName: 'image.png',
        fileUrl: 'http://example.com/image.png',
        fileSize: 512 * 1024,
        cardId: 1,
        uploadedBy: 2,
        uploaderName: 'Jane Smith',
        createdAt: new Date(Date.now() - 86400000).toISOString() // 1 day ago
      }
    ];

    it('should display all attachments', () => {
      render(<AttachmentList attachments={mockAttachments} cardId={1} />);
      
      expect(screen.getByText('document.pdf')).toBeInTheDocument();
      expect(screen.getByText('image.png')).toBeInTheDocument();
      expect(screen.getByText('Attachments (2)')).toBeInTheDocument();
    });

    it('should display file sizes correctly', () => {
      render(<AttachmentList attachments={mockAttachments} cardId={1} />);
      
      expect(screen.getByText(/1\.0 MB/)).toBeInTheDocument();
      expect(screen.getByText(/512\.0 KB/)).toBeInTheDocument();
    });

    it('should display uploader names', () => {
      render(<AttachmentList attachments={mockAttachments} cardId={1} />);
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    it('should show empty state when no attachments', () => {
      render(<AttachmentList attachments={[]} cardId={1} />);
      
      expect(screen.getByText('No attachments yet')).toBeInTheDocument();
    });

    it('should have download buttons for each attachment', () => {
      render(<AttachmentList attachments={mockAttachments} cardId={1} />);
      
      const downloadButtons = screen.getAllByRole('button', { name: /download attachment/i });
      expect(downloadButtons).toHaveLength(2);
    });

    it('should have delete buttons for each attachment', () => {
      render(<AttachmentList attachments={mockAttachments} cardId={1} />);
      
      const deleteButtons = screen.getAllByRole('button', { name: /delete attachment/i });
      expect(deleteButtons).toHaveLength(2);
    });

    it('should show confirmation dialog when delete is clicked', async () => {
      render(<AttachmentList attachments={mockAttachments} cardId={1} />);
      
      const deleteButtons = screen.getAllByRole('button', { name: /delete attachment/i });
      fireEvent.click(deleteButtons[0]);
      
      await waitFor(() => {
        expect(screen.getByText('Delete Attachment')).toBeInTheDocument();
        expect(screen.getByText(/Are you sure you want to delete this attachment/i)).toBeInTheDocument();
      });
    });
  });

  describe('File size formatting', () => {
    it('should format bytes correctly', () => {
      const testCases = [
        { bytes: 0, expected: '0 B' },
        { bytes: 500, expected: '500 B' },
        { bytes: 1024, expected: '1.0 KB' },
        { bytes: 1024 * 1024, expected: '1.0 MB' },
        { bytes: 1024 * 1024 * 1024, expected: '1.0 GB' },
        { bytes: 1536 * 1024, expected: '1.5 MB' }
      ];

      testCases.forEach(({ bytes, expected }) => {
        const upload: UploadProgress = {
          uploadId: 'test',
          fileName: 'test.pdf',
          fileSize: bytes,
          uploadedBytes: 0,
          progress: 0,
          status: 'pending'
        };
        
        const { container } = render(<UploadProgressBar upload={upload} />);
        expect(container.textContent).toContain(expected);
      });
    });
  });

  describe('Progress calculation', () => {
    it('should display correct progress percentage', () => {
      const testCases = [
        { uploaded: 0, total: 1000, expected: 0 },
        { uploaded: 250, total: 1000, expected: 25 },
        { uploaded: 500, total: 1000, expected: 50 },
        { uploaded: 750, total: 1000, expected: 75 },
        { uploaded: 1000, total: 1000, expected: 100 }
      ];

      testCases.forEach(({ uploaded, total, expected }) => {
        const upload: UploadProgress = {
          uploadId: 'test',
          fileName: 'test.pdf',
          fileSize: total,
          uploadedBytes: uploaded,
          progress: expected,
          status: 'uploading'
        };
        
        render(<UploadProgressBar upload={upload} />);
        expect(screen.getByText(`${expected}%`)).toBeInTheDocument();
      });
    });
  });
});

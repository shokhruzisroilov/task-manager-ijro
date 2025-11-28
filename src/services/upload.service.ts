import { apiClient } from '../api/client';
import { UploadProgress } from '../types/models';

/**
 * Upload state stored in IndexedDB
 */
interface UploadState {
  uploadId: string;
  fileName: string;
  fileSize: number;
  cardId: number;
  totalChunks: number;
  uploadedChunks: number;
  status: 'pending' | 'uploading' | 'paused' | 'completed' | 'failed';
  error?: string;
  file?: File; // Store file reference for resumption
}

/**
 * ResumableUploadService
 * Implements chunked file upload with state persistence and retry logic
 * Requirements: 12.1, 12.2
 */
export class ResumableUploadService {
  private readonly CHUNK_SIZE = 1024 * 1024; // 1MB chunks
  private readonly MAX_RETRIES = 3;
  private readonly DB_NAME = 'trello-uploads';
  private readonly DB_VERSION = 1;
  private readonly STORE_NAME = 'uploads';
  private db: IDBDatabase | null = null;
  private activeUploads: Map<string, AbortController> = new Map();

  constructor() {
    this.initDB();
  }

  /**
   * Initialize IndexedDB for upload state persistence
   */
  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          db.createObjectStore(this.STORE_NAME, { keyPath: 'uploadId' });
        }
      };
    });
  }

  /**
   * Ensure DB is initialized
   */
  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.initDB();
    }
    return this.db!;
  }

  /**
   * Generate a unique upload ID
   */
  private generateUploadId(): string {
    return `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Start a new resumable upload
   * @param file - File to upload
   * @param cardId - Card ID to attach file to
   * @returns Upload ID
   */
  async startUpload(file: File, cardId: number): Promise<string> {
    const uploadId = this.generateUploadId();
    const totalChunks = Math.ceil(file.size / this.CHUNK_SIZE);

    // Save upload state
    const state: UploadState = {
      uploadId,
      fileName: file.name,
      fileSize: file.size,
      cardId,
      totalChunks,
      uploadedChunks: 0,
      status: 'pending',
      file
    };

    await this.saveUploadState(state);

    // Start uploading chunks in background
    this.uploadChunks(uploadId, file).catch((error) => {
      console.error('Upload failed:', error);
      this.updateUploadState(uploadId, {
        status: 'failed',
        error: error.message
      });
    });

    return uploadId;
  }

  /**
   * Upload file chunks
   * @param uploadId - Upload ID
   * @param file - File to upload
   */
  private async uploadChunks(uploadId: string, file: File): Promise<void> {
    const state = await this.getUploadState(uploadId);
    if (!state) {
      throw new Error('Upload state not found');
    }

    await this.updateUploadState(uploadId, { status: 'uploading' });

    const startChunk = state.uploadedChunks;
    const abortController = new AbortController();
    this.activeUploads.set(uploadId, abortController);

    try {
      for (let i = startChunk; i < state.totalChunks; i++) {
        // Check if upload was paused
        const currentState = await this.getUploadState(uploadId);
        if (currentState?.status === 'paused') {
          break;
        }

        const chunk = this.getChunk(file, i);
        await this.uploadChunk(uploadId, i, chunk, state.totalChunks, abortController.signal);

        // Update progress
        await this.updateProgress(uploadId, i + 1);
      }

      // Check if all chunks uploaded
      const finalState = await this.getUploadState(uploadId);
      if (finalState && finalState.uploadedChunks === finalState.totalChunks) {
        await this.finalizeUpload(uploadId);
      }
    } finally {
      this.activeUploads.delete(uploadId);
    }
  }

  /**
   * Get a chunk from the file
   * @param file - File to chunk
   * @param chunkIndex - Index of chunk
   * @returns Blob chunk
   */
  private getChunk(file: File, chunkIndex: number): Blob {
    const start = chunkIndex * this.CHUNK_SIZE;
    const end = Math.min(start + this.CHUNK_SIZE, file.size);
    return file.slice(start, end);
  }

  /**
   * Upload a single chunk with retry logic
   * @param uploadId - Upload ID
   * @param chunkIndex - Index of chunk
   * @param chunk - Chunk data
   * @param totalChunks - Total number of chunks
   * @param signal - Abort signal
   */
  private async uploadChunk(
    uploadId: string,
    chunkIndex: number,
    chunk: Blob,
    totalChunks: number,
    signal: AbortSignal
  ): Promise<void> {
    const formData = new FormData();
    formData.append('uploadId', uploadId);
    formData.append('chunkIndex', chunkIndex.toString());
    formData.append('totalChunks', totalChunks.toString());
    formData.append('chunk', chunk);

    let retries = 0;
    while (retries < this.MAX_RETRIES) {
      try {
        await apiClient.post('/api/upload/chunk', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          signal
        });
        return;
      } catch (error: any) {
        if (signal.aborted) {
          throw new Error('Upload cancelled');
        }

        retries++;
        if (retries >= this.MAX_RETRIES) {
          throw new Error(`Failed to upload chunk ${chunkIndex} after ${this.MAX_RETRIES} retries`);
        }

        // Exponential backoff
        const delay = Math.pow(2, retries) * 1000;
        await this.delay(delay);
      }
    }
  }

  /**
   * Update upload progress
   * @param uploadId - Upload ID
   * @param uploadedChunks - Number of uploaded chunks
   */
  private async updateProgress(uploadId: string, uploadedChunks: number): Promise<void> {
    await this.updateUploadState(uploadId, { uploadedChunks });
  }

  /**
   * Finalize upload after all chunks are uploaded
   * @param uploadId - Upload ID
   */
  private async finalizeUpload(uploadId: string): Promise<void> {
    const state = await this.getUploadState(uploadId);
    if (!state) {
      throw new Error('Upload state not found');
    }

    try {
      // Call backend to finalize upload
      await apiClient.post('/api/upload/finalize', {
        uploadId,
        cardId: state.cardId,
        fileName: state.fileName,
        fileSize: state.fileSize
      });

      await this.updateUploadState(uploadId, { status: 'completed' });

      // Clean up after a delay
      setTimeout(() => {
        this.cleanupUpload(uploadId);
      }, 5000);
    } catch (error: any) {
      await this.updateUploadState(uploadId, {
        status: 'failed',
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Pause an active upload
   * @param uploadId - Upload ID
   */
  async pauseUpload(uploadId: string): Promise<void> {
    // Abort the active upload
    const abortController = this.activeUploads.get(uploadId);
    if (abortController) {
      abortController.abort();
      this.activeUploads.delete(uploadId);
    }

    await this.updateUploadState(uploadId, { status: 'paused' });
  }

  /**
   * Resume a paused upload
   * @param uploadId - Upload ID
   */
  async resumeUpload(uploadId: string): Promise<void> {
    const state = await this.getUploadState(uploadId);
    if (!state) {
      throw new Error('Upload state not found');
    }

    if (!state.file) {
      throw new Error('File not found in upload state');
    }

    await this.updateUploadState(uploadId, { status: 'uploading' });

    // Resume uploading chunks
    this.uploadChunks(uploadId, state.file).catch((error) => {
      console.error('Resume upload failed:', error);
      this.updateUploadState(uploadId, {
        status: 'failed',
        error: error.message
      });
    });
  }

  /**
   * Cancel an upload
   * @param uploadId - Upload ID
   */
  async cancelUpload(uploadId: string): Promise<void> {
    // Abort the active upload
    const abortController = this.activeUploads.get(uploadId);
    if (abortController) {
      abortController.abort();
      this.activeUploads.delete(uploadId);
    }

    await this.cleanupUpload(uploadId);
  }

  /**
   * Get upload progress
   * @param uploadId - Upload ID
   * @returns Upload progress
   */
  async getProgress(uploadId: string): Promise<UploadProgress | null> {
    const state = await this.getUploadState(uploadId);
    if (!state) {
      return null;
    }

    const uploadedBytes = state.uploadedChunks * this.CHUNK_SIZE;
    const progress = (state.uploadedChunks / state.totalChunks) * 100;

    return {
      uploadId: state.uploadId,
      fileName: state.fileName,
      fileSize: state.fileSize,
      uploadedBytes: Math.min(uploadedBytes, state.fileSize),
      progress: Math.min(progress, 100),
      status: state.status,
      error: state.error
    };
  }

  /**
   * Get all active uploads
   * @returns Array of upload progress
   */
  async getAllUploads(): Promise<UploadProgress[]> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.STORE_NAME, 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.getAll();

      request.onsuccess = async () => {
        const states = request.result as UploadState[];
        const progresses = await Promise.all(
          states.map(state => this.getProgress(state.uploadId))
        );
        resolve(progresses.filter(p => p !== null) as UploadProgress[]);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Save upload state to IndexedDB
   * @param state - Upload state
   */
  private async saveUploadState(state: UploadState): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.STORE_NAME, 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.put(state);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get upload state from IndexedDB
   * @param uploadId - Upload ID
   * @returns Upload state
   */
  private async getUploadState(uploadId: string): Promise<UploadState | null> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.STORE_NAME, 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.get(uploadId);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Update upload state in IndexedDB
   * @param uploadId - Upload ID
   * @param updates - Partial state updates
   */
  private async updateUploadState(
    uploadId: string,
    updates: Partial<UploadState>
  ): Promise<void> {
    const state = await this.getUploadState(uploadId);
    if (!state) {
      throw new Error('Upload state not found');
    }

    await this.saveUploadState({ ...state, ...updates });
  }

  /**
   * Clean up upload state
   * @param uploadId - Upload ID
   */
  private async cleanupUpload(uploadId: string): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.STORE_NAME, 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.delete(uploadId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delay helper for exponential backoff
   * @param ms - Milliseconds to delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const uploadService = new ResumableUploadService();

// Export all storage functionality
export * from './r2';
export * from './upload';
export * from './download';

// Export storage types
export type StorageBucket = 'AUDIO' | 'TRANSCRIPTS' | 'TRANSLATIONS' | 'SUMMARIES';

export interface StorageFile {
  key: string;
  filename: string;
  contentType: string;
  size: number;
  metadata?: Record<string, string>;
  url?: string;
}

export interface UploadResult {
  success: boolean;
  key?: string;
  error?: string;
  url?: string;
  file?: StorageFile;
}

export interface DownloadResult {
  success: boolean;
  url?: string;
  data?: Buffer;
  contentType?: string;
  metadata?: Record<string, string>;
  error?: string;
}

// Export constants with storage configuratioon
export const STORAGE_CONFIG = {
  allowedMimeTypes: {
    AUDIO: [
      'audio/mpeg',
      'audio/mp4',
      'audio/wav',
      'audio/x-wav',
      'audio/vnd.wav',
      'audio/ogg',
      'audio/vorbis',
      'audio/webm',
      'audio/flac',
    ],
    TRANSCRIPTS: ['application/json', 'text/plain'],
    TRANSLATIONS: ['text/plain'],
    SUMMARIES: ['text/plain'],
  },
  maxFileSize: {
    AUDIO: {
      free: 25 * 1024 * 1024, // 25MB
      pro: 100 * 1024 * 1024, // 100MB
      business: 500 * 1024 * 1024, // 500MB
    },
  },
}; 
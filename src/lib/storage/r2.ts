import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Environment variables
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const accessKeyId = process.env.CLOUDFLARE_ACCESS_KEY_ID;
const secretAccessKey = process.env.CLOUDFLARE_SECRET_ACCESS_KEY;
const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME;

// Validate required environment variables
if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
  console.error('Missing required Cloudflare R2 environment variables');
}

// Create the S3 client with Cloudflare R2 endpoint
export const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: accessKeyId || '',
    secretAccessKey: secretAccessKey || '',
  },
});

// Export constants for easy access
export const R2_BUCKET_NAME = bucketName || '';

// Define storage buckets for different content types
export const STORAGE_BUCKETS = {
  AUDIO: 'audio',
  TRANSCRIPTS: 'transcripts',
  TRANSLATIONS: 'translations',
  SUMMARIES: 'summaries',
};

// Define allowed MIME types for audio uploads
export const ALLOWED_AUDIO_MIME_TYPES = [
  'audio/mpeg', // MP3
  'audio/mp4', // M4A
  'audio/wav', // WAV
  'audio/x-wav', // WAV
  'audio/vnd.wav', // WAV
  'audio/ogg', // OGG
  'audio/vorbis', // OGG
  'audio/webm', // WEBM
  'audio/flac', // FLAC
];

// Define maximum file size (in bytes) - 100MB
export const MAX_FILE_SIZE = 100 * 1024 * 1024;

/**
 * R2 Storage Class
 * Singleton class for simplified R2 interactions
 */
export class R2 {
  private static instance: R2;
  private client: S3Client;
  private bucket: string;

  private constructor() {
    this.client = r2Client;
    this.bucket = R2_BUCKET_NAME;
  }

  /**
   * Get singleton instance of R2 class
   */
  public static async getInstance(): Promise<R2> {
    if (!R2.instance) {
      R2.instance = new R2();
    }
    return R2.instance;
  }

  /**
   * Generate a presigned URL for uploading or downloading a file
   * 
   * @param method The HTTP method (PUT for upload, GET for download)
   * @param key The storage key of the file
   * @param expiresIn URL expiration time in seconds (default: 3600 - 1 hour)
   * @param contentType Content type for uploads
   * @param metadata Optional metadata for the file
   * @returns Presigned URL
   */
  public async getPresignedUrl(
    method: 'GET' | 'PUT',
    key: string,
    expiresIn: number = 3600,
    contentType?: string,
    metadata?: Record<string, string>
  ): Promise<string> {
    const command = method === 'GET' 
      ? new GetObjectCommand({ Bucket: this.bucket, Key: key })
      : new PutObjectCommand({ 
          Bucket: this.bucket, 
          Key: key,
          ContentType: contentType,
          Metadata: metadata,
        });
    
    return await getSignedUrl(this.client, command, { expiresIn });
  }
} 
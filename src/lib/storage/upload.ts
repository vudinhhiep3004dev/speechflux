import { 
  PutObjectCommand,
  GetObjectCommand, 
  DeleteObjectCommand,
  HeadObjectCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { r2Client, R2_BUCKET_NAME, STORAGE_BUCKETS, ALLOWED_AUDIO_MIME_TYPES, MAX_FILE_SIZE } from './r2';
import { createClient } from '@/utils/supabase/server';
import { R2 } from './r2';
import { addJobToQueue } from '@/lib/redis';

/**
 * Generates a unique key for storing an object in R2
 * @param userId - The ID of the user uploading the file
 * @param filename - The original filename
 * @param type - The type of content being stored (audio, transcript, etc.)
 * @returns A string representing the unique storage path
 */
export function generateStorageKey(
  userId: string,
  filename: string,
  type: keyof typeof STORAGE_BUCKETS = 'AUDIO'
): string {
  const timestamp = Date.now();
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  const bucket = STORAGE_BUCKETS[type];
  return `${bucket}/${userId}/${timestamp}-${sanitizedFilename}`;
}

/**
 * Validates a file before upload
 * @param file - The file to validate
 * @param type - The type of content being uploaded
 * @returns An object indicating validation success or failure
 */
export function validateFile(
  file: File,
  type: keyof typeof STORAGE_BUCKETS = 'AUDIO'
): { valid: boolean; message?: string } {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      message: `File size exceeds the maximum allowed size of ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
    };
  }

  // For audio files, validate MIME type
  if (type === 'AUDIO' && !ALLOWED_AUDIO_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      message: 'File type not supported. Please upload a valid audio file.',
    };
  }

  return { valid: true };
}

/**
 * Uploads a file to Cloudflare R2
 * @param file - The file to upload
 * @param userId - The ID of the user uploading the file
 * @param type - The type of content being uploaded
 * @returns An object with upload status and file information
 */
export async function uploadFile(
  file: File,
  userId: string,
  type: keyof typeof STORAGE_BUCKETS = 'AUDIO'
): Promise<{
  success: boolean;
  key?: string;
  error?: string;
  url?: string;
}> {
  try {
    // Validate the file
    const validation = validateFile(file, type);
    if (!validation.valid) {
      return { success: false, error: validation.message };
    }

    // Generate a unique key for the file
    const key = generateStorageKey(userId, file.name, type);
    
    // Read the file as ArrayBuffer
    const fileBuffer = await file.arrayBuffer();

    // Upload to R2
    await r2Client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        Body: Buffer.from(fileBuffer),
        ContentType: file.type,
        Metadata: {
          userId,
          originalFilename: file.name,
          fileType: type,
        },
      })
    );

    return {
      success: true,
      key,
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred',
    };
  }
}

/**
 * Generates a presigned URL for direct file uploads
 * @param userId - The ID of the user
 * @param filename - The original filename
 * @param contentType - The MIME type of the file
 * @param type - The type of content being uploaded
 * @param expiresIn - URL expiration time in seconds (default: 60 minutes)
 * @returns An object with the presigned URL and key
 */
export async function getPresignedUploadUrl(
  userId: string,
  filename: string,
  contentType: string,
  type: keyof typeof STORAGE_BUCKETS = 'AUDIO',
  expiresIn = 3600
): Promise<{
  success: boolean;
  url?: string;
  key?: string;
  error?: string;
}> {
  try {
    // Generate a unique key for the file
    const key = generateStorageKey(userId, filename, type);

    // Get R2 instance and create a presigned URL for uploading
    const r2 = await R2.getInstance();
    const url = await r2.getPresignedUrl('PUT', key, expiresIn, contentType, {
      userId,
      originalFilename: filename,
      fileType: type,
    });

    return {
      success: true,
      url,
      key,
    };
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred',
    };
  }
}

/**
 * Creates a file record in the database after successful upload and enqueues processing job
 * @param userId - The ID of the user
 * @param key - The storage key of the file
 * @param filename - The original filename
 * @param fileSize - The size of the file in bytes
 * @param mimeType - The MIME type of the file
 * @param duration - The duration of the audio file (for audio files)
 * @returns The created file record
 */
export async function createFileRecord(
  userId: string,
  key: string,
  filename: string,
  fileSize: number,
  mimeType: string,
  duration?: number
) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('files')
    .insert({
      owner_id: userId,
      filename,
      file_path: key,
      file_size: fileSize,
      mime_type: mimeType,
      duration,
      status: 'pending',
      storage_bucket: key.split('/')[0],
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create file record: ${error.message}`);
  }

  // Generate a pre-signed URL for the audio file
  const r2 = await R2.getInstance();
  const audioUrl = await r2.getPresignedUrl('GET', key, 3600);

  // Enqueue the transcription job
  if (data) {
    try {
      await addJobToQueue('queue:transcription', {
        fileId: data.id,
        userId,
        audioUrl,
        language: 'auto' // Default to auto-detect
      });
      
      console.log(`Enqueued transcription job for file: ${data.id}`);
    } catch (queueError) {
      console.error('Failed to enqueue transcription job:', queueError);
      // Continue anyway - the file was created
    }
  }

  return data;
}

/**
 * Uploads a buffer directly to R2 storage
 * 
 * @param buffer - The buffer to upload
 * @param key - The storage key where to store the buffer
 * @param contentType - The MIME type of the content
 * @param metadata - Optional metadata to store with the file
 * @returns An object with upload status
 */
export async function uploadBuffer(
  buffer: Buffer,
  key: string,
  contentType: string,
  metadata?: Record<string, string>
): Promise<{
  success: boolean;
  key?: string;
  error?: string;
}> {
  try {
    // Upload to R2 using PutObjectCommand
    await r2Client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        Metadata: metadata,
      })
    );

    return {
      success: true,
      key,
    };
  } catch (error) {
    console.error('Error uploading buffer:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred',
    };
  }
} 
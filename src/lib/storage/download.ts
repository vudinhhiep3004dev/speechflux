import { 
  GetObjectCommand, 
  HeadObjectCommand,
  DeleteObjectCommand 
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { r2Client, R2_BUCKET_NAME } from './r2';
import { R2 } from '@/lib/storage/r2';
import type { DownloadResult } from '@/lib/storage';

/**
 * Retrieves an object from Cloudflare R2
 * @param key - The storage key of the file
 * @returns The file data and metadata
 */
export async function getObject(key: string) {
  try {
    const response = await r2Client.send(
      new GetObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
      })
    );

    // Convert the stream to a buffer
    const arrayBuffer = await response.Body?.transformToByteArray();
    
    if (!arrayBuffer) {
      throw new Error('Failed to retrieve file data');
    }

    return {
      data: Buffer.from(arrayBuffer),
      contentType: response.ContentType,
      metadata: response.Metadata,
    };
  } catch (error) {
    console.error('Error retrieving file:', error);
    throw new Error(`Failed to retrieve file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generates a presigned URL for downloading a file from R2 storage
 * 
 * @param key The storage key of the file to download
 * @returns A download result with presigned URL or error
 */
export async function getPresignedDownloadUrl(key: string): Promise<DownloadResult> {
  try {
    const r2 = await R2.getInstance();
    
    // Generate a presigned URL for downloading the file
    const url = await r2.getPresignedUrl('GET', key, 60 * 60); // 1 hour expiration
    
    return {
      success: true,
      url,
    };
  } catch (error) {
    console.error('Error generating presigned download URL:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate download URL',
    };
  }
}

/**
 * Checks if a file exists in Cloudflare R2
 * @param key - The storage key of the file
 * @returns Whether the file exists
 */
export async function fileExists(key: string): Promise<boolean> {
  try {
    await r2Client.send(
      new HeadObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
      })
    );
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Deletes a file from Cloudflare R2
 * @param key - The storage key of the file
 * @returns Success status
 */
export async function deleteFile(key: string): Promise<boolean> {
  try {
    await r2Client.send(
      new DeleteObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
      })
    );
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
} 
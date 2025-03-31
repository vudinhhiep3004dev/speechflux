import { StorageBucket } from '@/lib/storage';

/**
 * Client-side function to upload a file using the upload API
 * 
 * @param file The file to upload
 * @param type The storage bucket type
 * @returns An object with upload result
 */
export async function uploadFile(
  file: File,
  type: StorageBucket = 'AUDIO'
): Promise<{
  success: boolean;
  fileId?: string;
  error?: string;
}> {
  try {
    // First, get a presigned URL from the server
    const response = await fetch('/api/storage/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type,
        fileSize: file.size,
        type,
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Failed to get upload URL');
    }

    // Then upload the file directly to R2 using the presigned URL
    const uploadResponse = await fetch(result.url, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
      },
      body: file,
    });

    if (!uploadResponse.ok) {
      throw new Error(`Upload failed with status: ${uploadResponse.status}`);
    }

    return {
      success: true,
      fileId: result.fileId,
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
 * Client-side function to get a download URL for a file
 * 
 * @param fileId The ID of the file to download
 * @returns An object with the download URL and file info
 */
export async function getDownloadUrl(
  fileId: string
): Promise<{
  success: boolean;
  url?: string;
  filename?: string;
  contentType?: string;
  error?: string;
}> {
  try {
    const response = await fetch(`/api/storage/download?fileId=${fileId}`, {
      method: 'GET',
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Failed to get download URL');
    }

    return {
      success: true,
      url: result.url,
      filename: result.filename,
      contentType: result.contentType,
    };
  } catch (error) {
    console.error('Error getting download URL:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred',
    };
  }
}

/**
 * Client-side function to delete a file
 * 
 * @param fileId The ID of the file to delete
 * @returns An object indicating success or failure
 */
export async function deleteFile(
  fileId: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const response = await fetch(`/api/storage/delete?fileId=${fileId}`, {
      method: 'DELETE',
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to delete file');
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error('Error deleting file:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred',
    };
  }
} 
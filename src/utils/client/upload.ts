import { StorageBucket } from '@/lib/storage';
import { createClient } from '@/utils/supabase/client';

interface UploadResult {
  success: boolean;
  fileId?: string;
  error?: string;
}

interface DeleteResult {
  success: boolean;
  error?: string;
}

interface DownloadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Uploads a file to storage and creates a record in the database
 */
export async function uploadFile(file: File, bucket: StorageBucket): Promise<UploadResult> {
  try {
    const supabase = createClient();
    
    // Check if the user is logged in
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        success: false,
        error: 'You must be logged in to upload files',
      };
    }
    
    // Get presigned upload URL
    const { data: presignedData, error: presignedError } = await supabase
      .functions.invoke('get-upload-url', {
        body: {
          fileName: file.name,
          contentType: file.type,
          bucket,
        }
      });
    
    if (presignedError || !presignedData?.url) {
      console.error('Error getting presigned URL:', presignedError);
      return {
        success: false,
        error: presignedError?.message || 'Failed to get upload URL',
      };
    }
    
    // Upload the file using the presigned URL
    const uploadResponse = await fetch(presignedData.url, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
      },
      body: file,
    });
    
    if (!uploadResponse.ok) {
      return {
        success: false,
        error: `Upload failed with status: ${uploadResponse.status}`,
      };
    }
    
    // Create a record in the database
    const { data: fileRecord, error: dbError } = await supabase
      .from('files')
      .insert({
        filename: file.name,
        file_size: file.size,
        mime_type: file.type,
        owner_id: user.id,
        storage_bucket: bucket,
        status: 'processing', // Initial status
        storage_path: presignedData.path,
      })
      .select('id')
      .single();
    
    if (dbError) {
      console.error('Error creating file record:', dbError);
      return {
        success: false,
        error: dbError.message,
      };
    }
    
    return {
      success: true,
      fileId: fileRecord.id,
    };
  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}

/**
 * Deletes a file from storage and removes the database record
 */
export async function deleteFile(fileId: string): Promise<DeleteResult> {
  try {
    const supabase = createClient();
    
    // Check if the user is logged in
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        success: false,
        error: 'You must be logged in to delete files',
      };
    }
    
    // Get the file details first
    const { data: file, error: fetchError } = await supabase
      .from('files')
      .select('*')
      .eq('id', fileId)
      .single();
    
    if (fetchError) {
      return {
        success: false,
        error: fetchError.message,
      };
    }
    
    if (!file) {
      return {
        success: false,
        error: 'File not found',
      };
    }
    
    // Make sure the user owns the file
    if (file.owner_id !== user.id) {
      return {
        success: false,
        error: 'You do not have permission to delete this file',
      };
    }
    
    // Delete the file from storage using Edge Function
    const { error: deleteStorageError } = await supabase
      .functions.invoke('delete-file', {
        body: {
          storageKey: file.storage_path,
          bucket: file.storage_bucket,
        }
      });
    
    if (deleteStorageError) {
      console.error('Error deleting from storage:', deleteStorageError);
      // Continue anyway to delete the database record
    }
    
    // Delete the database record
    const { error: deleteRecordError } = await supabase
      .from('files')
      .delete()
      .eq('id', fileId);
    
    if (deleteRecordError) {
      return {
        success: false,
        error: deleteRecordError.message,
      };
    }
    
    return {
      success: true,
    };
  } catch (error) {
    console.error('Delete error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}

/**
 * Gets a presigned URL for downloading a file
 */
export async function getDownloadUrl(fileId: string): Promise<DownloadResult> {
  try {
    const supabase = createClient();
    
    // Check if the user is logged in
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        success: false,
        error: 'You must be logged in to download files',
      };
    }
    
    // Get the file details first
    const { data: file, error: fetchError } = await supabase
      .from('files')
      .select('*')
      .eq('id', fileId)
      .single();
    
    if (fetchError) {
      return {
        success: false,
        error: fetchError.message,
      };
    }
    
    if (!file) {
      return {
        success: false,
        error: 'File not found',
      };
    }
    
    // Make sure the user owns the file
    if (file.owner_id !== user.id) {
      return {
        success: false,
        error: 'You do not have permission to download this file',
      };
    }
    
    // Get presigned download URL
    const { data: presignedData, error: presignedError } = await supabase
      .functions.invoke('get-download-url', {
        body: {
          storageKey: file.storage_path,
          bucket: file.storage_bucket,
          fileName: file.filename,
        }
      });
    
    if (presignedError || !presignedData?.url) {
      console.error('Error getting download URL:', presignedError);
      return {
        success: false,
        error: presignedError?.message || 'Failed to get download URL',
      };
    }
    
    return {
      success: true,
      url: presignedData.url,
    };
  } catch (error) {
    console.error('Download error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
} 
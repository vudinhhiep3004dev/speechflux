'use client';

import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { StorageBucket } from '@/lib/storage';
import { uploadFile } from '@/utils/client/upload';
import { Loader2, Check, X, Upload } from 'lucide-react';

interface FileUploadProps {
  accept?: string;
  maxSizeMB?: number;
  type?: StorageBucket;
  onUploadComplete?: (fileId: string) => void;
  onUploadError?: (error: string) => void;
}

export function FileUpload({
  accept = 'audio/*',
  maxSizeMB = 100,
  type = 'AUDIO',
  onUploadComplete,
  onUploadError,
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  
  // Handle file selection and upload
  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Reset states
    setIsUploading(true);
    setUploadProgress(0);
    setUploadSuccess(false);
    setUploadError(null);
    
    // Validate file size
    if (file.size > maxSizeBytes) {
      setUploadError(`File size exceeds the maximum allowed size of ${maxSizeMB}MB`);
      setIsUploading(false);
      onUploadError?.(`File size exceeds the maximum allowed size of ${maxSizeMB}MB`);
      return;
    }
    
    try {
      // Simulate upload progress (since we can't track actual progress with fetch API)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          const next = prev + Math.random() * 15;
          return next > 90 ? 90 : next;
        });
      }, 500);
      
      // Upload the file
      const result = await uploadFile(file, type);
      
      clearInterval(progressInterval);
      
      if (result.success && result.fileId) {
        setUploadProgress(100);
        setUploadSuccess(true);
        onUploadComplete?.(result.fileId);
      } else {
        setUploadError(result.error || 'Upload failed');
        onUploadError?.(result.error || 'Upload failed');
      }
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'An unknown error occurred');
      onUploadError?.(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsUploading(false);
    }
  }, [maxSizeBytes, maxSizeMB, onUploadComplete, onUploadError, type]);
  
  return (
    <div className="flex flex-col items-center gap-4 p-4 border border-dashed rounded-lg">
      <div className="flex items-center justify-center w-full">
        <label
          htmlFor="file-upload"
          className="flex flex-col items-center justify-center w-full h-32 cursor-pointer bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <div className="flex flex-col items-center justify-center p-4">
            {isUploading ? (
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            ) : uploadSuccess ? (
              <Check className="w-8 h-8 text-green-500" />
            ) : uploadError ? (
              <X className="w-8 h-8 text-red-500" />
            ) : (
              <Upload className="w-8 h-8 text-blue-500" />
            )}
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {isUploading 
                ? 'Uploading...' 
                : uploadSuccess 
                ? 'Upload complete!' 
                : uploadError 
                ? 'Upload failed' 
                : `Click to upload or drag and drop (max ${maxSizeMB}MB)`}
            </p>
          </div>
          <input
            id="file-upload"
            type="file"
            className="hidden"
            accept={accept}
            onChange={handleFileChange}
            disabled={isUploading}
          />
        </label>
      </div>
      
      {isUploading && (
        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
          <div
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${uploadProgress}%` }}
          ></div>
        </div>
      )}
      
      {uploadError && (
        <div className="text-sm text-red-500 mt-2">{uploadError}</div>
      )}
      
      {uploadSuccess && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setUploadSuccess(false);
            setUploadProgress(0);
          }}
        >
          Upload another file
        </Button>
      )}
    </div>
  );
} 
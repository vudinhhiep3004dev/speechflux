'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { FileUploadDragDrop } from '@/components/ui/file-upload-drag-drop';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface AudioUploaderProps {
  onSuccess?: (fileId: string) => void;
  redirectOnSuccess?: boolean;
  maxSizeMB?: number;
}

export const AudioUploader = ({
  onSuccess,
  redirectOnSuccess = true,
  maxSizeMB = 25,
}: AudioUploaderProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [fileId, setFileId] = useState<string | null>(null);
  
  const { toast } = useToast();
  const router = useRouter();
  
  const handleUploadComplete = (id: string) => {
    setFileId(id);
    setUploadComplete(true);
    setIsUploading(false);
    
    toast({
      title: 'Upload successful',
      description: 'Your audio file has been uploaded successfully.',
      variant: 'default',
    });
    
    if (onSuccess) {
      onSuccess(id);
    }
  };
  
  const handleUploadError = (error: string) => {
    setIsUploading(false);
    
    toast({
      title: 'Upload failed',
      description: error,
      variant: 'destructive',
    });
  };
  
  const handleViewFile = () => {
    if (fileId && redirectOnSuccess) {
      router.push(`/dashboard/files/${fileId}`);
    }
  };
  
  const handleUploadAnother = () => {
    setUploadComplete(false);
    setFileId(null);
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Upload Audio File</CardTitle>
        <CardDescription>
          Upload an audio file to transcribe. Supported formats: MP3, WAV, M4A, FLAC, OGG.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {!uploadComplete ? (
          <FileUploadDragDrop
            accept="audio/*"
            maxSizeMB={maxSizeMB}
            type="AUDIO"
            onUploadComplete={handleUploadComplete}
            onUploadError={handleUploadError}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-green-100 p-3 dark:bg-green-900">
              <svg
                className="h-6 w-6 text-green-600 dark:text-green-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium">Upload Complete</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Your audio file has been successfully uploaded and is being processed.
            </p>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        {isUploading ? (
          <Button disabled>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Uploading...
          </Button>
        ) : uploadComplete ? (
          <>
            <Button variant="outline" onClick={handleUploadAnother}>
              Upload Another
            </Button>
            {redirectOnSuccess && (
              <Button onClick={handleViewFile}>
                View Details
              </Button>
            )}
          </>
        ) : (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Drag and drop your audio file or click to browse
          </div>
        )}
      </CardFooter>
    </Card>
  );
}; 
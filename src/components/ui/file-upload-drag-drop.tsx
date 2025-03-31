'use client';

import { useState, useRef, useCallback } from 'react';
import { UploadCloud, X, AlertCircle, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { StorageBucket } from '@/lib/storage';
import { uploadFile } from '@/utils/client/upload';
import { formatFileSize } from '@/lib/utils';

interface FileUploadDragDropProps {
  accept?: string;
  maxSizeMB?: number;
  type?: StorageBucket;
  onUploadComplete?: (fileId: string) => void;
  onUploadError?: (error: string) => void;
}

export function FileUploadDragDrop({
  accept = 'audio/*',
  maxSizeMB = 25,
  type = 'AUDIO',
  onUploadComplete,
  onUploadError,
}: FileUploadDragDropProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploadStatus, setUploadStatus] = useState<Record<string, 'uploading' | 'success' | 'error'>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  
  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);
  
  const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);
  
  const validateFile = useCallback((file: File): string | null => {
    // Check file type if accept is specified
    if (accept && !file.type.match(accept.replace('*', '.*'))) {
      return `File type ${file.type} is not supported. Accepted types: ${accept}`;
    }
    
    // Check file size
    if (file.size > maxSizeBytes) {
      return `File is too large. Maximum size is ${maxSizeMB}MB.`;
    }
    
    return null;
  }, [accept, maxSizeBytes, maxSizeMB]);
  
  const processFiles = useCallback((fileList: FileList | null) => {
    if (!fileList) return;
    
    const newFiles: File[] = [];
    const newErrors: Record<string, string> = {};
    
    Array.from(fileList).forEach(file => {
      const error = validateFile(file);
      if (error) {
        newErrors[file.name] = error;
      } else {
        newFiles.push(file);
      }
    });
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(prevErrors => ({ ...prevErrors, ...newErrors }));
      onUploadError?.(Object.values(newErrors)[0]);
    }
    
    if (newFiles.length > 0) {
      setFiles(prevFiles => [...prevFiles, ...newFiles]);
      uploadFiles(newFiles);
    }
  }, [validateFile, onUploadError]);
  
  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  }, [processFiles]);
  
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files);
    // Reset the input value so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [processFiles]);
  
  const uploadFiles = async (filesToUpload: File[]) => {
    if (filesToUpload.length === 0) return;
    
    setIsUploading(true);
    
    for (const file of filesToUpload) {
      try {
        // Set initial progress and status
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
        setUploadStatus(prev => ({ ...prev, [file.name]: 'uploading' }));
        
        // Simulate progress updates
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            const currentProgress = prev[file.name] || 0;
            if (currentProgress < 90) {
              return { ...prev, [file.name]: currentProgress + Math.random() * 10 };
            }
            return prev;
          });
        }, 300);
        
        // Upload the file
        const result = await uploadFile(file, type);
        
        clearInterval(progressInterval);
        
        if (result.success && result.fileId) {
          setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
          setUploadStatus(prev => ({ ...prev, [file.name]: 'success' }));
          onUploadComplete?.(result.fileId);
        } else {
          throw new Error(result.error || 'Upload failed');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        setUploadStatus(prev => ({ ...prev, [file.name]: 'error' }));
        setErrors(prev => ({ ...prev, [file.name]: errorMessage }));
        onUploadError?.(errorMessage);
      }
    }
    
    setIsUploading(false);
  };
  
  const removeFile = (fileName: string) => {
    setFiles(prevFiles => prevFiles.filter(file => file.name !== fileName));
    
    // Clean up state
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[fileName];
      return newProgress;
    });
    
    setUploadStatus(prev => {
      const newStatus = { ...prev };
      delete newStatus[fileName];
      return newStatus;
    });
    
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fileName];
      return newErrors;
    });
  };
  
  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  return (
    <div className="space-y-4">
      <div 
        className={`border-2 border-dashed rounded-lg p-6 
          ${isDragging ? 'border-primary bg-primary/10' : 'border-muted-foreground/25'} 
          transition-colors duration-200 relative`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={handleButtonClick}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept={accept}
          multiple
        />
        
        <div className="flex flex-col items-center justify-center text-center space-y-2 py-6">
          <UploadCloud className="h-10 w-10 text-muted-foreground mb-2" />
          <h3 className="font-medium text-lg">Drag files here or click to upload</h3>
          <p className="text-sm text-muted-foreground">
            {`Files up to ${maxSizeMB}MB. Supported formats: `}
            {accept === 'audio/*' 
              ? 'MP3, WAV, M4A, OGG, FLAC'
              : accept.split(',').join(', ').replace(/\./g, '')}
          </p>
        </div>
      </div>
      
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map(file => {
            const progress = uploadProgress[file.name] || 0;
            const status = uploadStatus[file.name];
            const error = errors[file.name];
            
            return (
              <div 
                key={file.name} 
                className="border rounded-md p-3 flex items-start gap-3"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between">
                    <p className="font-medium text-sm truncate">{file.name}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(file.name);
                      }}
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Remove</span>
                    </Button>
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                  
                  {status === 'uploading' && (
                    <div className="space-y-1">
                      <Progress value={progress} className="h-1" />
                      <p className="text-xs text-muted-foreground">
                        Uploading: {Math.round(progress)}%
                      </p>
                    </div>
                  )}
                  
                  {error && (
                    <div className="flex items-center text-destructive text-xs">
                      <AlertCircle className="h-3 w-3 mr-1 flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}
                </div>
                
                {status === 'success' && (
                  <div className="flex-shrink-0 rounded-full bg-green-100 p-1 dark:bg-green-900/30">
                    <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                )}
                
                {status === 'uploading' && (
                  <div className="flex-shrink-0">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                )}
                
                {status === 'error' && (
                  <div className="flex-shrink-0 rounded-full bg-red-100 p-1 dark:bg-red-900/30">
                    <X className="h-4 w-4 text-red-600 dark:text-red-400" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
} 
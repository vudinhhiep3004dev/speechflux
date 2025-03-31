'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthContext } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { FileUpload } from '@/components/ui/file-upload';
import { formatFileSize, formatDate } from '@/lib/utils';

// Define the file type
interface FileRecord {
  id: string;
  filename: string;
  file_size: number;
  created_at: string;
  content_type: string;
  owner_id: string;
  status: string;
}

export default function DashboardPage() {
  const { user } = useAuthContext();
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      setIsLoading(true);
      // Fetch files from API
      const response = await fetch('/api/storage/list');
      const data = await response.json();
      
      if (data.success) {
        setFiles(data.files || []);
      }
    } catch (error) {
      console.error('Error fetching files:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    try {
      const response = await fetch(`/api/storage/delete?fileId=${fileId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        fetchFiles();
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  const refreshFiles = () => {
    fetchFiles();
  };

  return (
    <div className="container py-6">
      <Card>
        <CardHeader>
          <CardTitle>Your Files</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center">Loading your content...</p>
          ) : files.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-lg">You don&apos;t have any files yet.</p>
              <p className="text-muted-foreground mb-4">
                Upload an audio file to get started with transcription.
              </p>
              <FileUpload
                accept="audio/*"
                maxSizeMB={25}
                onUploadComplete={() => refreshFiles()}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="border rounded-lg p-4 shadow-sm hover:shadow transition-shadow"
                >
                  <h3 className="font-medium mb-1">{file.filename}</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {formatFileSize(file.file_size)} • {formatDate(file.created_at)}
                  </p>
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/dashboard/files/${file.id}`}>View Details</Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteFile(file.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 
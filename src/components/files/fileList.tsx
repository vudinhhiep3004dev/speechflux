'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatFileSize, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FileUpload } from '@/components/ui/file-upload';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { Loader2, FileIcon, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface FileItem {
  id: string;
  filename: string;
  file_size: number;
  created_at: string;
  status: string;
  owner_id: string;
}

interface FileListProps {
  limit?: number;
}

export function FileList({ limit }: FileListProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchFiles();
  }, [limit]);

  const fetchFiles = async () => {
    try {
      setIsLoading(true);
      const supabase = createClient();
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from('files')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });
      
      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching files:', error);
        return;
      }
      
      setFiles(data as FileItem[]);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteFile = async (id: string) => {
    try {
      const supabase = createClient();
      
      // Delete the file record
      const { error } = await supabase
        .from('files')
        .delete()
        .eq('id', id);
        
      if (error) {
        throw error;
      }
      
      // Remove from local state
      setFiles(files.filter(file => file.id !== id));
      toast.success('File deleted successfully');
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Failed to delete file');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center py-6">
          <p className="text-lg font-medium mb-2">You don&apos;t have any files yet</p>
          <p className="text-muted-foreground mb-6">
            Upload an audio file to get started with transcription
          </p>
          <FileUpload
            accept="audio/*"
            maxSizeMB={25}
            onUploadComplete={() => fetchFiles()}
          />
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {files.map((file) => (
          <Card key={file.id} className="p-4 hover:shadow transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <FileIcon className="h-8 w-8 text-muted-foreground shrink-0" />
                <div className="space-y-1">
                  <h3 className="font-medium line-clamp-1">{file.filename}</h3>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.file_size)} • {formatDate(file.created_at)}
                  </p>
                  <div className="flex items-center">
                    <span 
                      className={`inline-block w-2 h-2 rounded-full mr-2 ${
                        file.status === 'completed' 
                          ? 'bg-green-500' 
                          : file.status === 'processing' 
                            ? 'bg-yellow-500' 
                            : 'bg-red-500'
                      }`} 
                    />
                    <span className="text-xs capitalize">{file.status}</span>
                  </div>
                </div>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">More</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/dashboard/files/${file.id}`}>View Details</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-600"
                    onClick={() => handleDeleteFile(file.id)}
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </Card>
        ))}
      </div>
      
      {limit && files.length >= limit && (
        <div className="flex justify-center mt-4">
          <Button variant="outline" asChild>
            <Link href="/dashboard/files">View All Files</Link>
          </Button>
        </div>
      )}
    </div>
  );
} 
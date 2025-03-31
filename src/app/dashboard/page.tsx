'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthContext } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { FileUpload } from '@/components/ui/file-upload';
import { formatFileSize, formatDate } from '@/lib/utils';
import { DashboardHeader } from '@/components/dashboard/header';
import { Shell } from '@/components/shell';
import { DashboardStats } from '@/components/dashboard/dashboardStats';
import { FileList } from '@/components/files/fileList';

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
    <Shell className="gap-8">
      <DashboardHeader 
        heading="Dashboard" 
        text="View your usage and files."
      />
      
      <div className="space-y-8">
        <DashboardStats />
        
        <div>
          <h2 className="text-xl font-semibold mb-4">Recent Files</h2>
          <FileList limit={5} />
        </div>
      </div>
    </Shell>
  );
} 
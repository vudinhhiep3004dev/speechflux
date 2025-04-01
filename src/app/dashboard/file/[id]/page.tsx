'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Loader2, Download, Trash2, Pencil, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { getDownloadUrl, deleteFile } from '@/utils/client/upload';
import { formatDate, formatFileSize } from '@/lib/utils';
import { TranslationCard } from '@/components/translation/translation-card';
import { SummaryCard } from '@/components/summarization/summary-card';

interface FileDetails {
  id: string;
  filename: string;
  owner_id: string;
  file_size: number;
  mime_type: string;
  status: string;
  created_at: string;
  updated_at: string;
  storage_bucket: string;
  duration?: number;
  language_code?: string;
  processing_error?: string;
}

export default function FileDetailPage() {
  const params = useParams();
  const fileId = params.id as string;
  
  const [fileDetails, setFileDetails] = useState<FileDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  const { toast } = useToast();
  
  useEffect(() => {
    fetchFileDetails();
  }, [fileId]);
  
  const fetchFileDetails = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/files/${fileId}`);
      
      if (response.ok) {
        const data = await response.json();
        setFileDetails(data.file);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load file details',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching file details:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDownload = async () => {
    try {
      if (!fileId) return;
      
      const result = await getDownloadUrl(fileId);
      
      if (result.success && result.url) {
        // Open the URL in a new tab
        window.open(result.url, '_blank');
        setDownloadUrl(result.url);
      } else {
        throw new Error(result.error || 'Failed to generate download URL');
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: 'Download Failed',
        description: error instanceof Error ? error.message : 'Failed to download file',
        variant: 'destructive',
      });
    }
  };
  
  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      
      const result = await deleteFile(fileId);
      
      if (result.success) {
        toast({
          title: 'File Deleted',
          description: 'The file has been successfully deleted',
        });
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1500);
      } else {
        throw new Error(result.error || 'Failed to delete file');
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: 'Delete Failed',
        description: error instanceof Error ? error.message : 'Failed to delete file',
        variant: 'destructive',
      });
      setIsDeleting(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading file details...</span>
      </div>
    );
  }
  
  if (!fileDetails) {
    return (
      <div className="container py-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <h3 className="text-lg font-medium">File Not Found</h3>
              <p className="text-muted-foreground mt-2">
                The requested file could not be found or you don&apos;t have permission to access it.
              </p>
              <Button className="mt-4" onClick={() => window.location.href = '/dashboard'}>
                Return to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container py-6">
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">{fileDetails.filename}</h1>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </>
              )}
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="transcript">Transcript</TabsTrigger>
            <TabsTrigger value="translation">Translation</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle>File Details</CardTitle>
                <CardDescription>
                  Information about the uploaded file
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-3 items-center gap-4">
                    <div className="font-medium">Filename</div>
                    <div className="col-span-2">{fileDetails.filename}</div>
                  </div>
                  <div className="grid grid-cols-3 items-center gap-4">
                    <div className="font-medium">File Size</div>
                    <div className="col-span-2">{formatFileSize(fileDetails.file_size)}</div>
                  </div>
                  <div className="grid grid-cols-3 items-center gap-4">
                    <div className="font-medium">File Type</div>
                    <div className="col-span-2">{fileDetails.mime_type}</div>
                  </div>
                  <div className="grid grid-cols-3 items-center gap-4">
                    <div className="font-medium">Upload Date</div>
                    <div className="col-span-2">{formatDate(fileDetails.created_at)}</div>
                  </div>
                  <div className="grid grid-cols-3 items-center gap-4">
                    <div className="font-medium">Status</div>
                    <div className="col-span-2">
                      {fileDetails.status === 'processing' ? (
                        <span className="flex items-center text-orange-500">
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing
                        </span>
                      ) : fileDetails.status === 'transcribed' ? (
                        <span className="flex items-center text-green-500">
                          <CheckSquare className="h-4 w-4 mr-2" />
                          Completed
                        </span>
                      ) : fileDetails.status === 'error' ? (
                        <span className="flex items-center text-red-500">
                          Error: {fileDetails.processing_error || 'Unknown error'}
                        </span>
                      ) : (
                        <span>{fileDetails.status}</span>
                      )}
                    </div>
                  </div>
                  {fileDetails.duration && (
                    <div className="grid grid-cols-3 items-center gap-4">
                      <div className="font-medium">Duration</div>
                      <div className="col-span-2">
                        {Math.floor(fileDetails.duration / 60)}:{(fileDetails.duration % 60).toString().padStart(2, '0')}
                      </div>
                    </div>
                  )}
                  {fileDetails.language_code && (
                    <div className="grid grid-cols-3 items-center gap-4">
                      <div className="font-medium">Language</div>
                      <div className="col-span-2">{fileDetails.language_code}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="transcript">
            <Card>
              <CardHeader>
                <CardTitle>Transcript</CardTitle>
                <CardDescription>
                  Generated text from your audio file
                </CardDescription>
              </CardHeader>
              <CardContent>
                {fileDetails.status === 'processing' ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                    <p>Your audio is being transcribed...</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      This may take a few minutes depending on the file size
                    </p>
                  </div>
                ) : fileDetails.status === 'error' ? (
                  <div className="text-center py-8">
                    <p className="text-red-500">Failed to generate transcript</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      {fileDetails.processing_error || 'An unknown error occurred'}
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Transcript content will appear here once processing is complete
                    </p>
                    {/* Placeholder for actual transcript content */}
                    <div className="p-4 border rounded">
                      <p>Transcript placeholder content</p>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" disabled={fileDetails.status !== 'transcribed'}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit Transcript
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="translation">
            <TranslationCard
              transcriptId={fileDetails.id}
              transcriptLanguage={fileDetails.language_code}
            />
          </TabsContent>
          
          <TabsContent value="summary">
            <SummaryCard transcriptId={fileDetails.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Force dynamic rendering for auth context
export const dynamic = 'force-dynamic'; 
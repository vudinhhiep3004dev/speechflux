'use client';

import { useState } from 'react';
import { AudioUploader } from '@/components/uploads/AudioUploader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileUploadDragDrop } from '@/components/ui/file-upload-drag-drop';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';

export default function UploadPage() {
  const [activeTab, setActiveTab] = useState('audio');
  const { toast } = useToast();
  const router = useRouter();
  
  const handleUploadComplete = (fileId: string) => {
    toast({
      title: 'Upload successful',
      description: 'File has been uploaded and is ready for processing.',
    });
    
    // After a short delay, redirect to the file detail page
    setTimeout(() => {
      router.push(`/dashboard/files/${fileId}`);
    }, 1500);
  };
  
  const handleUploadError = (error: string) => {
    toast({
      title: 'Upload failed',
      description: error,
      variant: 'destructive',
    });
  };
  
  return (
    <div className="container py-6">
      <h1 className="text-3xl font-bold mb-6">Upload Content</h1>
      
      <Tabs defaultValue="audio" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="audio">Audio Files</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>
        
        <TabsContent value="audio">
          <div className="grid gap-6 md:grid-cols-2">
            <AudioUploader 
              onSuccess={handleUploadComplete}
              redirectOnSuccess={false}
            />
            
            <Card>
              <CardHeader>
                <CardTitle>Audio Processing Features</CardTitle>
                <CardDescription>
                  What happens when you upload an audio file
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <svg
                      className="mr-2 h-5 w-5 text-green-500 mt-0.5"
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
                    <span>Automatic speech-to-text transcription</span>
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="mr-2 h-5 w-5 text-green-500 mt-0.5"
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
                    <span>Support for multiple languages</span>
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="mr-2 h-5 w-5 text-green-500 mt-0.5"
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
                    <span>Translation capabilities</span>
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="mr-2 h-5 w-5 text-green-500 mt-0.5"
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
                    <span>AI-powered summaries</span>
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="mr-2 h-5 w-5 text-green-500 mt-0.5"
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
                    <span>Edit and export transcripts</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Document Upload</CardTitle>
              <CardDescription>
                Upload text documents for summarization and analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileUploadDragDrop 
                accept=".pdf,.docx,.txt"
                maxSizeMB={10}
                type="TRANSCRIPTS"
                onUploadComplete={handleUploadComplete}
                onUploadError={handleUploadError}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 
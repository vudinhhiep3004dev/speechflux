'use client';

import React, { useEffect, useState } from 'react';
import { TranscriptEditor } from './TranscriptEditor';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, Info, RotateCcw, Save } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getTranscriptContent, getTranscriptVersionHistory, restoreTranscriptVersion, saveTranscriptEdit } from '@/lib/api/transcript-editor';
import { useToast } from '@/components/ui/use-toast';

interface TranscriptVersion {
  id: string;
  transcriptId: string;
  createdAt: string;
  isCurrentVersion: boolean;
  user: {
    id: string;
    name: string;
    email: string | null;
  };
}

interface TranscriptEditorCardProps {
  transcriptId: string;
  initialContent?: string;
  readOnly?: boolean;
}

export function TranscriptEditorCard({
  transcriptId,
  initialContent = '',
  readOnly = false,
}: TranscriptEditorCardProps) {
  const [content, setContent] = useState(initialContent);
  const [loading, setLoading] = useState(true);
  const [versions, setVersions] = useState<TranscriptVersion[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('editor');
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch initial transcript content if not provided
  useEffect(() => {
    if (!initialContent) {
      loadTranscriptContent();
    } else {
      setLoading(false);
    }
  }, [transcriptId, initialContent]);

  const loadTranscriptContent = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getTranscriptContent(transcriptId);
      
      if (result.success) {
        setContent(result.content);
      } else {
        setError(result.error || 'Failed to load transcript content');
        toast({
          title: 'Error',
          description: result.error || 'Failed to load transcript content',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error loading transcript content:', error);
      setError('An unexpected error occurred while loading the transcript');
      toast({
        title: 'Error',
        description: 'An unexpected error occurred while loading the transcript',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (content: string) => {
    try {
      const result = await saveTranscriptEdit(transcriptId, content);
      
      if (!result.success) {
        toast({
          title: 'Save Failed',
          description: result.error || 'Failed to save transcript',
          variant: 'destructive',
        });
        return Promise.reject(new Error(result.error || 'Failed to save transcript'));
      }

      // Load updated versions after save
      if (activeTab === 'versions') {
        loadVersionHistory();
      }

      return Promise.resolve();
    } catch (error) {
      console.error('Error saving transcript:', error);
      toast({
        title: 'Save Failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
      return Promise.reject(error);
    }
  };

  const loadVersionHistory = async () => {
    setVersionsLoading(true);
    try {
      const result = await getTranscriptVersionHistory(transcriptId);
      
      if (result.success) {
        // Transform the API response versions to match the component's expected format
        const transformedVersions = result.versions.map(version => ({
          id: version.id,
          transcriptId: version.transcriptId,
          createdAt: version.createdAt,
          isCurrentVersion: false, // Default value, updated below if needed
          user: {
            id: version.userId,
            name: `User ${version.userId.substring(0, 4)}`, // Placeholder name
            email: null
          }
        }));
        
        // Mark the most recent version as current
        if (transformedVersions.length > 0) {
          transformedVersions.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          transformedVersions[0].isCurrentVersion = true;
        }
        
        setVersions(transformedVersions);
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to load version history',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error loading version history:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred while loading version history',
        variant: 'destructive',
      });
    } finally {
      setVersionsLoading(false);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);

    if (value === 'versions' && versions.length === 0) {
      loadVersionHistory();
    }
  };

  const handleRestoreVersion = async (versionId: string) => {
    try {
      const result = await restoreTranscriptVersion(transcriptId, versionId);
      
      if (result.success) {
        toast({
          title: 'Version Restored',
          description: 'The selected version has been restored successfully',
        });

        // Reload content and versions
        await loadTranscriptContent();
        if (activeTab === 'versions') {
          await loadVersionHistory();
        }
      } else {
        toast({
          title: 'Restore Failed',
          description: result.error || 'Failed to restore version',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error restoring version:', error);
      toast({
        title: 'Restore Failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Transcript Editor</CardTitle>
        <CardDescription>Edit and manage your transcript</CardDescription>
      </CardHeader>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <div className="px-6">
          <TabsList>
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="versions">Version History</TabsTrigger>
          </TabsList>
        </div>

        <CardContent className="p-6">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <Info className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <TabsContent value="editor" className="mt-0">
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-[40px] w-full" />
                <Skeleton className="h-[300px] w-full" />
              </div>
            ) : (
              <TranscriptEditor
                transcriptId={transcriptId}
                initialContent={content}
                readOnly={readOnly}
                onSave={handleSave}
              />
            )}
          </TabsContent>

          <TabsContent value="versions" className="mt-0">
            {versionsLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-[40px] w-full" />
                <Skeleton className="h-[300px] w-full" />
              </div>
            ) : versions.length > 0 ? (
              <div>
                <div className="mb-4">
                  <h3 className="text-sm font-medium mb-2">Version History</h3>
                  <p className="text-sm text-muted-foreground">
                    View and restore previous versions of your transcript.
                  </p>
                </div>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Version</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="w-[120px]">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {versions.map((version) => (
                      <TableRow key={version.id}>
                        <TableCell>
                          {version.isCurrentVersion ? (
                            <span className="font-medium">Current Version</span>
                          ) : (
                            <span>Previous Version</span>
                          )}
                        </TableCell>
                        <TableCell>{version.user.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Clock className="mr-1 h-3 w-3 text-muted-foreground" />
                            <span>{formatDistanceToNow(new Date(version.createdAt), { addSuffix: true })}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {!version.isCurrentVersion && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleRestoreVersion(version.id)}
                            >
                              <RotateCcw className="mr-1 h-3 w-3" />
                              Restore
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="p-8 text-center">
                <p className="text-muted-foreground">No version history available.</p>
              </div>
            )}
          </TabsContent>
        </CardContent>
      </Tabs>

      <CardFooter className="flex justify-between border-t px-6 py-4">
        <p className="text-xs text-muted-foreground">
          Changes are automatically saved as you type.
        </p>

        {!readOnly && (
          <Button 
            onClick={() => {
              if (activeTab === 'editor') {
                handleSave(content);
              } else {
                setActiveTab('editor');
              }
            }}
          >
            {activeTab === 'editor' ? (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Now
              </>
            ) : (
              'Back to Editor'
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
} 
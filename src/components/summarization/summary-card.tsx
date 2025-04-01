'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { requestSummary, getSummary } from '@/lib/api/summarization';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, RefreshCw, Download, Check, AlertCircle } from 'lucide-react';
import { SummaryLength } from '@/lib/ai';
import { Badge } from '@/components/ui/badge';

interface SummaryCardProps {
  transcriptId: string;
}

export function SummaryCard({ transcriptId }: SummaryCardProps) {
  const [summaryLength, setSummaryLength] = useState<SummaryLength>(SummaryLength.MEDIUM);
  const [isGenerating, setIsGenerating] = useState(false);
  const [summaryId, setSummaryId] = useState<string | null>(null);
  const [summaryStatus, setStatus] = useState<'idle' | 'processing' | 'completed' | 'error'>('idle');
  const [summaryContent, setSummaryContent] = useState<string | null>(null);
  const [summaryMetadata, setSummaryMetadata] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const { toast } = useToast();
  
  const handleGenerateSummary = async () => {
    try {
      setIsGenerating(true);
      setError(null);
      setStatus('processing');
      
      const result = await requestSummary(transcriptId, summaryLength);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to start summarization');
      }
      
      if (result.summary) {
        setSummaryId(result.summary.id);
        
        // If summary already exists and is completed
        if (result.summary.status === 'completed') {
          await checkSummaryStatus(result.summary.id);
        } else {
          // Start polling for summary status
          pollSummaryStatus(result.summary.id);
        }
      }
    } catch (error) {
      console.error('Summarization error:', error);
      setStatus('error');
      setError(error instanceof Error ? error.message : 'Failed to generate summary');
      
      toast({
        title: 'Summarization failed',
        description: error instanceof Error ? error.message : 'Failed to generate summary',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  const pollSummaryStatus = async (id: string) => {
    try {
      // Poll for summary status every 2 seconds
      const intervalId = setInterval(async () => {
        const result = await checkSummaryStatus(id);
        
        // Stop polling when summary is complete or failed
        if (result && (result.status === 'completed' || result.status === 'error')) {
          clearInterval(intervalId);
        }
      }, 2000);
      
      // Clear interval after 3 minutes (180 seconds) as a safety measure
      setTimeout(() => clearInterval(intervalId), 180000);
    } catch (error) {
      console.error('Error polling summary status:', error);
    }
  };
  
  const checkSummaryStatus = async (id: string) => {
    try {
      const result = await getSummary(id);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to get summary status');
      }
      
      if (result.summary) {
        setStatus(result.summary.status as any);
        
        if (result.summary.status === 'completed' && result.summary.content) {
          setSummaryContent(result.summary.content);
          setSummaryMetadata(result.summary.metadata || null);
          
          toast({
            title: 'Summary generated',
            description: 'Your transcript has been summarized successfully',
          });
        } else if (result.summary.status === 'error') {
          setError(result.summary.processing_error || 'An error occurred during summarization');
          
          toast({
            title: 'Summarization failed',
            description: result.summary.processing_error || 'An error occurred during summarization',
            variant: 'destructive',
          });
        }
        
        return result.summary;
      }
    } catch (error) {
      console.error('Error checking summary status:', error);
      setStatus('error');
      setError(error instanceof Error ? error.message : 'Failed to check summary status');
    }
    
    return null;
  };
  
  const handleRefresh = async () => {
    if (summaryId) {
      await checkSummaryStatus(summaryId);
    }
  };
  
  const downloadSummary = () => {
    if (!summaryContent) return;
    
    const blob = new Blob([summaryContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript_summary_${summaryLength}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const renderSummaryMetadata = () => {
    if (!summaryMetadata) return null;
    
    return (
      <div className="mt-4 space-y-3">
        {summaryMetadata.topics && summaryMetadata.topics.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-1">Main Topics</h4>
            <div className="flex flex-wrap gap-1">
              {summaryMetadata.topics.map((topic: string, i: number) => (
                <Badge key={i} variant="secondary" className="mr-1 mb-1">{topic}</Badge>
              ))}
            </div>
          </div>
        )}
        
        {summaryMetadata.keywords && summaryMetadata.keywords.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-1">Keywords</h4>
            <div className="flex flex-wrap gap-1">
              {summaryMetadata.keywords.map((keyword: string, i: number) => (
                <Badge key={i} variant="outline" className="mr-1 mb-1">{keyword}</Badge>
              ))}
            </div>
          </div>
        )}
        
        {summaryMetadata.sentiment && (
          <div>
            <h4 className="text-sm font-medium mb-1">Overall Sentiment</h4>
            <Badge 
              variant={
                summaryMetadata.sentiment === 'positive' ? 'success' : 
                summaryMetadata.sentiment === 'negative' ? 'destructive' : 
                'secondary'
              }
            >
              {summaryMetadata.sentiment.charAt(0).toUpperCase() + summaryMetadata.sentiment.slice(1)}
            </Badge>
          </div>
        )}
      </div>
    );
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Summary</CardTitle>
        <CardDescription>
          AI-generated summary of your content
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Summary Length</h3>
            <RadioGroup
              value={summaryLength}
              onValueChange={(value) => setSummaryLength(value as SummaryLength)}
              className="flex flex-col space-y-1"
              disabled={isGenerating || summaryStatus === 'processing'}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value={SummaryLength.SHORT} id="summary-short" />
                <Label htmlFor="summary-short">Short (1-2 paragraphs)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value={SummaryLength.MEDIUM} id="summary-medium" />
                <Label htmlFor="summary-medium">Medium (3-4 paragraphs)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value={SummaryLength.LONG} id="summary-long" />
                <Label htmlFor="summary-long">Long (5+ paragraphs)</Label>
              </div>
            </RadioGroup>
          </div>
          
          {summaryStatus === 'completed' && summaryContent && (
            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2">Summary</h3>
              <div className="p-3 bg-muted rounded-md max-h-96 overflow-y-auto">
                <p className="whitespace-pre-wrap text-sm">{summaryContent}</p>
              </div>
              
              {renderSummaryMetadata()}
            </div>
          )}
          
          {summaryStatus === 'error' && error && (
            <div className="flex items-start gap-2 p-3 text-destructive bg-destructive/10 rounded-md">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Summarization failed</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="flex items-center text-sm text-muted-foreground">
          {summaryStatus === 'processing' && (
            <div className="flex items-center">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing summary...
            </div>
          )}
          {summaryStatus === 'completed' && (
            <div className="flex items-center">
              <Check className="h-4 w-4 mr-2 text-green-500" />
              Summary complete
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          {summaryStatus === 'completed' && (
            <Button size="sm" variant="outline" onClick={downloadSummary}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          )}
          
          {summaryStatus === 'completed' || summaryStatus === 'error' ? (
            <Button size="sm" variant="outline" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleGenerateSummary}
              disabled={isGenerating || summaryStatus === 'processing'}
            >
              {isGenerating || summaryStatus === 'processing' ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Summary'
              )}
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
} 
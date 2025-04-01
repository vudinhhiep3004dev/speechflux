'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatTime } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Play, Pause, Download, Copy } from 'lucide-react';

interface TranscriptSegment {
  id: number;
  start: number;
  end: number;
  text: string;
  words?: Array<{
    word: string;
    start: number;
    end: number;
  }>;
}

interface TranscriptData {
  id: string;
  text: string;
  language: string;
  segments: TranscriptSegment[];
  wordCount: number;
  duration: number;
  fileId?: string;
  audioUrl?: string;
}

interface TranscriptViewerProps {
  transcript: TranscriptData;
  isLoading?: boolean;
  error?: string;
  onPlay?: (timestamp: number) => void;
}

export function TranscriptViewer({
  transcript,
  isLoading = false,
  error,
  onPlay,
}: TranscriptViewerProps) {
  const [activeSegment, setActiveSegment] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const segmentRefs = useRef<(HTMLDivElement | null)[]>([]);
  
  // Reset the active segment when the transcript changes
  useEffect(() => {
    setActiveSegment(null);
    segmentRefs.current = transcript?.segments?.map(() => null) || [];
  }, [transcript]);
  
  // Copy transcript text to clipboard
  const handleCopyText = () => {
    if (transcript?.text) {
      navigator.clipboard.writeText(transcript.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  // Handle downloading transcript as text file
  const handleDownload = () => {
    if (!transcript?.text) return;
    
    const element = document.createElement('a');
    const file = new Blob([transcript.text], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `transcript-${transcript.id}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };
  
  // Jump to specific timestamp in audio
  const handlePlaySegment = (startTime: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = startTime;
      audioRef.current.play();
    }
    
    if (onPlay) {
      onPlay(startTime);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading transcript...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="rounded-md bg-destructive/10 p-4">
        <p className="text-destructive">Error: {error}</p>
      </div>
    );
  }
  
  if (!transcript) {
    return (
      <div className="rounded-md bg-muted p-4 text-center">
        <p className="text-muted-foreground">No transcript available</p>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col">
      {/* Transcript header and controls */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Transcript</h3>
          <p className="text-sm text-muted-foreground">
            {transcript.wordCount} words · {Math.floor(transcript.duration / 60)}m {Math.floor(transcript.duration % 60)}s
          </p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleCopyText}
            title="Copy transcript text"
          >
            {copied ? 'Copied!' : <Copy className="h-4 w-4" />}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleDownload}
            title="Download transcript as text"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Transcript content */}
      <Tabs defaultValue="segments">
        <TabsList className="mb-4">
          <TabsTrigger value="segments">Segments</TabsTrigger>
          <TabsTrigger value="full">Full Text</TabsTrigger>
        </TabsList>
        
        <TabsContent value="segments" className="min-h-[300px]">
          <ScrollArea className="h-[calc(100vh-350px)] min-h-[300px]">
            <div className="space-y-2">
              {transcript.segments.map((segment, index) => (
                <div
                  key={segment.id}
                  ref={(el) => { segmentRefs.current[index] = el; }}
                  className={`relative flex rounded-md p-2 ${activeSegment === index ? 'bg-primary/10' : 'hover:bg-muted'}`}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-8 shrink-0 self-start rounded-sm"
                    onClick={() => handlePlaySegment(segment.start)}
                    title="Play from this point"
                  >
                    <Play className="h-3 w-3" />
                    <span className="sr-only">Play</span>
                  </Button>
                  
                  <div className="ml-1">
                    <div className="text-xs font-medium text-muted-foreground mb-1">
                      {formatTime(segment.start)} - {formatTime(segment.end)}
                    </div>
                    <p className="text-sm">{segment.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="full">
          <ScrollArea className="h-[calc(100vh-350px)] min-h-[300px]">
            <div className="p-4 text-sm whitespace-pre-wrap">
              {transcript.text}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
      
      {/* Audio player if audio URL is provided */}
      {transcript.audioUrl && (
        <audio 
          ref={audioRef} 
          src={transcript.audioUrl} 
          className="hidden" 
          controls={false}
          onTimeUpdate={() => {
            if (!audioRef.current) return;
            
            const currentTime = audioRef.current.currentTime;
            const segmentIndex = transcript.segments.findIndex(
              seg => currentTime >= seg.start && currentTime < seg.end
            );
            
            if (segmentIndex !== -1 && segmentIndex !== activeSegment) {
              setActiveSegment(segmentIndex);
              segmentRefs.current[segmentIndex]?.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
              });
            }
          }}
        />
      )}
    </div>
  );
} 
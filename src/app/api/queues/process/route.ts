import { NextRequest, NextResponse } from 'next/server';
import { getNextJob, acquireLock, releaseLock } from '@/lib/redis';
import { createClient } from '@/utils/supabase/server';

// Interface for job data
interface TranscriptionJob {
  fileId: string;
  userId: string;
  audioUrl: string;
  language?: string;
}

interface TranslationJob {
  transcriptId: string;
  userId: string;
  targetLanguage: string;
  sourceLanguage?: string;
}

interface SummarizationJob {
  transcriptId: string;
  userId: string;
  length: 'short' | 'medium' | 'detailed';
}

type JobType = 'transcription' | 'translation' | 'summarization';

// Process job based on type
async function processJob(type: JobType, jobData: any): Promise<{ success: boolean; message?: string }> {
  const supabase = await createClient();
  
  try {
    // Based on job type, call the appropriate processing function
    switch (type) {
      case 'transcription':
        // Call transcription edge function
        const { data: transcriptionData, error: transcriptionError } = await supabase.functions.invoke(
          'whisper-transcribe',
          {
            body: {
              fileId: jobData.fileId,
              audioUrl: jobData.audioUrl,
              language: jobData.language
            }
          }
        );
        
        if (transcriptionError) {
          throw new Error(`Transcription error: ${transcriptionError.message}`);
        }
        
        return { success: true, message: 'Transcription completed' };
        
      case 'translation':
        // Call translation edge function
        const { data: translationData, error: translationError } = await supabase.functions.invoke(
          'translate-text',
          {
            body: {
              transcriptId: jobData.transcriptId,
              targetLanguage: jobData.targetLanguage,
              sourceLanguage: jobData.sourceLanguage
            }
          }
        );
        
        if (translationError) {
          throw new Error(`Translation error: ${translationError.message}`);
        }
        
        return { success: true, message: 'Translation completed' };
        
      case 'summarization':
        // Call summarization edge function
        const { data: summarizationData, error: summarizationError } = await supabase.functions.invoke(
          'summarize-text',
          {
            body: {
              transcriptId: jobData.transcriptId,
              length: jobData.length
            }
          }
        );
        
        if (summarizationError) {
          throw new Error(`Summarization error: ${summarizationError.message}`);
        }
        
        return { success: true, message: 'Summarization completed' };
        
      default:
        return { success: false, message: `Unknown job type: ${type}` };
    }
  } catch (error) {
    console.error(`Error processing ${type} job:`, error);
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Processes the next job in the specified queue
 */
export async function POST(req: NextRequest) {
  try {
    // Parse request
    const { type, lockTimeout = 180 } = await req.json() as { 
      type: JobType; 
      lockTimeout?: number;
    };
    
    // Validate input
    if (!type) {
      return NextResponse.json(
        { success: false, error: 'Queue type is required' },
        { status: 400 }
      );
    }
    
    // Attempt to acquire lock to prevent concurrent processing
    const lockId = `queue_processor:${type}`;
    const lockAcquired = await acquireLock(lockId, lockTimeout);
    
    if (!lockAcquired) {
      return NextResponse.json(
        { success: false, error: 'Another processor is already running' },
        { status: 409 }
      );
    }
    
    try {
      // Get next job from queue
      const job = await getNextJob(`queue:${type}`);
      
      if (!job) {
        return NextResponse.json({ success: true, message: 'No jobs in queue' });
      }
      
      // Process the job
      const result = await processJob(type, job);
      
      return NextResponse.json(result);
    } finally {
      // Always release the lock
      await releaseLock(lockId);
    }
  } catch (error) {
    console.error('Queue processor error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { invalidateCache } from '@/lib/redis';

// Event types from edge functions
type EventType = 'transcription.complete' | 'translation.complete' | 'summarization.complete';

// Webhook payload structure
interface WebhookPayload {
  type: EventType;
  data: {
    id: string;
    status: 'completed' | 'error';
    error?: string;
    metadata?: Record<string, any>;
  };
  secret: string;
}

// Invalidate related caches based on event type
async function invalidateRelatedCaches(type: EventType, id: string) {
  const supabase = await createClient();
  
  switch (type) {
    case 'transcription.complete': {
      // Invalidate transcript cache
      await invalidateCache(`transcript:${id}`);
      
      // Get file ID to invalidate file cache
      const { data: transcript } = await supabase
        .from('transcripts')
        .select('file_id')
        .eq('id', id)
        .single();
      
      if (transcript?.file_id) {
        await invalidateCache(`file:${transcript.file_id}`);
        
        // Get user ID to invalidate user's files cache
        const { data: file } = await supabase
          .from('files')
          .select('owner_id')
          .eq('id', transcript.file_id)
          .single();
        
        if (file?.owner_id) {
          await invalidateCache(`user-files:${file.owner_id}:*`);
        }
      }
      break;
    }
    
    case 'translation.complete': {
      // Invalidate translation cache
      await invalidateCache(`translation:${id}`);
      
      // Get transcript ID to invalidate transcript cache
      const { data: translation } = await supabase
        .from('translations')
        .select('transcript_id, owner_id')
        .eq('id', id)
        .single();
      
      if (translation?.transcript_id) {
        await invalidateCache(`transcript:${translation.transcript_id}`);
      }
      
      if (translation?.owner_id) {
        await invalidateCache(`user-files:${translation.owner_id}:*`);
      }
      break;
    }
    
    case 'summarization.complete': {
      // Invalidate summary cache
      await invalidateCache(`summary:${id}`);
      
      // Get transcript ID to invalidate transcript cache
      const { data: summary } = await supabase
        .from('summaries')
        .select('transcript_id, owner_id')
        .eq('id', id)
        .single();
      
      if (summary?.transcript_id) {
        await invalidateCache(`transcript:${summary.transcript_id}`);
      }
      
      if (summary?.owner_id) {
        await invalidateCache(`user-files:${summary.owner_id}:*`);
      }
      break;
    }
  }
}

/**
 * Webhook endpoint for Edge Function completion notifications
 */
export async function POST(req: NextRequest) {
  try {
    // Parse webhook payload
    const payload = await req.json() as WebhookPayload;
    
    // Validate webhook secret
    const webhookSecret = process.env.WEBHOOK_SECRET;
    if (!webhookSecret || payload.secret !== webhookSecret) {
      return NextResponse.json(
        { success: false, error: 'Invalid webhook secret' },
        { status: 401 }
      );
    }
    
    // Validate payload
    if (!payload.type || !payload.data || !payload.data.id) {
      return NextResponse.json(
        { success: false, error: 'Invalid payload format' },
        { status: 400 }
      );
    }
    
    // Process based on event type and invalidate related caches
    await invalidateRelatedCaches(payload.type, payload.data.id);
    
    // Log the successful processing
    console.log(`Processed webhook event: ${payload.type} for ID: ${payload.data.id}`);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 
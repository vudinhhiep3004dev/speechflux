import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { updateUserUsage } from '@/lib/ai';

export const maxDuration = 300; // 5 minutes timeout for webhook processing

/**
 * POST handler for transcription webhooks
 * This route receives updates from external transcription services
 * and updates the database with the results
 */
export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature
    const signature = request.headers.get('x-webhook-signature');
    const webhookSecret = process.env.TRANSCRIPTION_WEBHOOK_SECRET;
    
    if (!signature || !webhookSecret) {
      console.error('Missing webhook signature or secret');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // TODO: Implement proper signature verification
    // For now, using a simple token-based verification
    if (signature !== webhookSecret) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get request body
    const body = await request.json();
    const { fileId, status, transcription, error, metadata } = body;
    
    if (!fileId || !status) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    const supabase = await createClient();
    
    // Get file information
    const { data: file, error: fileError } = await supabase
      .from('files')
      .select('owner_id, storage_path')
      .eq('id', fileId)
      .single();
    
    if (fileError || !file) {
      console.error('File not found:', fileId);
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }
    
    // Process based on status
    if (status === 'completed' && transcription) {
      // Extract transcription data
      const { text, segments = [], language = 'en', duration = 0 } = transcription;
      const wordCount = text.split(/\s+/).length;
      
      // Create transcript record
      const { data: transcript, error: transcriptError } = await supabase
        .from('transcripts')
        .insert({
          file_id: fileId,
          text,
          language,
          status: 'completed',
          model: metadata?.model || 'whisper-1',
          word_count: wordCount,
          duration,
          segments,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('id')
        .single();
      
      if (transcriptError) {
        console.error('Error creating transcript record:', transcriptError);
        return NextResponse.json(
          { error: 'Failed to save transcript' },
          { status: 500 }
        );
      }
      
      // Update file status
      await supabase
        .from('files')
        .update({
          status: 'completed',
          transcript_id: transcript.id,
          duration,
          updated_at: new Date().toISOString(),
        })
        .eq('id', fileId);
      
      // Update user's usage if duration is available
      if (duration > 0 && file.owner_id) {
        await updateUserUsage(file.owner_id, 'transcription', duration);
      }
      
      return NextResponse.json({ success: true, transcriptId: transcript.id });
    } else if (status === 'failed' || status === 'error') {
      // Update file status to error
      await supabase
        .from('files')
        .update({
          status: 'error',
          error_message: error || 'Transcription failed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', fileId);
      
      return NextResponse.json({ success: true, status: 'error_recorded' });
    } else if (status === 'processing') {
      // Update file status to processing
      await supabase
        .from('files')
        .update({
          status: 'processing',
          updated_at: new Date().toISOString(),
        })
        .eq('id', fileId);
      
      return NextResponse.json({ success: true, status: 'processing_recorded' });
    } else {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Webhook error:', error);
    
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 
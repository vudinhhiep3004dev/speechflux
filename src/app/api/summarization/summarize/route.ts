import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { addJobToQueue } from '@/lib/redis';
import { summarizeText } from '@/lib/ai/summarization/summarize';
import { SummarizationRequest } from '@/lib/ai/summarization';
import { SummaryLength } from '@/lib/ai';

/**
 * API endpoint to handle summarization requests
 */
export async function POST(req: NextRequest) {
  try {
    // Parse request
    const { transcriptId, length } = await req.json();
    
    // Validate input
    if (!transcriptId) {
      return NextResponse.json({ success: false, error: 'Transcript ID is required' }, { status: 400 });
    }
    
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if user has access to the transcript
    const { data: transcript, error: transcriptError } = await supabase
      .from('transcripts')
      .select('*')
      .eq('id', transcriptId)
      .single();
    
    if (transcriptError || !transcript) {
      return NextResponse.json(
        { success: false, error: 'Transcript not found' },
        { status: 404 }
      );
    }
    
    // Check if it's the user's transcript
    const { data: file, error: fileError } = await supabase
      .from('files')
      .select('owner_id')
      .eq('id', transcript.file_id)
      .single();
    
    if (fileError || !file) {
      return NextResponse.json(
        { success: false, error: 'Associated file not found' },
        { status: 404 }
      );
    }
    
    if (file.owner_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to summarize this transcript' },
        { status: 403 }
      );
    }
    
    // Check if summary already exists
    const { data: existingSummary, error: summaryCheckError } = await supabase
      .from('summaries')
      .select('*')
      .eq('transcript_id', transcriptId)
      .eq('length', length || SummaryLength.MEDIUM)
      .eq('status', 'completed')
      .maybeSingle();
    
    if (existingSummary) {
      return NextResponse.json({
        success: true,
        summary: existingSummary,
        message: 'Summary already exists'
      });
    }
    
    // Create summary record
    const { data: summary, error: summaryError } = await supabase
      .from('summaries')
      .insert({
        transcript_id: transcriptId,
        owner_id: user.id,
        length: length || SummaryLength.MEDIUM,
        status: 'processing',
        storage_path: `summaries/${transcriptId}_${length || SummaryLength.MEDIUM}.txt`,
        metadata_path: `summaries/${transcriptId}_${length || SummaryLength.MEDIUM}_metadata.json`,
      })
      .select()
      .single();
    
    if (summaryError) {
      return NextResponse.json(
        { success: false, error: `Failed to create summary record: ${summaryError.message}` },
        { status: 500 }
      );
    }
    
    // Queue summarization job
    await addJobToQueue('queue:summarization', {
      transcriptId,
      userId: user.id,
      length: length || SummaryLength.MEDIUM
    });
    
    return NextResponse.json({
      success: true,
      summary,
      message: 'Summarization started'
    });
  } catch (error) {
    console.error('Summarization API error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 
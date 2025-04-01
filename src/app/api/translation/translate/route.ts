import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { addJobToQueue } from '@/lib/redis';

/**
 * API endpoint to handle translation requests
 */
export async function POST(req: NextRequest) {
  try {
    // Parse request
    const { transcriptId, targetLanguage, sourceLanguage } = await req.json();
    
    // Validate input
    if (!transcriptId) {
      return NextResponse.json({ success: false, error: 'Transcript ID is required' }, { status: 400 });
    }
    
    if (!targetLanguage) {
      return NextResponse.json({ success: false, error: 'Target language is required' }, { status: 400 });
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
        { success: false, error: 'You do not have permission to translate this transcript' },
        { status: 403 }
      );
    }
    
    // Check if translation already exists
    const { data: existingTranslation, error: translationCheckError } = await supabase
      .from('translations')
      .select('*')
      .eq('transcript_id', transcriptId)
      .eq('target_language', targetLanguage)
      .eq('status', 'completed')
      .maybeSingle();
    
    if (existingTranslation) {
      return NextResponse.json({
        success: true,
        translation: existingTranslation,
        message: 'Translation already exists'
      });
    }
    
    // Create translation record
    const { data: translation, error: translationError } = await supabase
      .from('translations')
      .insert({
        transcript_id: transcriptId,
        owner_id: user.id,
        source_language: sourceLanguage || transcript.language || 'auto',
        target_language: targetLanguage,
        status: 'processing',
        storage_path: `translations/${transcriptId}_${targetLanguage}.txt`,
      })
      .select()
      .single();
    
    if (translationError) {
      return NextResponse.json(
        { success: false, error: `Failed to create translation record: ${translationError.message}` },
        { status: 500 }
      );
    }
    
    // Queue translation job
    await addJobToQueue('queue:translation', {
      transcriptId,
      userId: user.id,
      targetLanguage,
      sourceLanguage: sourceLanguage || transcript.language || 'auto'
    });
    
    return NextResponse.json({
      success: true,
      translation,
      message: 'Translation started'
    });
  } catch (error) {
    console.error('Translation API error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 
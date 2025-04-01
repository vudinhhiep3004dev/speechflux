import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { 
  transcribeAudio, 
  getAudioDuration,
  checkUserQuota,
  updateUserUsage,
  isFormatSupported,
} from '@/lib/ai';

export const maxDuration = 60; // 1 minute timeout for transcription

/**
 * POST handler for transcribing audio files
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get request body
    const body = await request.json();
    const { fileId, language } = body;
    
    if (!fileId) {
      return NextResponse.json(
        { error: 'Missing required parameter: fileId' },
        { status: 400 }
      );
    }
    
    // Get file information from database
    const { data: file, error: fileError } = await supabase
      .from('files')
      .select('*')
      .eq('id', fileId)
      .single();
    
    if (fileError || !file) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }
    
    // Check if user owns the file
    if (file.owner_id !== user.id) {
      return NextResponse.json(
        { error: 'Access denied: you do not own this file' },
        { status: 403 }
      );
    }
    
    // Check if the file is supported
    if (!isFormatSupported(file.mime_type)) {
      return NextResponse.json(
        { error: 'Unsupported file format' },
        { status: 400 }
      );
    }
    
    // Get a pre-signed URL for the file
    const { data: fileData, error: urlError } = await supabase
      .storage
      .from('audio')
      .createSignedUrl(file.storage_path, 60 * 5); // 5 minutes expiry
      
    if (urlError || !fileData?.signedUrl) {
      return NextResponse.json(
        { error: 'Could not get file URL' },
        { status: 500 }
      );
    }
    
    // Get file duration for quota calculation
    let fileDuration: number;
    try {
      fileDuration = await getAudioDuration(fileData.signedUrl);
    } catch (error) {
      // If we can't get the duration, make a reasonable estimate from the file size
      // using 128kbps as a standard bitrate
      fileDuration = Math.ceil(file.file_size / (128 * 1024 / 8));
    }
    
    // Round up to the nearest second
    fileDuration = Math.ceil(fileDuration);
    
    // Check user's quota
    const quotaCheck = await checkUserQuota(user.id, 'transcription', fileDuration);
    
    if (!quotaCheck.allowed) {
      return NextResponse.json(
        { error: quotaCheck.reason },
        { status: 403 }
      );
    }
    
    // Update the file status to processing
    await supabase
      .from('files')
      .update({
        status: 'processing',
        updated_at: new Date().toISOString(),
      })
      .eq('id', fileId);
    
    // Transcribe the audio file
    const transcriptionResult = await transcribeAudio(
      fileData.signedUrl,
      language,
      'verbose_json',
      true
    );
    
    if (!transcriptionResult.success || !transcriptionResult.data) {
      // Update file status to 'error'
      await supabase
        .from('files')
        .update({
          status: 'error',
          error_message: transcriptionResult.error || 'Transcription failed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', fileId);
      
      return NextResponse.json(
        { error: transcriptionResult.error || 'Transcription failed' },
        { status: 500 }
      );
    }
    
    // Extract useful data from the transcription
    const transcriptionData = transcriptionResult.data;
    const transcriptionText = transcriptionData.text;
    const wordCount = transcriptionText.split(/\s+/).length;
    const segments = transcriptionData.segments || [];
    const detectedLanguage = transcriptionData.language;
    
    // Create a new transcript record
    const { data: transcript, error: transcriptError } = await supabase
      .from('transcripts')
      .insert({
        file_id: fileId,
        text: transcriptionText,
        language: detectedLanguage || language || 'en',
        status: 'completed',
        model: 'whisper-1',
        word_count: wordCount,
        duration: fileDuration,
        segments: segments,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single();
    
    if (transcriptError) {
      console.error('Error creating transcript record:', transcriptError);
      
      return NextResponse.json(
        { error: 'Failed to save transcription' },
        { status: 500 }
      );
    }
    
    // Update the file status to 'completed'
    await supabase
      .from('files')
      .update({
        status: 'completed',
        duration: fileDuration,
        transcript_id: transcript.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', fileId);
    
    // Update user's usage
    await updateUserUsage(user.id, 'transcription', fileDuration);
    
    // Return the transcript data
    return NextResponse.json({
      success: true,
      transcriptId: transcript.id,
      text: transcriptionText,
      wordCount,
      duration: fileDuration,
      language: detectedLanguage || language || 'en',
    });
  } catch (error) {
    console.error('Transcription error:', error);
    
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 
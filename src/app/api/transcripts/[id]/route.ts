import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: transcriptId } = await params;
    
    if (!transcriptId) {
      return NextResponse.json(
        { success: false, error: 'Transcript ID is required' },
        { status: 400 }
      );
    }
    
    // Initialize Supabase client
    const supabase = await createClient();
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get the transcript
    const { data: transcript, error: transcriptError } = await supabase
      .from('transcripts')
      .select('*')
      .eq('id', transcriptId)
      .single();
    
    if (transcriptError) {
      return NextResponse.json(
        { success: false, error: 'Transcript not found' },
        { status: 404 }
      );
    }
    
    // Verify that the user owns the transcript
    if (transcript.owner_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized access to transcript' },
        { status: 403 }
      );
    }
    
    // Get content from storage if transcript is completed
    let content = null;
    
    if (transcript.status === 'completed' && transcript.storage_path) {
      try {
        const { data: transcriptContent, error: storageError } = await supabase
          .storage
          .from('transcripts')
          .download(transcript.storage_path);
        
        if (!storageError && transcriptContent) {
          content = await transcriptContent.text();
        }
      } catch (error) {
        console.error('Error fetching transcript content:', error);
        // Continue without content
      }
    }
    
    // Get the associated file details
    const { data: file, error: fileError } = await supabase
      .from('files')
      .select('filename, file_size, mime_type, created_at, duration')
      .eq('id', transcript.file_id)
      .single();
    
    // Get all translations for this transcript
    const { data: translations, error: translationsError } = await supabase
      .from('translations')
      .select('id, target_language, status, created_at, updated_at')
      .eq('transcript_id', transcriptId)
      .order('created_at', { ascending: false });
    
    // Return the transcript details
    return NextResponse.json({
      success: true,
      transcript: {
        ...transcript,
        content
      },
      file: file || null,
      translations: translations || []
    });
  } catch (error) {
    console.error('Error fetching transcript details:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get transcript details'
      },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: fileId } = await params;
    
    if (!fileId) {
      return NextResponse.json(
        { success: false, error: 'File ID is required' },
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
    
    // Get the file
    const { data: file, error: fileError } = await supabase
      .from('files')
      .select('*')
      .eq('id', fileId)
      .single();
    
    if (fileError) {
      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      );
    }
    
    // Verify that the user owns the file
    if (file.owner_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized access to file' },
        { status: 403 }
      );
    }
    
    // Get the transcript if available
    const { data: transcript, error: transcriptError } = await supabase
      .from('transcripts')
      .select('*')
      .eq('file_id', fileId)
      .maybeSingle();
    
    // Get content from storage if transcript exists and is completed
    let transcriptContent = null;
    
    if (transcript && transcript.status === 'completed' && transcript.storage_path) {
      try {
        const { data: content, error: storageError } = await supabase
          .storage
          .from('transcripts')
          .download(transcript.storage_path);
        
        if (!storageError && content) {
          transcriptContent = await content.text();
        }
      } catch (error) {
        console.error('Error fetching transcript content:', error);
        // Continue without content
      }
    }
    
    // Return the file and transcript details
    return NextResponse.json({
      success: true,
      file,
      transcript: transcript ? {
        ...transcript,
        content: transcriptContent
      } : null
    });
  } catch (error) {
    console.error('Error fetching file details:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get file details'
      },
      { status: 500 }
    );
  }
} 
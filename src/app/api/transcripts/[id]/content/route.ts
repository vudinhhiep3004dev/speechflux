import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: transcriptId } = await params;
    
    if (!transcriptId) {
      return NextResponse.json({ error: 'Transcript ID is required' }, { status: 400 });
    }
    
    // Initialize Supabase client
    const supabase = await createClient();
    
    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get the transcript including its content
    const { data: transcript, error: transcriptError } = await supabase
      .from('transcripts')
      .select('id, file_id, content, current_version_id')
      .eq('id', transcriptId)
      .single();
    
    if (transcriptError || !transcript) {
      return NextResponse.json({ error: 'Transcript not found' }, { status: 404 });
    }
    
    // Verify the user has access to this file
    const { data: file, error: fileError } = await supabase
      .from('files')
      .select('user_id')
      .eq('id', transcript.file_id)
      .single();
    
    if (fileError || !file || file.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // If the transcript has a current version, get that content
    if (transcript.current_version_id) {
      const { data: version, error: versionError } = await supabase
        .from('transcript_versions')
        .select('content')
        .eq('id', transcript.current_version_id)
        .single();
      
      if (!versionError && version) {
        // Return the content from the current version
        return NextResponse.json({ data: { content: version.content } });
      }
    }
    
    // If no current version or version not found, return the transcript content
    return NextResponse.json({ 
      data: { content: transcript.content || '' } 
    });
  } catch (error) {
    console.error('Error retrieving transcript content:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve transcript content' },
      { status: 500 }
    );
  }
} 
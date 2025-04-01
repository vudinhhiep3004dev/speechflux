import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: transcriptId } = await params;
    const { content } = await request.json();
    
    if (!transcriptId) {
      return NextResponse.json({ error: 'Transcript ID is required' }, { status: 400 });
    }

    if (content === undefined) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }
    
    // Initialize Supabase client
    const supabase = await createClient();
    
    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get the transcript to verify its existence and get its file ID
    const { data: transcript, error: transcriptError } = await supabase
      .from('transcripts')
      .select('id, file_id, current_version_id')
      .eq('id', transcriptId)
      .single();
    
    if (transcriptError || !transcript) {
      return NextResponse.json({ error: 'Transcript not found' }, { status: 404 });
    }
    
    // Verify user has access to this transcript through the file
    const { data: file, error: fileError } = await supabase
      .from('files')
      .select('user_id')
      .eq('id', transcript.file_id)
      .single();
    
    if (fileError || !file || file.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // Create a new version with the updated content
    const { data: newVersion, error: versionError } = await supabase
      .from('transcript_versions')
      .insert({
        transcript_id: transcriptId,
        content: content,
        user_id: user.id,
      })
      .select()
      .single();
    
    if (versionError) {
      console.error('Error creating transcript version:', versionError);
      return NextResponse.json(
        { error: 'Failed to create transcript version' },
        { status: 500 }
      );
    }
    
    // Update the transcript to point to the new version
    const { data: updatedTranscript, error: updateError } = await supabase
      .from('transcripts')
      .update({
        current_version_id: newVersion.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', transcriptId)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating transcript:', updateError);
      return NextResponse.json(
        { error: 'Failed to update transcript' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: {
        transcript: updatedTranscript,
        version: newVersion
      }
    });
  } catch (error) {
    console.error('Error updating transcript:', error);
    return NextResponse.json(
      { error: 'Failed to update transcript' },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: transcriptId } = await params;
    const { versionId } = await request.json();
    
    if (!transcriptId || !versionId) {
      return NextResponse.json({ 
        error: 'Transcript ID and version ID are required' 
      }, { status: 400 });
    }
    
    // Initialize Supabase client
    const supabase = await createClient();
    
    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Verify transcript exists and belongs to user
    const { data: transcript, error: transcriptError } = await supabase
      .from('transcripts')
      .select('id, file_id')
      .eq('id', transcriptId)
      .single();
    
    if (transcriptError || !transcript) {
      return NextResponse.json({ error: 'Transcript not found' }, { status: 404 });
    }
    
    // Verify user has access to this transcript
    const { data: file, error: fileError } = await supabase
      .from('files')
      .select('user_id')
      .eq('id', transcript.file_id)
      .single();
    
    if (fileError || !file || file.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // Verify the version exists and belongs to this transcript
    const { data: version, error: versionFetchError } = await supabase
      .from('transcript_versions')
      .select('id, content')
      .eq('id', versionId)
      .eq('transcript_id', transcriptId)
      .single();
    
    if (versionFetchError || !version) {
      return NextResponse.json({ 
        error: 'Version not found or does not belong to this transcript' 
      }, { status: 404 });
    }
    
    // Save the current version to history
    const { data: currentVersion, error: currentVersionError } = await supabase
      .from('transcripts')
      .select('current_version_id')
      .eq('id', transcriptId)
      .single();
    
    if (currentVersion && currentVersion.current_version_id) {
      // Create a new transcript version from the current state
      await supabase.from('transcript_versions').insert({
        transcript_id: transcriptId,
        user_id: user.id,
        restored_from_version_id: versionId
      });
    }
    
    // Update the transcript with the version content and set as current
    const { data: updatedTranscript, error: updateError } = await supabase
      .from('transcripts')
      .update({
        current_version_id: versionId,
        updated_at: new Date().toISOString()
      })
      .eq('id', transcriptId)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error restoring transcript version:', updateError);
      return NextResponse.json(
        { error: 'Failed to restore transcript version' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      success: true,
      data: { 
        transcript: updatedTranscript,
        restoredVersion: version 
      }
    });
  } catch (error) {
    console.error('Error restoring transcript version:', error);
    return NextResponse.json(
      { error: 'Failed to restore transcript version' },
      { status: 500 }
    );
  }
} 
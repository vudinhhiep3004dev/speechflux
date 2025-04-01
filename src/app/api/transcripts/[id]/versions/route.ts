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
    
    // Get the transcript to verify ownership
    const { data: transcript, error: transcriptError } = await supabase
      .from('transcripts')
      .select('id, file_id, current_version_id')
      .eq('id', transcriptId)
      .single();
    
    if (transcriptError || !transcript) {
      return NextResponse.json({ error: 'Transcript not found' }, { status: 404 });
    }
    
    // Verify ownership by checking the file's user_id
    const { data: file, error: fileError } = await supabase
      .from('files')
      .select('user_id')
      .eq('id', transcript.file_id)
      .single();
    
    if (fileError || !file || file.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // Get transcript versions
    const { data: versions, error: versionsError } = await supabase
      .from('transcript_versions')
      .select('id, transcript_id, created_at, user_id')
      .eq('transcript_id', transcriptId)
      .order('created_at', { ascending: false });
    
    if (versionsError || !versions) {
      return NextResponse.json({ data: [] });
    }
    
    // Get unique user IDs to fetch their profiles
    const userIds = new Set<string>();
    versions.forEach(version => userIds.add(version.user_id));
    
    // Fetch user profiles for each version
    const usersData: Record<string, { id: string; name: string }> = {};
    
    // Convert Set to Array with proper typing
    const userIdArray = Array.from(userIds);
    
    for (const userId of userIdArray) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('id', userId)
        .single();
      
      if (profile) {
        usersData[profile.id] = {
          id: profile.id,
          name: profile.full_name || profile.email || 'Unknown User',
        };
      }
    }
    
    // Map versions with user data
    const versionsWithUsers = versions.map(version => ({
      id: version.id,
      transcriptId: version.transcript_id,
      createdAt: version.created_at,
      user: usersData[version.user_id] || { id: version.user_id, name: 'Unknown User' },
      isCurrent: version.id === transcript.current_version_id,
    }));
    
    return NextResponse.json({ data: versionsWithUsers });
  } catch (error) {
    console.error('Error retrieving transcript versions:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve transcript versions' },
      { status: 500 }
    );
  }
} 
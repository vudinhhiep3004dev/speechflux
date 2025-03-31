import { NextRequest, NextResponse } from 'next/server';
import { getPresignedDownloadUrl } from '@/lib/storage/download';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get fileId from URL params
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');
    
    if (!fileId) {
      return NextResponse.json(
        { error: 'Missing fileId parameter' },
        { status: 400 }
      );
    }
    
    // Get the file record from database first
    const { data: fileRecord, error: fileError } = await supabase
      .from('files')
      .select('*')
      .eq('id', fileId)
      .single();
    
    if (fileError || !fileRecord) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }
    
    // Verify ownership or access permissions
    if (fileRecord.user_id !== user.id) {
      // Check if this file is shared or public
      // Future improvement: implement file sharing logic
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }
    
    // Generate presigned URL for download
    const result = await getPresignedDownloadUrl(fileRecord.key);
    
    if (!result.success || !result.url) {
      return NextResponse.json(
        { error: result.error || 'Failed to generate download URL' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      url: result.url,
      filename: fileRecord.filename,
      contentType: fileRecord.content_type,
    });
  } catch (error) {
    console.error('Error in download API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
} 
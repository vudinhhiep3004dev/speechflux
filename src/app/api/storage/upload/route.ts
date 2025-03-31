import { NextRequest, NextResponse } from 'next/server';
import { getPresignedUploadUrl, createFileRecord } from '@/lib/storage/upload';
import { createClient } from '@/utils/supabase/server';
import { StorageBucket } from '@/lib/storage';

export async function POST(request: NextRequest) {
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
    
    // Parse request body
    const { filename, contentType, type = 'AUDIO', fileSize } = await request.json();
    
    if (!filename || !contentType || !fileSize) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Generate presigned URL
    const result = await getPresignedUploadUrl(
      user.id,
      filename,
      contentType,
      type as StorageBucket
    );
    
    if (!result.success || !result.url || !result.key) {
      return NextResponse.json(
        { error: result.error || 'Failed to generate upload URL' },
        { status: 500 }
      );
    }
    
    // Create file record in the database
    const fileRecord = await createFileRecord(
      user.id,
      result.key,
      filename,
      fileSize,
      contentType
    );
    
    return NextResponse.json({
      success: true,
      url: result.url,
      key: result.key,
      fileId: fileRecord.id,
    });
  } catch (error) {
    console.error('Error in upload API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * API endpoint to check the status of a summary
 */
export async function GET(req: NextRequest) {
  try {
    // Get the summary ID from the query parameters
    const url = new URL(req.url);
    const summaryId = url.searchParams.get('id');
    
    if (!summaryId) {
      return NextResponse.json(
        { success: false, error: 'Missing summary ID' },
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
    
    // Get the summary record
    const { data: summary, error: summaryError } = await supabase
      .from('summaries')
      .select('*')
      .eq('id', summaryId)
      .single();
    
    if (summaryError) {
      return NextResponse.json(
        { success: false, error: 'Summary not found' },
        { status: 404 }
      );
    }
    
    // Check that the user owns the summary
    if (summary.owner_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized access to summary' },
        { status: 403 }
      );
    }
    
    // If the summary is completed, get the content and metadata
    let content = null;
    let metadata = null;
    
    if (summary.status === 'completed') {
      // Get content
      try {
        const { data: summaryContent, error: storageError } = await supabase
          .storage
          .from('summaries')
          .download(summary.storage_path);
        
        if (!storageError && summaryContent) {
          content = await summaryContent.text();
        }
      } catch (error) {
        console.error('Error fetching summary content:', error);
        // Continue without content
      }
      
      // Get metadata if available
      if (summary.metadata_path) {
        try {
          const { data: metadataContent, error: metadataError } = await supabase
            .storage
            .from('summaries')
            .download(summary.metadata_path);
          
          if (!metadataError && metadataContent) {
            metadata = JSON.parse(await metadataContent.text());
          }
        } catch (error) {
          console.error('Error fetching summary metadata:', error);
          // Continue without metadata
        }
      }
    }
    
    // Return the summary status, content and metadata if available
    return NextResponse.json({
      success: true,
      summary: {
        ...summary,
        content,
        metadata
      }
    });
  } catch (error) {
    console.error('Summary status API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 
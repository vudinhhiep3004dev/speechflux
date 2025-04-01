import { createClient } from '@/utils/supabase/client';
import { SummarizationRequest, SummarizationResponse } from '@/lib/ai/summarization';
import { SummaryLength } from '@/lib/ai';

/**
 * Request a summary for a transcript
 * 
 * @param transcriptId The ID of the transcript to summarize
 * @param length The desired summary length
 * @returns Summarization response with status and ID
 */
export async function requestSummary(
  transcriptId: string,
  length: SummaryLength = SummaryLength.MEDIUM
): Promise<SummarizationResponse> {
  try {
    const supabase = createClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // Create a new summary entry
    const { data: summary, error: summaryError } = await supabase
      .from('summaries')
      .insert({
        transcript_id: transcriptId,
        owner_id: user.id,
        length: length,
        status: 'processing',
        storage_path: `summaries/${transcriptId}_${length}.txt`,
      })
      .select()
      .single();
    
    if (summaryError) {
      throw new Error(`Failed to create summary record: ${summaryError.message}`);
    }
    
    // Call summarization API
    const response = await fetch('/api/summarization/summarize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transcriptId,
        length
      } as SummarizationRequest),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to start summarization process');
    }
    
    return {
      success: true,
      summary: {
        id: summary.id,
        transcript_id: summary.transcript_id,
        length: summary.length,
        status: summary.status,
        created_at: summary.created_at,
      },
    };
  } catch (error) {
    console.error('Summarization request error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error requesting summarization',
    };
  }
}

/**
 * Get the status and content of a summary
 * 
 * @param summaryId The ID of the summary to retrieve
 * @returns Summary data including content and metadata if available
 */
export async function getSummary(summaryId: string) {
  try {
    const supabase = createClient();
    
    // Get summary record
    const { data: summary, error: summaryError } = await supabase
      .from('summaries')
      .select('*')
      .eq('id', summaryId)
      .single();
    
    if (summaryError) {
      throw new Error(`Failed to get summary: ${summaryError.message}`);
    }
    
    // If summary is completed, get content from storage
    if (summary.status === 'completed') {
      const { data: content, error: storageError } = await supabase
        .storage
        .from('summaries')
        .download(summary.storage_path);
      
      if (storageError) {
        throw new Error(`Failed to get summary content: ${storageError.message}`);
      }
      
      const textContent = await content.text();
      
      // Get metadata if available
      let metadata = null;
      
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
          console.error('Error retrieving summary metadata:', error);
          // Continue without metadata
        }
      }
      
      return {
        success: true,
        summary: {
          ...summary,
          content: textContent,
          metadata,
        },
      };
    }
    
    // Return summary without content if not completed
    return {
      success: true,
      summary,
    };
  } catch (error) {
    console.error('Get summary error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error retrieving summary',
    };
  }
}

/**
 * Get summaries for a specific transcript
 * 
 * @param transcriptId The ID of the transcript
 * @returns List of summaries for the transcript
 */
export async function getSummariesForTranscript(transcriptId: string) {
  try {
    const supabase = createClient();
    
    const { data: summaries, error } = await supabase
      .from('summaries')
      .select('*')
      .eq('transcript_id', transcriptId)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw new Error(`Failed to get summaries: ${error.message}`);
    }
    
    return {
      success: true,
      summaries,
    };
  } catch (error) {
    console.error('List summaries error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error listing summaries',
    };
  }
}

/**
 * Delete a summary
 * 
 * @param summaryId The ID of the summary to delete
 * @returns Success status
 */
export async function deleteSummary(summaryId: string) {
  try {
    const supabase = createClient();
    
    // Get summary record first to get storage paths
    const { data: summary, error: getError } = await supabase
      .from('summaries')
      .select('storage_path, metadata_path')
      .eq('id', summaryId)
      .single();
    
    if (getError) {
      throw new Error(`Failed to get summary: ${getError.message}`);
    }
    
    // Delete from storage if it exists
    const filesToDelete = [];
    if (summary.storage_path) {
      filesToDelete.push(summary.storage_path);
    }
    if (summary.metadata_path) {
      filesToDelete.push(summary.metadata_path);
    }
    
    if (filesToDelete.length > 0) {
      const { error: storageError } = await supabase
        .storage
        .from('summaries')
        .remove(filesToDelete);
      
      if (storageError) {
        console.error(`Failed to delete summary files: ${storageError.message}`);
        // Continue with record deletion even if file deletion fails
      }
    }
    
    // Delete the record
    const { error: deleteError } = await supabase
      .from('summaries')
      .delete()
      .eq('id', summaryId);
    
    if (deleteError) {
      throw new Error(`Failed to delete summary record: ${deleteError.message}`);
    }
    
    return {
      success: true,
    };
  } catch (error) {
    console.error('Delete summary error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error deleting summary',
    };
  }
} 
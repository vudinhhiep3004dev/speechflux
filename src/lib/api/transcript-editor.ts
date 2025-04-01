import { EditorState } from 'lexical';

interface TranscriptVersion {
  id: string;
  transcriptId: string;
  content: string;
  createdAt: string;
  userId: string;
}

/**
 * Save the current state of the transcript editor
 */
export async function saveTranscriptEdit(
  transcriptId: string,
  content: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`/api/transcripts/${transcriptId}/edit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.error || 'Failed to save transcript' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error saving transcript edit:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

/**
 * Retrieve the latest version of a transcript
 */
export async function getTranscriptContent(
  transcriptId: string
): Promise<{ content: string; success: boolean; error?: string }> {
  try {
    const response = await fetch(`/api/transcripts/${transcriptId}/content`);

    if (!response.ok) {
      const errorData = await response.json();
      return { 
        content: '', 
        success: false, 
        error: errorData.error || 'Failed to fetch transcript content' 
      };
    }

    const data = await response.json();
    return { content: data.content, success: true };
  } catch (error) {
    console.error('Error fetching transcript content:', error);
    return { 
      content: '', 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

/**
 * Get the version history for a transcript
 */
export async function getTranscriptVersionHistory(
  transcriptId: string
): Promise<{ versions: TranscriptVersion[]; success: boolean; error?: string }> {
  try {
    const response = await fetch(`/api/transcripts/${transcriptId}/versions`);

    if (!response.ok) {
      const errorData = await response.json();
      return { 
        versions: [], 
        success: false, 
        error: errorData.error || 'Failed to fetch transcript versions' 
      };
    }

    const data = await response.json();
    return { versions: data.versions, success: true };
  } catch (error) {
    console.error('Error fetching transcript versions:', error);
    return { 
      versions: [], 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

/**
 * Restore a previous version of a transcript
 */
export async function restoreTranscriptVersion(
  transcriptId: string,
  versionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`/api/transcripts/${transcriptId}/restore`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ versionId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.error || 'Failed to restore transcript version' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error restoring transcript version:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
} 
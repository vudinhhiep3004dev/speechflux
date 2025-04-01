import { createClient } from '@/utils/supabase/client';
import { TranslationRequest, TranslationResponse } from '@/lib/ai/translation';

/**
 * Request a translation for a transcript
 * 
 * @param transcriptId The ID of the transcript to translate
 * @param targetLanguage The language to translate to
 * @param sourceLanguage Optional source language (if not provided, will be auto-detected)
 * @returns Translation response with status and ID
 */
export async function requestTranslation(
  transcriptId: string,
  targetLanguage: string,
  sourceLanguage?: string
): Promise<TranslationResponse> {
  try {
    const supabase = createClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // Create a new translation entry
    const { data: translation, error: translationError } = await supabase
      .from('translations')
      .insert({
        transcript_id: transcriptId,
        owner_id: user.id,
        source_language: sourceLanguage || 'auto',
        target_language: targetLanguage,
        status: 'processing',
        storage_path: `translations/${transcriptId}_${targetLanguage}.txt`,
      })
      .select()
      .single();
    
    if (translationError) {
      throw new Error(`Failed to create translation record: ${translationError.message}`);
    }
    
    // Call translation API
    const response = await fetch('/api/translation/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transcriptId,
        targetLanguage,
        sourceLanguage
      } as TranslationRequest),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to start translation process');
    }
    
    return {
      success: true,
      translation: {
        id: translation.id,
        transcript_id: translation.transcript_id,
        target_language: translation.target_language,
        source_language: translation.source_language,
        status: translation.status,
        created_at: translation.created_at,
      },
    };
  } catch (error) {
    console.error('Translation request error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error requesting translation',
    };
  }
}

/**
 * Get the status and content of a translation
 * 
 * @param translationId The ID of the translation to retrieve
 * @returns Translation data including content if available
 */
export async function getTranslation(translationId: string) {
  try {
    const supabase = createClient();
    
    // Get translation record
    const { data: translation, error: translationError } = await supabase
      .from('translations')
      .select('*')
      .eq('id', translationId)
      .single();
    
    if (translationError) {
      throw new Error(`Failed to get translation: ${translationError.message}`);
    }
    
    // If translation is completed, get content from storage
    if (translation.status === 'completed') {
      const { data: content, error: storageError } = await supabase
        .storage
        .from('translations')
        .download(translation.storage_path);
      
      if (storageError) {
        throw new Error(`Failed to get translation content: ${storageError.message}`);
      }
      
      const textContent = await content.text();
      
      return {
        success: true,
        translation: {
          ...translation,
          content: textContent,
        },
      };
    }
    
    // Return translation without content if not completed
    return {
      success: true,
      translation,
    };
  } catch (error) {
    console.error('Get translation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error retrieving translation',
    };
  }
}

/**
 * List all translations for a specific transcript
 * 
 * @param transcriptId The ID of the transcript
 * @returns List of translations for the transcript
 */
export async function getTranslationsForTranscript(transcriptId: string) {
  try {
    const supabase = createClient();
    
    const { data: translations, error } = await supabase
      .from('translations')
      .select('*')
      .eq('transcript_id', transcriptId)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw new Error(`Failed to get translations: ${error.message}`);
    }
    
    return {
      success: true,
      translations,
    };
  } catch (error) {
    console.error('List translations error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error listing translations',
    };
  }
}

/**
 * Delete a translation
 * 
 * @param translationId The ID of the translation to delete
 * @returns Success status
 */
export async function deleteTranslation(translationId: string) {
  try {
    const supabase = createClient();
    
    // Get translation record first to get storage path
    const { data: translation, error: getError } = await supabase
      .from('translations')
      .select('storage_path')
      .eq('id', translationId)
      .single();
    
    if (getError) {
      throw new Error(`Failed to get translation: ${getError.message}`);
    }
    
    // Delete from storage if it exists
    if (translation.storage_path) {
      const { error: storageError } = await supabase
        .storage
        .from('translations')
        .remove([translation.storage_path]);
      
      if (storageError) {
        console.error(`Failed to delete translation file: ${storageError.message}`);
        // Continue with record deletion even if file deletion fails
      }
    }
    
    // Delete the record
    const { error: deleteError } = await supabase
      .from('translations')
      .delete()
      .eq('id', translationId);
    
    if (deleteError) {
      throw new Error(`Failed to delete translation record: ${deleteError.message}`);
    }
    
    return {
      success: true,
    };
  } catch (error) {
    console.error('Delete translation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error deleting translation',
    };
  }
} 
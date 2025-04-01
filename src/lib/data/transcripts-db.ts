import { createServerSupabaseClient } from '../auth/supabase-server';
import { createClient } from '../auth/supabase-auth';
import { 
  TranscriptRecord, 
  InsertTables,
  TranscriptVersionRecord,
  UpdateTables
} from '@/types/supabase';

// Server-side functions
export async function getTranscriptById(transcriptId: string): Promise<TranscriptRecord | null> {
  const supabase = await createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from('transcripts')
    .select('*')
    .eq('id', transcriptId)
    .single();
  
  if (error) {
    console.error('Error fetching transcript:', error);
    return null;
  }
  
  return data;
}

export async function createTranscript(transcriptData: InsertTables<'transcripts'>): Promise<TranscriptRecord> {
  const supabase = await createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from('transcripts')
    .insert(transcriptData)
    .select()
    .single();
  
  if (error) {
    console.error('Error creating transcript:', error);
    throw error;
  }
  
  return data;
}

export async function updateTranscript(
  transcriptId: string, 
  updateData: UpdateTables<'transcripts'>
): Promise<TranscriptRecord> {
  const supabase = await createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from('transcripts')
    .update(updateData)
    .eq('id', transcriptId)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating transcript:', error);
    throw error;
  }
  
  return data;
}

export async function getTranscriptVersions(
  transcriptId: string
): Promise<TranscriptVersionRecord[]> {
  const supabase = await createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from('transcript_versions')
    .select('*')
    .eq('transcript_id', transcriptId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching transcript versions:', error);
    throw error;
  }
  
  return data || [];
}

export async function createTranscriptVersion(
  versionData: InsertTables<'transcript_versions'>
): Promise<TranscriptVersionRecord> {
  const supabase = await createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from('transcript_versions')
    .insert(versionData)
    .select()
    .single();
  
  if (error) {
    console.error('Error creating transcript version:', error);
    throw error;
  }
  
  return data;
}

// Client-side functions for transcripts
export function useClientTranscripts() {
  const supabase = createClient();
  
  return {
    async getTranscript(transcriptId: string): Promise<TranscriptRecord | null> {
      const { data, error } = await supabase
        .from('transcripts')
        .select('*')
        .eq('id', transcriptId)
        .single();
      
      if (error) {
        console.error('Error fetching transcript:', error);
        return null;
      }
      
      return data;
    },
    
    async saveTranscriptChanges(
      transcriptId: string, 
      content: string, 
      userId: string
    ): Promise<boolean> {
      try {
        // First get the current transcript
        const { data: transcript, error: fetchError } = await supabase
          .from('transcripts')
          .select('*')
          .eq('id', transcriptId)
          .single();
        
        if (fetchError || !transcript) {
          console.error('Error fetching transcript:', fetchError);
          return false;
        }
        
        // Save the current version in transcript_versions table
        const { error: versionError } = await supabase
          .from('transcript_versions')
          .insert({
            transcript_id: transcriptId,
            content: transcript.content,
            created_by: userId,
          });
        
        if (versionError) {
          console.error('Error creating transcript version:', versionError);
          return false;
        }
        
        // Update the transcript with new content
        const { error: updateError } = await supabase
          .from('transcripts')
          .update({ 
            content,
            last_edited_by: userId,
            last_edited_at: new Date().toISOString()
          })
          .eq('id', transcriptId);
        
        if (updateError) {
          console.error('Error updating transcript:', updateError);
          return false;
        }
        
        return true;
      } catch (error) {
        console.error('Error saving transcript changes:', error);
        return false;
      }
    },
    
    async getTranscriptVersions(transcriptId: string): Promise<TranscriptVersionRecord[]> {
      const { data, error } = await supabase
        .from('transcript_versions')
        .select('*')
        .eq('transcript_id', transcriptId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching transcript versions:', error);
        return [];
      }
      
      return data || [];
    }
  };
} 
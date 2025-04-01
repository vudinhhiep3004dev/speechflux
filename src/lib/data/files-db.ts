import { createServerSupabaseClient } from '../auth/supabase-server';
import { createClient } from '../auth/supabase-auth';
import { 
  FileRecord, 
  InsertTables, 
  TranscriptRecord, 
  Tables,
  UpdateTables
} from '@/types/supabase';

// Server-side functions
export async function getFilesByUser(userId: string): Promise<FileRecord[]> {
  const supabase = await createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from('files')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching files:', error);
    throw error;
  }
  
  return data || [];
}

export async function getFileById(fileId: string): Promise<FileRecord | null> {
  const supabase = await createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from('files')
    .select('*')
    .eq('id', fileId)
    .single();
  
  if (error) {
    console.error('Error fetching file:', error);
    return null;
  }
  
  return data;
}

export async function createFile(fileData: InsertTables<'files'>): Promise<FileRecord> {
  const supabase = await createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from('files')
    .insert(fileData)
    .select()
    .single();
  
  if (error) {
    console.error('Error creating file:', error);
    throw error;
  }
  
  return data;
}

export async function updateFile(fileId: string, updateData: UpdateTables<'files'>): Promise<FileRecord> {
  const supabase = await createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from('files')
    .update(updateData)
    .eq('id', fileId)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating file:', error);
    throw error;
  }
  
  return data;
}

export async function deleteFile(fileId: string): Promise<void> {
  const supabase = await createServerSupabaseClient();
  
  const { error } = await supabase
    .from('files')
    .delete()
    .eq('id', fileId);
  
  if (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
}

export async function getTranscriptsByFileId(fileId: string): Promise<TranscriptRecord[]> {
  const supabase = await createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from('transcripts')
    .select('*')
    .eq('file_id', fileId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching transcripts:', error);
    throw error;
  }
  
  return data || [];
}

// Client-side functions
export function useClientFiles() {
  const supabase = createClient();
  
  return {
    async getUserFiles(): Promise<FileRecord[]> {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return [];
      }
      
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching files:', error);
        return [];
      }
      
      return data || [];
    },
    
    async getFile(fileId: string): Promise<FileRecord | null> {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('id', fileId)
        .single();
      
      if (error) {
        console.error('Error fetching file:', error);
        return null;
      }
      
      return data;
    },
    
    async uploadFile(file: File, userId: string): Promise<string | null> {
      // Generate a unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;
      const filePath = `uploads/${fileName}`;
      
      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('files')
        .upload(filePath, file);
      
      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        return null;
      }
      
      return filePath;
    }
  };
} 
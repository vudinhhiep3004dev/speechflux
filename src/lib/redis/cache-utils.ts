'use server';

import { cacheData, getCachedData, invalidateCache } from './client';
import { createClient } from '@/utils/supabase/server';
import { Cache } from './types';

// Cache key prefixes
const CACHE_KEYS = {
  FILE: 'file:',
  TRANSCRIPT: 'transcript:',
  TRANSLATION: 'translation:',
  SUMMARY: 'summary:',
  USER_FILES: 'user-files:'
};

// Cache TTLs (in seconds)
const CACHE_TTL = {
  FILE: 3600, // 1 hour
  TRANSCRIPT: 3600 * 24, // 24 hours
  TRANSLATION: 3600 * 24, // 24 hours
  SUMMARY: 3600 * 24, // 24 hours
  USER_FILES: 300, // 5 minutes
};

/**
 * Fetches a file from cache or database
 * @param fileId - The ID of the file to fetch
 * @returns The file data
 */
export async function getFileWithCache(fileId: string): Promise<any> {
  const cacheKey = `${CACHE_KEYS.FILE}${fileId}`;
  
  // Try to get from cache first
  const cachedFile = await getCachedData(cacheKey);
  if (cachedFile) {
    return cachedFile;
  }
  
  // Fetch from database
  const supabase = await createClient();
  const { data: file, error } = await supabase
    .from('files')
    .select('*')
    .eq('id', fileId)
    .single();
  
  if (error || !file) {
    return null;
  }
  
  // Cache the result
  await cacheData(cacheKey, file, CACHE_TTL.FILE);
  
  return file;
}

/**
 * Fetches a user's files from cache or database
 * @param userId - The ID of the user
 * @param limit - Maximum number of files to return
 * @returns Array of file data
 */
export async function getUserFilesWithCache(userId: string, limit: number = 10): Promise<any[]> {
  const cacheKey = `${CACHE_KEYS.USER_FILES}${userId}:${limit}`;
  
  // Try to get from cache first
  const cachedFiles = await getCachedData<any[]>(cacheKey);
  if (cachedFiles) {
    return cachedFiles;
  }
  
  // Fetch from database
  const supabase = await createClient();
  const { data: files, error } = await supabase
    .from('files')
    .select('*')
    .eq('owner_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error || !files) {
    return [];
  }
  
  // Cache the result
  await cacheData(cacheKey, files, CACHE_TTL.USER_FILES);
  
  return files;
}

/**
 * Fetches a transcript from cache or database
 * @param transcriptId - The ID of the transcript to fetch
 * @returns The transcript data and content
 */
export async function getTranscriptWithCache(transcriptId: string): Promise<any> {
  const cacheKey = `${CACHE_KEYS.TRANSCRIPT}${transcriptId}`;
  
  // Try to get from cache first
  const cachedTranscript = await getCachedData(cacheKey);
  if (cachedTranscript) {
    return cachedTranscript;
  }
  
  // Fetch from database
  const supabase = await createClient();
  const { data: transcript, error } = await supabase
    .from('transcripts')
    .select('*')
    .eq('id', transcriptId)
    .single();
  
  if (error || !transcript) {
    return null;
  }
  
  // Fetch transcript content
  const { data: content, error: contentError } = await supabase
    .storage
    .from('transcripts')
    .download(transcript.storage_path);
  
  if (contentError || !content) {
    return transcript; // Return metadata only if content not available
  }
  
  const result = {
    ...transcript,
    content: await content.text()
  };
  
  // Cache the result
  await cacheData(cacheKey, result, CACHE_TTL.TRANSCRIPT);
  
  return result;
}

/**
 * Invalidates all caches related to a file
 * @param fileId - The ID of the file
 */
export async function invalidateFileCache(fileId: string): Promise<void> {
  // Invalidate file cache
  await invalidateCache(`${CACHE_KEYS.FILE}${fileId}`);
  
  // Get related transcript to invalidate its cache too
  const supabase = await createClient();
  const { data: transcript } = await supabase
    .from('transcripts')
    .select('id')
    .eq('file_id', fileId)
    .single();
  
  if (transcript) {
    await invalidateCache(`${CACHE_KEYS.TRANSCRIPT}${transcript.id}`);
  }
  
  // Get user ID to invalidate user's files cache
  const { data: file } = await supabase
    .from('files')
    .select('owner_id')
    .eq('id', fileId)
    .single();
  
  if (file) {
    await invalidateCache(`${CACHE_KEYS.USER_FILES}${file.owner_id}:*`);
  }
} 
# SpeechFlux - AI Service Integration

This document outlines how SpeechFlux integrates with OpenAI services for speech-to-text transcription, translation, and summarization functionality.

## 1. OpenAI Whisper API Integration (Speech-to-Text)

### Implementation Overview

The Whisper API will be integrated using Supabase Edge Functions to process audio files uploaded by users.

### API Integration

```typescript
// lib/ai/whisper.ts
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function transcribeAudio(
  audioFilePath: string,
  language?: string,
  responseFormat: 'json' | 'text' | 'srt' | 'verbose_json' | 'vtt' = 'json'
) {
  try {
    const response = await openai.audio.transcriptions.create({
      file: await fetch(audioFilePath),
      model: 'whisper-1',
      language,
      response_format: responseFormat,
      temperature: 0.2,
    });
    
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('Whisper API error:', error);
    return {
      success: false,
      error: error.message || 'Failed to transcribe audio'
    };
  }
}
```

### Edge Function Implementation

```typescript
// edge-functions/whisper-transcribe/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { transcribeAudio } from '../_shared/whisper.ts';

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    const { audioFileUrl, fileId, language } = await req.json();
    
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Update file status
    await supabase
      .from('files')
      .update({ status: 'processing' })
      .eq('id', fileId);
    
    // Call Whisper API
    const transcriptionResult = await transcribeAudio(audioFileUrl, language);
    
    if (!transcriptionResult.success) {
      throw new Error(transcriptionResult.error);
    }
    
    // Save transcript to R2 storage
    const transcriptContent = typeof transcriptionResult.data === 'string' 
      ? transcriptionResult.data 
      : JSON.stringify(transcriptionResult.data);
    
    const fileName = `transcripts/${fileId}.json`;
    
    // Upload to R2 via Supabase Storage
    const { error: uploadError } = await supabase
      .storage
      .from('transcripts')
      .upload(fileName, transcriptContent, {
        contentType: 'application/json',
        upsert: true
      });
      
    if (uploadError) {
      throw new Error(`Failed to upload transcript: ${uploadError.message}`);
    }
    
    // Get public URL
    const { data: urlData } = supabase
      .storage
      .from('transcripts')
      .getPublicUrl(fileName);
      
    // Create transcript record
    const { data: transcript, error: transcriptError } = await supabase
      .from('transcripts')
      .insert({
        file_id: fileId,
        storage_path: fileName,
        status: 'completed',
        language_code: language || 'auto',
        // Add word count and other metadata
        word_count: transcriptionResult.data.text?.split(/\s+/).length || 0,
      })
      .select()
      .single();
      
    if (transcriptError) {
      throw new Error(`Failed to create transcript record: ${transcriptError.message}`);
    }
    
    // Update file status
    await supabase
      .from('files')
      .update({ status: 'transcribed' })
      .eq('id', fileId);
    
    return new Response(JSON.stringify({ success: true, transcript }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error in transcription function:', error);
    
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
```

## 2. OpenAI GPT-4o-mini Integration (Translation)

### Implementation Overview

The GPT-4o-mini API will be used to translate transcript content to different languages using Supabase Edge Functions.

### API Integration

```typescript
// lib/ai/gpt.ts
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function translateText(
  text: string,
  targetLanguage: string,
  sourceLanguage?: string
) {
  try {
    const prompt = sourceLanguage
      ? `Translate the following ${sourceLanguage} text to ${targetLanguage}:\n\n${text}`
      : `Translate the following text to ${targetLanguage}:\n\n${text}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a professional translator. Translate the text accurately while preserving meaning, tone, and formatting. Do not add any additional commentary.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 4096
    });
    
    return {
      success: true,
      data: response.choices[0].message.content.trim()
    };
  } catch (error) {
    console.error('GPT API error:', error);
    return {
      success: false,
      error: error.message || 'Failed to translate text'
    };
  }
}
```

### Edge Function Implementation

```typescript
// edge-functions/translate-text/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { translateText } from '../_shared/gpt.ts';

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    const { transcriptId, targetLanguage, sourceLanguage } = await req.json();
    
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get transcript
    const { data: transcriptData, error: transcriptError } = await supabase
      .from('transcripts')
      .select('storage_path, language_code')
      .eq('id', transcriptId)
      .single();
      
    if (transcriptError) {
      throw new Error(`Failed to get transcript: ${transcriptError.message}`);
    }
    
    // Get transcript content from storage
    const { data: transcriptContent, error: storageError } = await supabase
      .storage
      .from('transcripts')
      .download(transcriptData.storage_path);
      
    if (storageError) {
      throw new Error(`Failed to get transcript content: ${storageError.message}`);
    }
    
    // Parse transcript
    const transcriptText = await transcriptContent.text();
    
    // Create translation record
    const { data: translation, error: translationRecordError } = await supabase
      .from('translations')
      .insert({
        transcript_id: transcriptId,
        source_language: transcriptData.language_code || sourceLanguage || 'auto',
        target_language: targetLanguage,
        status: 'processing',
        storage_path: `translations/${transcriptId}_${targetLanguage}.txt`,
      })
      .select()
      .single();
      
    if (translationRecordError) {
      throw new Error(`Failed to create translation record: ${translationRecordError.message}`);
    }
    
    // Translate text
    const translationResult = await translateText(
      transcriptText,
      targetLanguage,
      transcriptData.language_code || sourceLanguage
    );
    
    if (!translationResult.success) {
      throw new Error(translationResult.error);
    }
    
    // Save translation to R2 storage
    const { error: uploadError } = await supabase
      .storage
      .from('translations')
      .upload(translation.storage_path, translationResult.data, {
        contentType: 'text/plain',
        upsert: true
      });
      
    if (uploadError) {
      throw new Error(`Failed to upload translation: ${uploadError.message}`);
    }
    
    // Update translation record
    const { error: updateError } = await supabase
      .from('translations')
      .update({
        status: 'completed',
        word_count: translationResult.data.split(/\s+/).length,
      })
      .eq('id', translation.id);
      
    if (updateError) {
      throw new Error(`Failed to update translation record: ${updateError.message}`);
    }
    
    return new Response(JSON.stringify({ success: true, translation }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error in translation function:', error);
    
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
```

## 3. OpenAI GPT-4o-mini Integration (Summarization)

### Implementation Overview

The GPT-4o-mini API will be used to create summaries of transcript content with varying levels of detail using Supabase Edge Functions.

### API Integration

```typescript
// lib/ai/gpt.ts (additional function)
export async function summarizeText(
  text: string,
  lengthType: 'short' | 'medium' | 'detailed'
) {
  try {
    let instructions = '';
    
    switch (lengthType) {
      case 'short':
        instructions = 'Create a very concise summary in 2-3 sentences capturing only the most important points.';
        break;
      case 'medium':
        instructions = 'Create a summary of moderate length (about 150-200 words) that covers the main points and key details.';
        break;
      case 'detailed':
        instructions = 'Create a comprehensive summary (300-500 words) that covers all significant points, maintaining the structure of the original content.';
        break;
      default:
        instructions = 'Create a summary of moderate length that covers the main points and key details.';
    }
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { 
          role: 'system', 
          content: `You are an expert at creating clear, accurate summaries. ${instructions} Focus on factual information and key points.` 
        },
        { role: 'user', content: text }
      ],
      temperature: 0.3,
      max_tokens: 2048
    });
    
    return {
      success: true,
      data: response.choices[0].message.content.trim()
    };
  } catch (error) {
    console.error('GPT API error:', error);
    return {
      success: false,
      error: error.message || 'Failed to summarize text'
    };
  }
}
```

### Edge Function Implementation

```typescript
// edge-functions/summarize-text/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { summarizeText } from '../_shared/gpt.ts';

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    const { transcriptId, lengthType } = await req.json();
    
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get transcript
    const { data: transcriptData, error: transcriptError } = await supabase
      .from('transcripts')
      .select('storage_path')
      .eq('id', transcriptId)
      .single();
      
    if (transcriptError) {
      throw new Error(`Failed to get transcript: ${transcriptError.message}`);
    }
    
    // Get transcript content from storage
    const { data: transcriptContent, error: storageError } = await supabase
      .storage
      .from('transcripts')
      .download(transcriptData.storage_path);
      
    if (storageError) {
      throw new Error(`Failed to get transcript content: ${storageError.message}`);
    }
    
    // Parse transcript
    const transcriptText = await transcriptContent.text();
    
    // Create summary record
    const { data: summary, error: summaryRecordError } = await supabase
      .from('summaries')
      .insert({
        transcript_id: transcriptId,
        length_type: lengthType,
        status: 'processing',
        storage_path: `summaries/${transcriptId}_${lengthType}.txt`,
      })
      .select()
      .single();
      
    if (summaryRecordError) {
      throw new Error(`Failed to create summary record: ${summaryRecordError.message}`);
    }
    
    // Generate summary
    const summaryResult = await summarizeText(
      transcriptText,
      lengthType
    );
    
    if (!summaryResult.success) {
      throw new Error(summaryResult.error);
    }
    
    // Save summary to R2 storage
    const { error: uploadError } = await supabase
      .storage
      .from('summaries')
      .upload(summary.storage_path, summaryResult.data, {
        contentType: 'text/plain',
        upsert: true
      });
      
    if (uploadError) {
      throw new Error(`Failed to upload summary: ${uploadError.message}`);
    }
    
    // Update summary record
    const { error: updateError } = await supabase
      .from('summaries')
      .update({
        status: 'completed',
        word_count: summaryResult.data.split(/\s+/).length,
      })
      .eq('id', summary.id);
      
    if (updateError) {
      throw new Error(`Failed to update summary record: ${updateError.message}`);
    }
    
    return new Response(JSON.stringify({ success: true, summary }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error in summarization function:', error);
    
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
```

## 4. Error Handling and Retry Strategy

To ensure reliability in AI service integrations, we'll implement comprehensive error handling and retry logic:

```typescript
// lib/ai/retry.ts
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    factor?: number;
    retryableErrors?: string[];
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    factor = 2,
    retryableErrors = ['rate_limit', 'timeout', 'service_unavailable']
  } = options;
  
  let attempt = 0;
  let delay = initialDelay;
  
  while (true) {
    try {
      return await fn();
    } catch (error) {
      attempt++;
      
      // Check if we should retry
      const shouldRetry = 
        attempt <= maxRetries && 
        retryableErrors.some(errType => 
          error.message?.toLowerCase().includes(errType)
        );
      
      if (!shouldRetry) {
        throw error;
      }
      
      // Exponential backoff with jitter
      const jitter = Math.random() * 0.3 + 0.85; // Random between 0.85-1.15
      const nextDelay = Math.min(delay * factor * jitter, maxDelay);
      
      console.warn(`Retry attempt ${attempt}/${maxRetries} after ${Math.round(nextDelay)}ms`);
      await new Promise(resolve => setTimeout(resolve, nextDelay));
      
      delay = nextDelay;
    }
  }
}
```

## 5. Usage Monitoring and Rate Limiting

To manage AI service costs and prevent abuse, we'll implement usage tracking and rate limiting:

```typescript
// lib/ai/usage.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function checkUsageAllowance(
  userId: string,
  serviceType: 'transcription' | 'translation' | 'summarization',
  requestSize: number
): Promise<{ allowed: boolean; reason?: string }> {
  // Get user's subscription tier
  const { data: user, error: userError } = await supabase
    .from('profiles')
    .select('subscription_tier')
    .eq('id', userId)
    .single();
    
  if (userError) {
    throw new Error(`Failed to get user subscription: ${userError.message}`);
  }
  
  // Get current month's usage
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  
  const { data: usage, error: usageError } = await supabase
    .from('usage')
    .select('*')
    .eq('user_id', userId)
    .eq('month_year', currentMonth)
    .single();
    
  if (usageError && usageError.code !== 'PGRST116') { // PGRST116 is "no rows found"
    throw new Error(`Failed to get usage data: ${usageError.message}`);
  }
  
  // Define limits based on subscription tier
  const limits = {
    free: {
      transcription_seconds_used: 30 * 60, // 30 minutes
      translation_characters_used: 0, // Not allowed
      summarization_characters_used: 0, // Not allowed
    },
    pro: {
      transcription_seconds_used: 300 * 60, // 300 minutes
      translation_characters_used: 500000, // ~100k words
      summarization_characters_used: 500000, // ~100k words
    },
    business: {
      transcription_seconds_used: 1500 * 60, // 1500 minutes
      translation_characters_used: Number.MAX_SAFE_INTEGER, // Unlimited
      summarization_characters_used: Number.MAX_SAFE_INTEGER, // Unlimited
    }
  };
  
  const tier = user.subscription_tier as keyof typeof limits;
  const currentUsage = usage || {
    transcription_seconds_used: 0,
    translation_characters_used: 0,
    summarization_characters_used: 0
  };
  
  // Check if request would exceed limits
  switch (serviceType) {
    case 'transcription':
      if (currentUsage.transcription_seconds_used + requestSize > limits[tier].transcription_seconds_used) {
        return { 
          allowed: false, 
          reason: 'Transcription limit reached for your subscription tier' 
        };
      }
      break;
    case 'translation':
      if (tier === 'free') {
        return { 
          allowed: false, 
          reason: 'Translation not available on free tier' 
        };
      }
      if (currentUsage.translation_characters_used + requestSize > limits[tier].translation_characters_used) {
        return { 
          allowed: false, 
          reason: 'Translation limit reached for your subscription tier' 
        };
      }
      break;
    case 'summarization':
      if (tier === 'free') {
        return { 
          allowed: false, 
          reason: 'Summarization not available on free tier' 
        };
      }
      if (currentUsage.summarization_characters_used + requestSize > limits[tier].summarization_characters_used) {
        return { 
          allowed: false, 
          reason: 'Summarization limit reached for your subscription tier' 
        };
      }
      break;
  }
  
  return { allowed: true };
}
```

This code will be integrated into the edge functions to check usage allowances before processing requests. 
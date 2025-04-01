import { translateText } from './translate';
import { SUPPORTED_LANGUAGES } from '../index';

export {
  translateText,
  SUPPORTED_LANGUAGES
};

// Types
export interface TranslationResult {
  success: boolean;
  data?: string;
  error?: string;
}

export interface TranslationRequest {
  transcriptId: string;
  targetLanguage: string;
  sourceLanguage?: string;
}

export interface TranslationResponse {
  success: boolean;
  translation?: {
    id: string;
    transcript_id: string;
    target_language: string;
    source_language: string;
    status: 'processing' | 'completed' | 'error';
    created_at: string;
  };
  error?: string;
} 
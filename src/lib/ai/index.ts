// Export transcription functionality
export * from './whisper';
export * from './audio-utils';
export * from './usage-tracking';
export * from './audio-preprocessing';

// Define common types for AI services
export type AIServiceType = 'transcription' | 'translation' | 'summarization';

// Define AI model types
export type TranscriptionModel = 'whisper-1';
export type TranslationModel = 'gpt-4o-mini' | 'gpt-4o';
export type SummarizationModel = 'gpt-4o-mini' | 'gpt-4o';

// Define language codes for translation
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'nl', name: 'Dutch' },
  { code: 'ru', name: 'Russian' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
  { code: 'vi', name: 'Vietnamese' },
] as const;

export type LanguageCode = typeof SUPPORTED_LANGUAGES[number]['code'];

// AI service configuration
export const AI_CONFIG = {
  transcription: {
    defaultModel: 'whisper-1' as TranscriptionModel,
    maxFileSizeBytes: 25 * 1024 * 1024, // 25MB limit for Whisper API
    supportedFormats: [
      'mp3', 'mp4', 'mpeg', 'mpga', 'm4a', 'wav', 'webm',
    ],
  },
  quotaLimits: {
    free: {
      transcriptionSeconds: 3600, // 1 hour
      translationCharacters: 100000, // 100K characters
      summaryCount: 10,
    },
    pro: {
      transcriptionSeconds: 18000, // 5 hours
      translationCharacters: 1000000, // 1M characters
      summaryCount: 100,
    },
    business: {
      transcriptionSeconds: 72000, // 20 hours
      translationCharacters: 10000000, // 10M characters
      summaryCount: 1000,
    },
  },
};

// Summary length options
export enum SummaryLength {
  SHORT = 'short',   // 1-2 paragraphs
  MEDIUM = 'medium', // 3-4 paragraphs  
  LONG = 'long'      // 5+ paragraphs
} 
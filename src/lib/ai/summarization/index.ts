import { summarizeText } from './summarize';
import { SummaryLength } from '../index';

export {
  summarizeText,
  SummaryLength
};

// Types
export interface SummarizationResult {
  success: boolean;
  data?: string;
  error?: string;
  metadata?: SummaryMetadata;
}

export interface SummaryMetadata {
  topics?: string[];
  keywords?: string[];
  sentiment?: 'positive' | 'neutral' | 'negative';
  wordCount?: number;
}

export interface SummarizationRequest {
  transcriptId: string;
  length: SummaryLength;
}

export interface SummarizationResponse {
  success: boolean;
  summary?: {
    id: string;
    transcript_id: string;
    length: string;
    status: 'processing' | 'completed' | 'error';
    created_at: string;
  };
  error?: string;
} 
export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  subscription_tier: 'free' | 'pro' | 'business';
  subscription_status: 'active' | 'inactive' | 'past_due' | 'canceled';
  current_period_end?: string | Date;
}

export interface File {
  id: string;
  user_id: string;
  filename: string;
  original_filename: string;
  storage_path: string;
  file_size_bytes: number;
  mime_type: string;
  duration_seconds?: number;
  status: 'uploaded' | 'processing' | 'transcribed' | 'error';
  created_at: string | Date;
  updated_at: string | Date;
  language_code?: string;
  processing_error?: string;
  is_deleted: boolean;
}

export interface Transcript {
  id: string;
  file_id: string;
  user_id: string;
  storage_path: string;
  status: 'processing' | 'completed' | 'error';
  created_at: string | Date;
  updated_at: string | Date;
  word_count?: number;
  processing_time_seconds?: number;
  is_edited: boolean;
  language_code?: string;
  processing_error?: string;
  is_deleted: boolean;
}

export interface Translation {
  id: string;
  transcript_id: string;
  user_id: string;
  storage_path: string;
  source_language: string;
  target_language: string;
  status: 'processing' | 'completed' | 'error';
  created_at: string | Date;
  updated_at: string | Date;
  word_count?: number;
  processing_time_seconds?: number;
  processing_error?: string;
  is_deleted: boolean;
}

export interface Summary {
  id: string;
  transcript_id: string;
  user_id: string;
  storage_path: string;
  length_type: 'short' | 'medium' | 'detailed';
  status: 'processing' | 'completed' | 'error';
  created_at: string | Date;
  updated_at: string | Date;
  word_count?: number;
  processing_time_seconds?: number;
  processing_error?: string;
  is_deleted: boolean;
}

export interface Usage {
  id: string;
  user_id: string;
  month_year: string;
  transcription_seconds_used: number;
  translation_characters_used: number;
  summarization_characters_used: number;
  created_at: string | Date;
  updated_at: string | Date;
}

export interface Subscription {
  id: string;
  user_id: string;
  paddle_subscription_id: string;
  paddle_customer_id: string;
  paddle_plan_id: string;
  status: string;
  tier: 'free' | 'pro' | 'business';
  current_period_start: string | Date;
  current_period_end: string | Date;
  cancel_at_period_end: boolean;
  created_at: string | Date;
  updated_at: string | Date;
  canceled_at?: string | Date;
  payment_method?: any;
}

export interface TranscriptVersion {
  id: string;
  transcript_id: string;
  user_id: string;
  storage_path: string;
  version_number: number;
  created_at: string | Date;
  comment?: string;
}

export interface PricingPlan {
  id: string;
  name: string;
  description: string;
  price: {
    monthly: number;
    annually: number;
  };
  features: string[];
  limits: {
    transcription_minutes: number;
    translation: boolean;
    summarization: boolean;
  };
  paddle_plan_id: {
    monthly: string;
    annually: string;
  };
  is_popular?: boolean;
} 
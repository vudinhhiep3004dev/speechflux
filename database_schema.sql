-- =============================================================================
-- DATABASE SCHEMA FOR SPEECHFLUX APPLICATION
-- =============================================================================

-- PROFILES TABLE - Extension of auth.users for user profile information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  preferred_language TEXT DEFAULT 'en',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add Row Level Security to profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create security policies for profiles
CREATE POLICY "Users can view their own profile" 
  ON public.profiles 
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles 
  FOR UPDATE USING (auth.uid() = id);

-- FILES TABLE - For storing audio and video file metadata
CREATE TABLE public.files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL, -- Size in bytes
  mime_type TEXT NOT NULL,
  duration INTEGER, -- Duration in seconds
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'error')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  storage_bucket TEXT NOT NULL DEFAULT 'audio',
  metadata JSONB DEFAULT '{}'::JSONB -- Additional metadata like bit rate, channels, etc.
);

-- Add Row Level Security to files
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

-- Create security policies for files
CREATE POLICY "Users can view their own files" 
  ON public.files 
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own files" 
  ON public.files 
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own files" 
  ON public.files 
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own files" 
  ON public.files 
  FOR DELETE USING (auth.uid() = owner_id);

-- TRANSCRIPTS TABLE - For storing transcriptions of audio files
CREATE TABLE public.transcripts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_id UUID NOT NULL REFERENCES public.files ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  content TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en',
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'processing', 'completed', 'error')),
  model TEXT NOT NULL DEFAULT 'whisper',
  confidence FLOAT, -- Confidence score from the model
  processing_time INTEGER, -- Time taken to transcribe in milliseconds
  version INTEGER DEFAULT 1, -- Version of the transcript for tracking edits
  is_edited BOOLEAN DEFAULT FALSE, -- Whether the transcript has been manually edited
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB DEFAULT '{}'::JSONB -- Additional data like speaker diarization
);

-- Add Row Level Security to transcripts
ALTER TABLE public.transcripts ENABLE ROW LEVEL SECURITY;

-- Create security policies for transcripts
CREATE POLICY "Users can view their own transcripts" 
  ON public.transcripts 
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own transcripts" 
  ON public.transcripts 
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own transcripts" 
  ON public.transcripts 
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own transcripts" 
  ON public.transcripts 
  FOR DELETE USING (auth.uid() = owner_id);

-- TRANSLATIONS TABLE - For storing translations of transcripts
CREATE TABLE public.translations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transcript_id UUID NOT NULL REFERENCES public.transcripts ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  content TEXT NOT NULL,
  source_language TEXT NOT NULL,
  target_language TEXT NOT NULL,
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'processing', 'completed', 'error')),
  model TEXT NOT NULL DEFAULT 'gpt-4o-mini',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add Row Level Security to translations
ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;

-- Create security policies for translations
CREATE POLICY "Users can view their own translations" 
  ON public.translations 
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own translations" 
  ON public.translations 
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own translations" 
  ON public.translations 
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own translations" 
  ON public.translations 
  FOR DELETE USING (auth.uid() = owner_id);

-- SUMMARIES TABLE - For storing summaries of transcripts
CREATE TABLE public.summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transcript_id UUID NOT NULL REFERENCES public.transcripts ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  content TEXT NOT NULL,
  length TEXT NOT NULL CHECK (length IN ('short', 'medium', 'long')),
  language TEXT NOT NULL,
  model TEXT NOT NULL DEFAULT 'gpt-4o-mini',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add Row Level Security to summaries
ALTER TABLE public.summaries ENABLE ROW LEVEL SECURITY;

-- Create security policies for summaries
CREATE POLICY "Users can view their own summaries" 
  ON public.summaries 
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own summaries" 
  ON public.summaries 
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own summaries" 
  ON public.summaries 
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own summaries" 
  ON public.summaries 
  FOR DELETE USING (auth.uid() = owner_id);

-- SUBSCRIPTIONS TABLE - For managing user subscription plans
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('free', 'pro', 'business')),
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'expired', 'past_due')),
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  paddle_subscription_id TEXT UNIQUE,
  paddle_customer_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB DEFAULT '{}'::JSONB
);

-- Add Row Level Security to subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Create security policies for subscriptions
CREATE POLICY "Users can view their own subscription" 
  ON public.subscriptions 
  FOR SELECT USING (auth.uid() = user_id);

-- USAGE TABLE - For tracking user usage metrics
CREATE TABLE public.usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  transcription_seconds INTEGER DEFAULT 0,
  translation_characters INTEGER DEFAULT 0,
  summary_count INTEGER DEFAULT 0,
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add Row Level Security to usage
ALTER TABLE public.usage ENABLE ROW LEVEL SECURITY;

-- Create security policies for usage
CREATE POLICY "Users can view their own usage" 
  ON public.usage 
  FOR SELECT USING (auth.uid() = user_id);

-- USAGE LIMITS TABLE - Defines the limits for each subscription plan
CREATE TABLE public.usage_limits (
  id SERIAL PRIMARY KEY,
  plan TEXT NOT NULL UNIQUE CHECK (plan IN ('free', 'pro', 'business')),
  monthly_transcription_seconds INTEGER NOT NULL,
  monthly_translation_characters INTEGER NOT NULL,
  monthly_summary_count INTEGER NOT NULL,
  max_file_size_mb INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Initial plan limits
INSERT INTO public.usage_limits (plan, monthly_transcription_seconds, monthly_translation_characters, monthly_summary_count, max_file_size_mb)
VALUES 
  ('free', 3600, 100000, 10, 25),
  ('pro', 18000, 1000000, 100, 100),
  ('business', 72000, 10000000, 1000, 500);

-- Create a trigger to create a profile entry when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'first_name', ''), 
    COALESCE(new.raw_user_meta_data->>'last_name', '')
  );
  
  -- Also create a free subscription for the new user
  INSERT INTO public.subscriptions (
    user_id, 
    plan, 
    status, 
    current_period_start, 
    current_period_end
  )
  VALUES (
    new.id, 
    'free', 
    'active', 
    CURRENT_TIMESTAMP, 
    CURRENT_TIMESTAMP + INTERVAL '100 years'
  );
  
  -- Initialize usage record
  INSERT INTO public.usage (
    user_id,
    period_start,
    period_end
  )
  VALUES (
    new.id,
    DATE_TRUNC('month', CURRENT_TIMESTAMP),
    (DATE_TRUNC('month', CURRENT_TIMESTAMP) + INTERVAL '1 month')::DATE - INTERVAL '1 day'
  );
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function every time a user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create a function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to all tables with updated_at column
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_files_updated_at
  BEFORE UPDATE ON public.files
  FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_transcripts_updated_at
  BEFORE UPDATE ON public.transcripts
  FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_translations_updated_at
  BEFORE UPDATE ON public.translations
  FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_summaries_updated_at
  BEFORE UPDATE ON public.summaries
  FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_usage_updated_at
  BEFORE UPDATE ON public.usage
  FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- Create indexes for performance
CREATE INDEX idx_files_owner_id ON public.files(owner_id);
CREATE INDEX idx_files_status ON public.files(status);
CREATE INDEX idx_transcripts_file_id ON public.transcripts(file_id);
CREATE INDEX idx_transcripts_owner_id ON public.transcripts(owner_id);
CREATE INDEX idx_translations_transcript_id ON public.translations(transcript_id);
CREATE INDEX idx_translations_owner_id ON public.translations(owner_id);
CREATE INDEX idx_summaries_transcript_id ON public.summaries(transcript_id);
CREATE INDEX idx_summaries_owner_id ON public.summaries(owner_id);
CREATE INDEX idx_usage_user_id ON public.usage(user_id);
CREATE INDEX idx_usage_period ON public.usage(period_start, period_end); 
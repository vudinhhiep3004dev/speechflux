# SpeechFlux - Database Schema

This document outlines the database schema for SpeechFlux using Supabase PostgreSQL.

## Tables

### 1. Users

Extends Supabase Auth users with additional profile information.

```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  billing_address JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  subscription_tier TEXT DEFAULT 'free',
  subscription_status TEXT DEFAULT 'active',
  current_period_end TIMESTAMP WITH TIME ZONE
);
```

### 2. Files

Stores metadata for uploaded audio files.

```sql
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  duration_seconds FLOAT,
  status TEXT DEFAULT 'uploaded',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  language_code TEXT,
  processing_error TEXT,
  is_deleted BOOLEAN DEFAULT FALSE
);
```

### 3. Transcripts

Stores transcript metadata and links to the actual transcript file.

```sql
CREATE TABLE transcripts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_id UUID REFERENCES files(id) NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  storage_path TEXT NOT NULL,
  status TEXT DEFAULT 'processing',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  word_count INTEGER,
  processing_time_seconds FLOAT,
  is_edited BOOLEAN DEFAULT FALSE,
  language_code TEXT,
  processing_error TEXT,
  is_deleted BOOLEAN DEFAULT FALSE
);
```

### 4. Translations

Stores translation metadata.

```sql
CREATE TABLE translations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transcript_id UUID REFERENCES transcripts(id) NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  storage_path TEXT NOT NULL,
  source_language TEXT NOT NULL,
  target_language TEXT NOT NULL,
  status TEXT DEFAULT 'processing',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  word_count INTEGER,
  processing_time_seconds FLOAT,
  processing_error TEXT,
  is_deleted BOOLEAN DEFAULT FALSE
);
```

### 5. Summaries

Stores summary metadata.

```sql
CREATE TABLE summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transcript_id UUID REFERENCES transcripts(id) NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  storage_path TEXT NOT NULL,
  length_type TEXT NOT NULL, -- 'short', 'medium', 'detailed'
  status TEXT DEFAULT 'processing',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  word_count INTEGER,
  processing_time_seconds FLOAT,
  processing_error TEXT,
  is_deleted BOOLEAN DEFAULT FALSE
);
```

### 6. Usage

Tracks user resource usage for billing purposes.

```sql
CREATE TABLE usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  month_year TEXT NOT NULL, -- Format: 'YYYY-MM'
  transcription_seconds_used INTEGER DEFAULT 0,
  translation_characters_used INTEGER DEFAULT 0,
  summarization_characters_used INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 7. Subscriptions

Tracks subscription information from Paddle.

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  paddle_subscription_id TEXT NOT NULL,
  paddle_customer_id TEXT NOT NULL,
  paddle_plan_id TEXT NOT NULL,
  status TEXT NOT NULL,
  tier TEXT NOT NULL, -- 'free', 'pro', 'business'
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  canceled_at TIMESTAMP WITH TIME ZONE,
  payment_method JSONB
);
```

### 8. TranscriptVersions

Stores version history for edited transcripts.

```sql
CREATE TABLE transcript_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transcript_id UUID REFERENCES transcripts(id) NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  storage_path TEXT NOT NULL,
  version_number INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  comment TEXT
);
```

## Row Level Security (RLS) Policies

Example RLS policies for key tables:

### Files Table

```sql
-- Users can only view their own files
CREATE POLICY "Users can view own files" 
ON files FOR SELECT 
USING (auth.uid() = user_id);

-- Users can only insert their own files
CREATE POLICY "Users can insert own files" 
ON files FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can only update their own files
CREATE POLICY "Users can update own files" 
ON files FOR UPDATE 
USING (auth.uid() = user_id);
```

### Similar policies would be created for all tables to ensure data isolation between users.

## Indexes

Important indexes to improve query performance:

```sql
-- Files
CREATE INDEX idx_files_user_id ON files(user_id);
CREATE INDEX idx_files_status ON files(status);

-- Transcripts
CREATE INDEX idx_transcripts_file_id ON transcripts(file_id);
CREATE INDEX idx_transcripts_user_id ON transcripts(user_id);
CREATE INDEX idx_transcripts_status ON transcripts(status);

-- Usage
CREATE UNIQUE INDEX idx_usage_user_month ON usage(user_id, month_year);
```

## Database Functions

Example function for updating usage:

```sql
CREATE OR REPLACE FUNCTION update_transcription_usage()
RETURNS TRIGGER AS $$
DECLARE
  current_month TEXT;
BEGIN
  current_month := to_char(NOW(), 'YYYY-MM');
  
  INSERT INTO usage (user_id, month_year, transcription_seconds_used)
  VALUES (NEW.user_id, current_month, COALESCE(NEW.duration_seconds, 0))
  ON CONFLICT (user_id, month_year) 
  DO UPDATE SET 
    transcription_seconds_used = usage.transcription_seconds_used + COALESCE(NEW.duration_seconds, 0),
    updated_at = NOW();
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_transcript_created
  AFTER INSERT ON transcripts
  FOR EACH ROW
  EXECUTE PROCEDURE update_transcription_usage();
```

## Migrations

Database changes will be versioned and applied through migration scripts managed in the project repository. 
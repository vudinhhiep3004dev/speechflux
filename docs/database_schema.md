# SpeechFlux Database Schema Documentation

## Introduction

This document provides detailed information about the SpeechFlux database schema. The database is built on PostgreSQL via Supabase and is designed to support efficient audio file management, transcription, translation, summarization, and subscription features.

## Schema Structure

The database schema consists of the following tables:

### 1. profiles

Extends the built-in `auth.users` table with additional user information.

| Column              | Type                      | Description                                |
|---------------------|---------------------------|--------------------------------------------|
| id                  | UUID (PK)                 | Foreign key to auth.users                  |
| first_name          | TEXT                      | User's first name                          |
| last_name           | TEXT                      | User's last name                           |
| avatar_url          | TEXT                      | URL to user's profile image                |
| preferred_language  | TEXT                      | Preferred language for the interface       |
| created_at          | TIMESTAMP WITH TIME ZONE  | Record creation timestamp                  |
| updated_at          | TIMESTAMP WITH TIME ZONE  | Record update timestamp                    |

**Security:** Row Level Security (RLS) policies allow users to view and update only their own profile.

### 2. files

Stores metadata for audio files uploaded by users.

| Column              | Type                      | Description                                |
|---------------------|---------------------------|--------------------------------------------|
| id                  | UUID (PK)                 | Unique identifier for the file             |
| owner_id            | UUID (FK)                 | Foreign key to auth.users                  |
| filename            | TEXT                      | Original filename                          |
| file_path           | TEXT                      | Path to the file in storage                |
| file_size           | INTEGER                   | File size in bytes                         |
| mime_type           | TEXT                      | File MIME type                             |
| duration            | INTEGER                   | Duration in seconds                        |
| status              | TEXT                      | Processing status (pending/processing/completed/error) |
| storage_bucket      | TEXT                      | Storage bucket name                        |
| created_at          | TIMESTAMP WITH TIME ZONE  | Record creation timestamp                  |
| updated_at          | TIMESTAMP WITH TIME ZONE  | Record update timestamp                    |
| metadata            | JSONB                     | Additional file metadata                   |

**Security:** RLS policies allow users to view, insert, update, and delete only their own files.

### 3. transcripts

Stores transcriptions of audio files.

| Column              | Type                      | Description                                |
|---------------------|---------------------------|--------------------------------------------|
| id                  | UUID (PK)                 | Unique identifier for the transcript       |
| file_id             | UUID (FK)                 | Foreign key to files                       |
| owner_id            | UUID (FK)                 | Foreign key to auth.users                  |
| content             | TEXT                      | Transcript content                         |
| language            | TEXT                      | Language of the transcript                 |
| status              | TEXT                      | Processing status                          |
| model               | TEXT                      | AI model used for transcription            |
| confidence          | FLOAT                     | Confidence score from the model            |
| processing_time     | INTEGER                   | Time taken to transcribe (ms)              |
| version             | INTEGER                   | Version number for edited transcripts      |
| is_edited           | BOOLEAN                   | Whether the transcript has been edited     |
| created_at          | TIMESTAMP WITH TIME ZONE  | Record creation timestamp                  |
| updated_at          | TIMESTAMP WITH TIME ZONE  | Record update timestamp                    |
| metadata            | JSONB                     | Additional transcript metadata             |

**Security:** RLS policies allow users to view, insert, update, and delete only their own transcripts.

### 4. translations

Stores translations of transcripts.

| Column              | Type                      | Description                                |
|---------------------|---------------------------|--------------------------------------------|
| id                  | UUID (PK)                 | Unique identifier for the translation      |
| transcript_id       | UUID (FK)                 | Foreign key to transcripts                 |
| owner_id            | UUID (FK)                 | Foreign key to auth.users                  |
| content             | TEXT                      | Translation content                        |
| source_language     | TEXT                      | Source language                            |
| target_language     | TEXT                      | Target language                            |
| status              | TEXT                      | Processing status                          |
| model               | TEXT                      | AI model used for translation              |
| created_at          | TIMESTAMP WITH TIME ZONE  | Record creation timestamp                  |
| updated_at          | TIMESTAMP WITH TIME ZONE  | Record update timestamp                    |

**Security:** RLS policies allow users to view, insert, update, and delete only their own translations.

### 5. summaries

Stores summaries of transcripts.

| Column              | Type                      | Description                                |
|---------------------|---------------------------|--------------------------------------------|
| id                  | UUID (PK)                 | Unique identifier for the summary          |
| transcript_id       | UUID (FK)                 | Foreign key to transcripts                 |
| owner_id            | UUID (FK)                 | Foreign key to auth.users                  |
| content             | TEXT                      | Summary content                            |
| length              | TEXT                      | Length category (short/medium/long)        |
| language            | TEXT                      | Language of the summary                    |
| model               | TEXT                      | AI model used for summarization            |
| created_at          | TIMESTAMP WITH TIME ZONE  | Record creation timestamp                  |
| updated_at          | TIMESTAMP WITH TIME ZONE  | Record update timestamp                    |

**Security:** RLS policies allow users to view, insert, update, and delete only their own summaries.

### 6. subscriptions

Manages user subscription plans.

| Column                 | Type                      | Description                                |
|------------------------|---------------------------|--------------------------------------------|
| id                     | UUID (PK)                 | Unique identifier for the subscription     |
| user_id                | UUID (FK)                 | Foreign key to auth.users                  |
| plan                   | TEXT                      | Subscription plan (free/pro/business)      |
| status                 | TEXT                      | Subscription status                        |
| current_period_start   | TIMESTAMP WITH TIME ZONE  | Start of the current billing period        |
| current_period_end     | TIMESTAMP WITH TIME ZONE  | End of the current billing period          |
| cancel_at_period_end   | BOOLEAN                   | Whether to cancel at the end of period     |
| paddle_subscription_id | TEXT                      | External subscription ID in Paddle         |
| paddle_customer_id     | TEXT                      | External customer ID in Paddle             |
| created_at             | TIMESTAMP WITH TIME ZONE  | Record creation timestamp                  |
| updated_at             | TIMESTAMP WITH TIME ZONE  | Record update timestamp                    |
| metadata               | JSONB                     | Additional subscription metadata           |

**Security:** RLS policies allow users to view only their own subscription.

### 7. usage

Tracks resource usage by users.

| Column                  | Type                      | Description                                |
|-------------------------|---------------------------|--------------------------------------------|
| id                      | UUID (PK)                 | Unique identifier for the usage record     |
| user_id                 | UUID (FK)                 | Foreign key to auth.users                  |
| transcription_seconds   | INTEGER                   | Total seconds of audio transcribed         |
| translation_characters  | INTEGER                   | Total characters translated                |
| summary_count           | INTEGER                   | Number of summaries generated              |
| period_start            | TIMESTAMP WITH TIME ZONE  | Start of the tracking period               |
| period_end              | TIMESTAMP WITH TIME ZONE  | End of the tracking period                 |
| created_at              | TIMESTAMP WITH TIME ZONE  | Record creation timestamp                  |
| updated_at              | TIMESTAMP WITH TIME ZONE  | Record update timestamp                    |

**Security:** RLS policies allow users to view only their own usage records.

### 8. usage_limits

Defines limits for each subscription plan.

| Column                       | Type                      | Description                                |
|------------------------------|---------------------------|--------------------------------------------|
| id                           | SERIAL (PK)               | Unique identifier for the plan             |
| plan                         | TEXT                      | Subscription plan name                     |
| monthly_transcription_seconds| INTEGER                   | Monthly limit for transcription seconds    |
| monthly_translation_characters| INTEGER                  | Monthly limit for translation characters   |
| monthly_summary_count        | INTEGER                   | Monthly limit for summary generation       |
| max_file_size_mb             | INTEGER                   | Maximum file size (MB) allowed             |
| created_at                   | TIMESTAMP WITH TIME ZONE  | Record creation timestamp                  |
| updated_at                   | TIMESTAMP WITH TIME ZONE  | Record update timestamp                    |

## Database Functions and Triggers

### Functions

1. **handle_new_user()**: Triggered when a new user is created in `auth.users`. Creates corresponding records in `profiles`, `subscriptions`, and `usage` tables.

2. **update_modified_column()**: Updates the `updated_at` timestamp whenever a record is modified.

### Triggers

Multiple triggers are set up to maintain data integrity and apply the functions above to relevant tables.

## Indexes

Optimized indexes are created for common query patterns:

- `idx_files_owner_id`: Improves performance when querying files by owner
- `idx_files_status`: Optimizes filtering files by status
- `idx_transcripts_file_id`: Speeds up lookups of transcripts by file
- `idx_transcripts_owner_id`: Improves performance when querying transcripts by owner
- `idx_translations_transcript_id`: Speeds up lookups of translations by transcript
- `idx_translations_owner_id`: Improves performance when querying translations by owner
- `idx_summaries_transcript_id`: Speeds up lookups of summaries by transcript
- `idx_summaries_owner_id`: Improves performance when querying summaries by owner
- `idx_usage_user_id`: Optimizes lookups of usage by user
- `idx_usage_period`: Improves filtering usage records by time period

## Row Level Security Policies

All tables with user data implement Row Level Security policies to ensure users can only access their own data:

- **profiles**: Users can view and update only their own profile
- **files**: Users can view, insert, update, and delete only their own files
- **transcripts**: Users can view, insert, update, and delete only their own transcripts
- **translations**: Users can view, insert, update, and delete only their own translations
- **summaries**: Users can view, insert, update, and delete only their own summaries
- **subscriptions**: Users can view only their own subscription
- **usage**: Users can view only their own usage records

## Schema Relationships

The schema follows these key relationships:

- Users (auth.users) have one profile (profiles)
- Users can own many files (files)
- Files can have one transcript (transcripts)
- Transcripts can have multiple translations (translations)
- Transcripts can have multiple summaries (summaries)
- Users have one subscription (subscriptions)
- Users have many usage records (usage)

## Initialization Data

The `usage_limits` table is initialized with default values for the three subscription tiers:

- **Free plan**: 1 hour (3,600 seconds) of transcription, 100,000 translation characters, 10 summaries, 25MB max file size
- **Pro plan**: 5 hours (18,000 seconds) of transcription, 1,000,000 translation characters, 100 summaries, 100MB max file size
- **Business plan**: 20 hours (72,000 seconds) of transcription, 10,000,000 translation characters, 1,000 summaries, 500MB max file size 
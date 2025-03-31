# SpeechFlux

SpeechFlux is a SaaS platform that allows users to convert speech to text, translate, and summarize audio content using AI.

## Features

- **Speech-to-Text:** Convert audio files to accurate text transcripts using OpenAI Whisper
- **Translation:** Translate transcripts to multiple languages using OpenAI GPT-4o-mini
- **Summarization:** Generate concise summaries of your transcripts at different detail levels
- **File Management:** Organize, edit, and download your transcripts and translations
- **Subscription Tiers:** Free, Pro, and Business plans with different usage limits

## Tech Stack

- **Frontend:** Next.js 14 (App Router), React 18, TypeScript, TailwindCSS
- **Backend:** Next.js API Routes, Supabase Edge Functions
- **Database:** Supabase PostgreSQL
- **Storage:** Cloudflare R2
- **Authentication:** Supabase Auth
- **Payments:** Paddle
- **AI Services:** OpenAI Whisper, GPT-4o-mini

## Getting Started

### Prerequisites

- Node.js 20.x or higher
- npm or yarn
- Supabase account
- OpenAI API key
- Cloudflare R2 account
- Paddle account (for payment processing)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/speechflux.git
   cd speechflux
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   
   Then edit `.env.local` with your actual credentials.

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

The project follows a structured approach based on the Next.js App Router:

- `/app`: Next.js App Router pages and layouts
- `/components`: Reusable React components
- `/lib`: Utility functions and service integrations
- `/styles`: Global CSS and TailwindCSS configurations
- `/tests`: Test files using Jest and React Testing Library

## License

This project is licensed under the MIT License - see the LICENSE file for details.

# SpeechFlux - Database Schema

This document outlines the database schema design for the SpeechFlux application, a platform for audio transcription, translation, and summarization.

## Overview

SpeechFlux uses Supabase (PostgreSQL) as its database. The schema is designed to support the following key features:

- User authentication and profile management
- Audio file storage and management
- Transcription of audio files
- Translation of transcriptions
- Summarization of transcriptions
- Subscription and usage tracking

## Schema Design

### User Management

- **profiles**: Extends the `auth.users` table with additional user profile information
  - Links to the built-in Supabase Auth system
  - Stores user preferences such as name, avatar, and preferred language

### File Management

- **files**: Stores metadata about uploaded audio files
  - Links files to their owners
  - Tracks file properties (size, duration, type)
  - Monitors processing status

### Content Processing

- **transcripts**: Stores text transcriptions of audio files
  - Contains the full text content
  - Tracks the source language
  - Records processing metrics (confidence, time)
  - Supports versioning for edited transcripts

- **translations**: Stores translated versions of transcripts
  - Supports multiple target languages per transcript
  - Records the AI model used for translation

- **summaries**: Stores summarized versions of transcripts
  - Supports various summary lengths (short, medium, long)
  - Can be generated in different languages

### Subscription and Usage Management

- **subscriptions**: Manages user subscription plans
  - Tracks subscription status and period
  - Integrates with Paddle for payment processing

- **usage**: Tracks resource usage per user
  - Monitors transcription, translation, and summary usage
  - Organized by billing periods

- **usage_limits**: Defines limits for each subscription tier
  - Sets constraints on transcript duration, translation volume, etc.
  - Used to enforce usage restrictions based on plan

## Security Implementation

All tables are protected with Row Level Security (RLS) policies to ensure users can only access their own data. The security model follows these principles:

- Users can only view, modify, and delete their own records
- Appropriate foreign key constraints maintain data integrity
- Triggers automatically maintain timestamps and related records

## Database Triggers

- `handle_new_user()`: Creates profile, subscription, and usage records for new users
- `update_modified_column()`: Automatically updates timestamps when records are modified

## Indexes

Performance-optimized indexes are created for common query patterns, particularly for owner-based lookups and relationship traversals.

## Usage in Application

This schema supports the full SpeechFlux application workflow:

1. Users upload audio files
2. Files are processed for transcription
3. Transcripts can be translated or summarized
4. Usage is tracked against subscription limits
5. All operations respect user ownership boundaries

The database schema is designed to be scalable, efficient, and secure while supporting all the application's features. 
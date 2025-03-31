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

## Deployment

### CI/CD Pipeline

This project includes a CI/CD pipeline configured with GitHub Actions. The pipeline:

1. Runs linting checks
2. Executes tests
3. Builds the application
4. (Optional) Deploys to Vercel when pushing to the main branch

### Deploying to Vercel

To deploy this application to Vercel:

1. Fork or clone this repository
2. Create a new project on Vercel and connect it to your repository
3. Configure the following environment variables in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
   - `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID
   - `CLOUDFLARE_ACCESS_KEY_ID`: Your Cloudflare R2 access key
   - `CLOUDFLARE_SECRET_ACCESS_KEY`: Your Cloudflare R2 secret key
   - `CLOUDFLARE_R2_BUCKET_NAME`: Your R2 bucket name
4. Deploy the application

For automated deployments, uncomment the deployment job in `.github/workflows/ci.yml` and add the following secrets to your GitHub repository:
- `VERCEL_TOKEN`: Your Vercel API token
- `VERCEL_ORG_ID`: Your Vercel organization ID
- `VERCEL_PROJECT_ID`: Your Vercel project ID

### Environment Configuration

1. Copy `.env.example` to `.env.local` for local development
2. Update the values with your own credentials

## Cloudflare R2 Setup

This application uses Cloudflare R2 for storage. To set it up:

1. Create a Cloudflare account if you don't have one
2. Create an R2 bucket named `speechflux` (or configure a different name in env variables)
3. Create API tokens with appropriate permissions
4. Configure CORS settings to allow API access
5. Add credentials to environment variables

For local development, add these values to your `.env.local` file. 
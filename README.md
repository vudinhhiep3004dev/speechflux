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
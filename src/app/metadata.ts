import { Metadata } from 'next';

// Moving metadata to its own file so it can be imported by server components
export const metadata: Metadata = {
  title: 'SpeechFlux - Audio Transcription and Translation',
  description: 'Convert audio to text, translate content, and manage your media files with SpeechFlux',
  keywords: 'transcription, translation, audio to text, speech to text, language translation',
  authors: [{ name: 'SpeechFlux Team' }],
  viewport: 'width=device-width, initial-scale=1',
};

// Helper functions for generating metadata for specific pages
export function generatePageMetadata(
  title: string,
  description?: string
): Metadata {
  return {
    ...metadata,
    title: `${title} | SpeechFlux`,
    description: description || metadata.description,
  };
} 
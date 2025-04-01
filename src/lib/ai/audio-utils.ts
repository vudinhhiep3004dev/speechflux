// Import required libraries for audio processing
import { Readable } from 'stream';

/**
 * Interface for audio metadata extraction
 */
export interface AudioMetadata {
  duration: number; // Duration in seconds
  format: string;
  channels: number;
  sampleRate: number;
  bitRate?: number;
}

/**
 * Estimates audio duration based on file size and bit rate
 * This is a fallback method when proper metadata extraction isn't available
 * 
 * @param fileSize File size in bytes
 * @param bitRate Bit rate in kbps (default: 128)
 * @returns Duration in seconds
 */
export function estimateAudioDuration(fileSize: number, bitRate: number = 128): number {
  // Convert bit rate from kbps to bytes per second
  const bytesPerSecond = (bitRate * 1000) / 8;
  
  // Calculate duration: file size / bytes per second
  return fileSize / bytesPerSecond;
}

/**
 * Extracts the duration of an audio file from its URL
 * 
 * @param fileUrl The URL of the audio file
 * @returns The duration in seconds
 */
export async function getAudioDuration(fileUrl: string): Promise<number> {
  try {
    // Fetch only the first chunk of the file to check its headers
    const response = await fetch(fileUrl, {
      headers: {
        Range: 'bytes=0-65536', // Just get the first 64KB which should contain metadata
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch audio file: ${response.statusText}`);
    }
    
    // Get content length from headers if available
    const contentLength = response.headers.get('content-length');
    const totalSize = contentLength ? parseInt(contentLength, 10) : undefined;
    
    // Get file blob
    const blob = await response.blob();
    
    // Create an audio element to get duration
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      
      audio.onloadedmetadata = () => {
        if (audio.duration === Infinity) {
          // Some formats don't provide duration right away
          // Start playing to force duration calculation
          audio.currentTime = 24 * 60 * 60; // Seek to 24 hours
          audio.ontimeupdate = () => {
            audio.ontimeupdate = null;
            resolve(audio.duration);
            audio.pause();
          };
        } else {
          resolve(audio.duration);
        }
      };
      
      audio.onerror = () => {
        // If audio element method fails, fall back to estimation based on file size
        if (totalSize) {
          resolve(estimateAudioDuration(totalSize));
        } else {
          reject(new Error('Failed to determine audio duration'));
        }
      };
      
      audio.src = URL.createObjectURL(blob);
    });
  } catch (error) {
    console.error('Error getting audio duration:', error);
    throw error;
  }
}

/**
 * Checks if the audio file format is supported by Whisper API
 * 
 * @param mimeType MIME type of the audio file
 * @returns True if the format is supported
 */
export function isFormatSupported(mimeType: string): boolean {
  const supportedFormats = [
    'audio/mpeg',
    'audio/mp4',
    'audio/wav',
    'audio/x-wav',
    'audio/vnd.wav',
    'audio/ogg',
    'audio/vorbis',
    'audio/webm',
    'audio/flac',
  ];
  
  return supportedFormats.includes(mimeType);
} 
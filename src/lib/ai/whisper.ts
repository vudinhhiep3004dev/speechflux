import OpenAI from 'openai';

// Define response types for the transcription service
export interface TranscriptionResult {
  success: boolean;
  data?: {
    text: string;
    segments?: Array<{
      id: number;
      start: number;
      end: number;
      text: string;
      words?: Array<{
        word: string;
        start: number;
        end: number;
      }>;
    }>;
    language?: string;
    duration?: number;
  };
  error?: string;
}

/**
 * Initialize OpenAI client with API key
 */
const initializeOpenAI = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not defined in environment variables');
  }
  
  return new OpenAI({
    apiKey,
  });
};

/**
 * Transcribe audio file using OpenAI Whisper API
 * 
 * @param fileUrl URL of the audio file to transcribe
 * @param language Language code (optional, will auto-detect if not provided)
 * @param responseFormat Format of the response (json or text)
 * @param wordTimestamps Whether to include timestamps for individual words
 * @returns Transcription result object
 */
export async function transcribeAudio(
  fileUrl: string,
  language?: string,
  responseFormat: 'json' | 'text' | 'srt' | 'verbose_json' = 'verbose_json',
  wordTimestamps: boolean = true
): Promise<TranscriptionResult> {
  try {
    // Initialize OpenAI client
    const openai = initializeOpenAI();
    
    // Download the file from the URL
    const response = await fetch(fileUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`);
    }
    
    const fileBlob = await response.blob();
    
    // Convert blob to File object
    const file = new File([fileBlob], 'audio.mp3', { type: fileBlob.type });
    
    // Configure request parameters
    const requestParams = {
      file,
      model: 'whisper-1',
      response_format: responseFormat,
      temperature: 0,
      language,
    } as any; // Use type assertion to avoid TypeScript errors
    
    if (wordTimestamps) {
      requestParams.timestamp_granularities = ['word'];
    }
    
    // Call the Whisper API
    const transcriptionResponse = await openai.audio.transcriptions.create(requestParams);
    
    // Process and structure the response based on format
    if (responseFormat === 'verbose_json' || responseFormat === 'json') {
      return {
        success: true,
        data: typeof transcriptionResponse === 'string' 
          ? JSON.parse(transcriptionResponse) 
          : transcriptionResponse as any, // Use type assertion for flexibility
      };
    } else {
      return {
        success: true,
        data: {
          text: typeof transcriptionResponse === 'string' 
            ? transcriptionResponse 
            : JSON.stringify(transcriptionResponse),
        },
      };
    }
  } catch (error) {
    console.error('Whisper API error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
} 
import OpenAI from 'openai';
import { SummarizationResult, SummaryMetadata } from './index';
import { SummaryLength } from '../index';

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
 * Summarize text using OpenAI GPT-4o-mini
 * 
 * @param text The text to summarize
 * @param length The desired summary length
 * @returns SummarizationResult object with the summary and metadata
 */
export async function summarizeText(
  text: string,
  length: SummaryLength = SummaryLength.MEDIUM
): Promise<SummarizationResult> {
  try {
    const openai = initializeOpenAI();
    
    // Create prompt based on requested length
    let lengthInstruction = '';
    switch(length) {
      case SummaryLength.SHORT:
        lengthInstruction = 'Create a concise 1-2 paragraph summary';
        break;
      case SummaryLength.MEDIUM:
        lengthInstruction = 'Create a comprehensive 3-4 paragraph summary';
        break;
      case SummaryLength.LONG:
        lengthInstruction = 'Create a detailed 5+ paragraph summary';
        break;
      default:
        lengthInstruction = 'Create a comprehensive 3-4 paragraph summary';
    }
    
    // First get the summary
    const summaryResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert summarizer who creates clear, accurate summaries of transcripts. ${lengthInstruction} that captures the key points, main ideas, and important details. Maintain the original meaning and context of the content.`
        },
        {
          role: 'user',
          content: `Please summarize the following transcript:\n\n${text}`
        }
      ],
      temperature: 0.3,
      max_tokens: 1500
    });
    
    // Extract the summary from the response
    const summary = summaryResponse.choices[0].message.content?.trim();
    
    if (!summary) {
      throw new Error('Received empty summary from API');
    }
    
    // Then get metadata about the content
    const metadataResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Extract metadata from the transcript in JSON format. Include main topics (3-5), key keywords (5-10), and overall sentiment (positive, neutral, or negative).'
        },
        {
          role: 'user',
          content: `Extract metadata from this transcript:\n\n${text}`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
      max_tokens: 500
    });
    
    // Parse the metadata from the response
    const metadataContent = metadataResponse.choices[0].message.content?.trim();
    let metadata: SummaryMetadata = {};
    
    if (metadataContent) {
      try {
        const parsedMetadata = JSON.parse(metadataContent);
        metadata = {
          topics: parsedMetadata.topics || [],
          keywords: parsedMetadata.keywords || [],
          sentiment: parsedMetadata.sentiment || 'neutral',
          wordCount: summary.split(/\s+/).length
        };
      } catch (error) {
        console.error('Error parsing metadata:', error);
        // Continue without metadata if parsing fails
      }
    }
    
    return {
      success: true,
      data: summary,
      metadata
    };
  } catch (error) {
    console.error('Summarization error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred during summarization'
    };
  }
} 
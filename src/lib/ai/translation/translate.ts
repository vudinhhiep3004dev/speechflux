import OpenAI from 'openai';
import { TranslationResult } from './index';

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
 * Translate text using OpenAI GPT-4o-mini
 * 
 * @param text The text to translate
 * @param targetLanguage The language to translate to
 * @param sourceLanguage Optional source language (if not provided, will be auto-detected)
 * @returns TranslationResult object with the translated text or error
 */
export async function translateText(
  text: string,
  targetLanguage: string,
  sourceLanguage?: string
): Promise<TranslationResult> {
  try {
    const openai = initializeOpenAI();
    
    // Create prompt based on whether source language is specified
    const prompt = sourceLanguage
      ? `Translate the following ${sourceLanguage} text to ${targetLanguage}:\n\n${text}`
      : `Translate the following text to ${targetLanguage}:\n\n${text}`;
    
    // Call the GPT API
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a professional translator. Translate the text accurately while preserving meaning, tone, and formatting. Do not add any additional commentary.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 4096
    });
    
    // Extract the translated text from the response
    const translatedText = response.choices[0].message.content?.trim();
    
    if (!translatedText) {
      throw new Error('Received empty translation from API');
    }
    
    return {
      success: true,
      data: translatedText
    };
  } catch (error) {
    console.error('Translation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred during translation'
    };
  }
} 
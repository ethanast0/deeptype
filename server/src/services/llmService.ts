import { LiteLLM } from 'litellm';
import { logger } from '../utils/logger';

// Model configuration for different tiers
const MODELS = {
  free: {
    primary: 'together/mistral-7b-instruct',
    fallback: 'together/llama-2-7b-chat',
  },
  pro: {
    primary: 'together/mixtral-8x7b-instruct',
    fallback: 'together/mistral-7b-instruct',
  }
};

// Define response type
interface QuoteExtractionResponse {
  quotes: string[];
  model_used: string;
  processing_time: number;
}

/**
 * Extracts quotes from text using LLM
 * 
 * @param text - Text to extract quotes from
 * @param userTier - User's subscription tier (free or pro)
 * @param count - Number of quotes to extract
 * @param maxLength - Maximum length per quote
 * @param apiKey - Optional API key for Together.ai
 * @returns Promise<QuoteExtractionResponse>
 */
export async function extractQuotes(
  text: string,
  userTier: 'free' | 'pro' = 'free',
  count: number = 10,
  maxLength: number = 150,
  apiKey?: string
): Promise<QuoteExtractionResponse> {
  const startTime = Date.now();
  const tier = userTier === 'pro' ? 'pro' : 'free';
  
  // Use either the provided API key or the default one from environment variables
  const key = apiKey || process.env.TOGETHER_API_KEY;
  
  if (!key) {
    logger.error('No API key available for LLM service');
    throw new Error('API key is required for LLM processing');
  }
  
  // Initialize LiteLLM client
  const litellm = new LiteLLM({ 
    apiKey: key,
    defaultModel: MODELS[tier].primary
  });
  
  try {
    logger.info(`Extracting quotes with ${MODELS[tier].primary} model`);
    
    // Call the LLM to extract quotes
    const response = await litellm.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `Extract ${count} meaningful quotes from the following text. Return ONLY a JSON array of strings with no additional text. Each quote should be concise (under ${maxLength} characters if possible) and impactful for typing practice.`
        },
        {
          role: 'user',
          content: text
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });
    
    // Process the response
    const content = response.choices[0].message.content.trim();
    let quotes: string[] = [];
    
    try {
      // Try to parse as JSON
      quotes = JSON.parse(content);
    } catch (parseError) {
      logger.warn('Failed to parse LLM response as JSON, falling back to regex extraction');
      
      // Fallback: Extract using regex
      const regex = /"(.*?)"/g;
      const matches = [...content.matchAll(regex)];
      
      if (matches.length > 0) {
        quotes = matches.map(match => match[1]);
      } else {
        // Last resort: Split by newlines
        quotes = content
          .split('\n')
          .filter(line => line.trim().length > 0)
          .map(line => line.replace(/^\d+\.\s*/, '').replace(/^["']|["']$/g, ''));
      }
    }
    
    const processingTime = Date.now() - startTime;
    logger.info(`Extracted ${quotes.length} quotes in ${processingTime}ms`);
    
    return {
      quotes: quotes.slice(0, count),
      model_used: MODELS[tier].primary,
      processing_time: processingTime
    };
    
  } catch (error) {
    logger.error(`Error with primary model: ${error}`);
    logger.info(`Trying fallback model: ${MODELS[tier].fallback}`);
    
    try {
      // Try with fallback model
      const fallbackLitellm = new LiteLLM({ 
        apiKey: key,
        defaultModel: MODELS[tier].fallback
      });
      
      const fallbackResponse = await fallbackLitellm.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `Extract ${count} meaningful quotes from the following text. Return ONLY a JSON array of strings with no additional text. Each quote should be concise (under ${maxLength} characters if possible) and impactful for typing practice.`
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });
      
      const fallbackContent = fallbackResponse.choices[0].message.content.trim();
      let fallbackQuotes: string[] = [];
      
      try {
        fallbackQuotes = JSON.parse(fallbackContent);
      } catch (parseError) {
        // Fallback extraction methods as above
        const regex = /"(.*?)"/g;
        const matches = [...fallbackContent.matchAll(regex)];
        
        if (matches.length > 0) {
          fallbackQuotes = matches.map(match => match[1]);
        } else {
          fallbackQuotes = fallbackContent
            .split('\n')
            .filter(line => line.trim().length > 0)
            .map(line => line.replace(/^\d+\.\s*/, '').replace(/^["']|["']$/g, ''));
        }
      }
      
      const processingTime = Date.now() - startTime;
      logger.info(`Extracted ${fallbackQuotes.length} quotes with fallback model in ${processingTime}ms`);
      
      return {
        quotes: fallbackQuotes.slice(0, count),
        model_used: MODELS[tier].fallback,
        processing_time: processingTime
      };
      
    } catch (fallbackError) {
      logger.error(`Both primary and fallback models failed: ${fallbackError}`);
      throw new Error('Failed to extract quotes with available models');
    }
  }
} 
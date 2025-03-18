import express from 'express';
import { extractQuotes } from '../services/llmService';
import { documentService } from '../services/documentService';
import { 
  getQuotaStatus, 
  hasQuotaAvailable, 
  incrementQuotaUsage,
  updateUserTier 
} from '../services/quotaService';
import { logger } from '../utils/logger';

const router = express.Router();

// Extract quotes from raw text
router.post('/extract-quotes', async (req, res) => {
  try {
    const { text, preferences } = req.body;
    
    if (!text) {
      return res.status(400).json({ 
        error: {
          message: 'Text is required',
          code: 'MISSING_TEXT'
        }
      });
    }
    
    // Get user ID from request (in a real app, this would be from auth token)
    // For demo purposes, we'll use a mock user ID
    const userId = req.headers['x-user-id'] as string || 'demo-user';
    
    // Get user's subscription tier - either from auth or from localStorage reflection
    const userTier = req.headers['x-subscription-tier'] as 'free' | 'pro' || 'free';
    
    // Update user tier in our system if provided
    if (req.headers['x-subscription-tier']) {
      updateUserTier(userId, userTier);
    }
    
    // Check if user has quota available
    if (!hasQuotaAvailable(userId) && userTier !== 'pro') {
      return res.status(402).json({
        error: {
          message: 'Quote extraction quota exceeded',
          code: 'QUOTA_EXCEEDED',
          quota: getQuotaStatus(userId)
        }
      });
    }
    
    // Get custom preferences or use defaults
    const count = preferences?.count || 10;
    const maxLength = preferences?.maxLength || 150;
    
    // Get optional API key if provided
    const apiKey = req.headers['x-api-key'] as string;
    
    // Extract quotes
    const result = await extractQuotes(text, userTier, count, maxLength, apiKey);
    
    // Increment usage quota
    const quotaStatus = incrementQuotaUsage(userId);
    
    // Return quotes and quota information
    return res.status(200).json({
      quotes: result.quotes,
      model_used: result.model_used,
      processing_time: result.processing_time,
      remaining_quota: quotaStatus.remaining,
      tier: userTier
    });
    
  } catch (error) {
    logger.error(`Error extracting quotes: ${error}`);
    return res.status(500).json({
      error: {
        message: 'Failed to extract quotes',
        details: (error as Error).message
      }
    });
  }
});

// Process document and extract quotes
router.post('/process-document', express.json({ limit: '50mb' }), async (req, res) => {
  try {
    const { document, mimeType, preferences } = req.body;
    
    if (!document || !mimeType) {
      return res.status(400).json({
        error: {
          message: 'Document and MIME type are required',
          code: 'MISSING_DOCUMENT'
        }
      });
    }
    
    // Get user ID from request (in a real app, this would be from auth token)
    const userId = req.headers['x-user-id'] as string || 'demo-user';
    
    // Get user's subscription tier
    const userTier = req.headers['x-subscription-tier'] as 'free' | 'pro' || 'free';
    
    // Pro features are required for document processing
    if (userTier !== 'pro') {
      return res.status(403).json({
        error: {
          message: 'Document processing requires a Pro subscription',
          code: 'PRO_REQUIRED'
        }
      });
    }
    
    // Check quota (even for pro users, we want to track usage)
    if (!hasQuotaAvailable(userId)) {
      return res.status(402).json({
        error: {
          message: 'Document processing quota exceeded',
          code: 'QUOTA_EXCEEDED',
          quota: getQuotaStatus(userId)
        }
      });
    }
    
    // Convert base64 to buffer
    const buffer = Buffer.from(document, 'base64');
    
    // Process document based on MIME type
    const text = await documentService.processDocument(buffer, mimeType);
    
    // Get custom preferences or use defaults
    const count = preferences?.count || 10;
    const maxLength = preferences?.maxLength || 150;
    
    // Get optional API key if provided
    const apiKey = req.headers['x-api-key'] as string;
    
    // Extract quotes from the document text
    const result = await extractQuotes(text, userTier, count, maxLength, apiKey);
    
    // Increment usage quota
    const quotaStatus = incrementQuotaUsage(userId);
    
    // Return quotes and quota information
    return res.status(200).json({
      quotes: result.quotes,
      model_used: result.model_used,
      processing_time: result.processing_time,
      remaining_quota: quotaStatus.remaining,
      tier: userTier
    });
    
  } catch (error) {
    logger.error(`Error processing document: ${error}`);
    return res.status(500).json({
      error: {
        message: 'Failed to process document',
        details: (error as Error).message
      }
    });
  }
});

// Process URL and extract quotes
router.post('/process-url', async (req, res) => {
  try {
    const { url, preferences } = req.body;
    
    if (!url) {
      return res.status(400).json({
        error: {
          message: 'URL is required',
          code: 'MISSING_URL'
        }
      });
    }
    
    // Get user ID from request (in a real app, this would be from auth token)
    const userId = req.headers['x-user-id'] as string || 'demo-user';
    
    // Get user's subscription tier
    const userTier = req.headers['x-subscription-tier'] as 'free' | 'pro' || 'free';
    
    // Pro features are required for URL processing
    if (userTier !== 'pro') {
      return res.status(403).json({
        error: {
          message: 'URL processing requires a Pro subscription',
          code: 'PRO_REQUIRED'
        }
      });
    }
    
    // Check quota
    if (!hasQuotaAvailable(userId)) {
      return res.status(402).json({
        error: {
          message: 'URL processing quota exceeded',
          code: 'QUOTA_EXCEEDED',
          quota: getQuotaStatus(userId)
        }
      });
    }
    
    // Fetch content from URL
    const response = await fetch(url);
    if (!response.ok) {
      return res.status(400).json({
        error: {
          message: `Failed to fetch URL: ${response.statusText}`,
          code: 'URL_FETCH_ERROR'
        }
      });
    }
    
    const text = await response.text();
    
    // Get custom preferences or use defaults
    const count = preferences?.count || 10;
    const maxLength = preferences?.maxLength || 150;
    
    // Get optional API key if provided
    const apiKey = req.headers['x-api-key'] as string;
    
    // Extract quotes from the URL content
    const result = await extractQuotes(text, userTier, count, maxLength, apiKey);
    
    // Increment usage quota
    const quotaStatus = incrementQuotaUsage(userId);
    
    // Return quotes and quota information
    return res.status(200).json({
      quotes: result.quotes,
      source_url: url,
      model_used: result.model_used,
      processing_time: result.processing_time,
      remaining_quota: quotaStatus.remaining,
      tier: userTier
    });
    
  } catch (error) {
    logger.error(`Error processing URL: ${error}`);
    return res.status(500).json({
      error: {
        message: 'Failed to process URL',
        details: (error as Error).message
      }
    });
  }
});

// Get quota status for user
router.get('/quota', (req, res) => {
  const userId = req.headers['x-user-id'] as string || 'demo-user';
  const quotaStatus = getQuotaStatus(userId);
  
  return res.status(200).json({
    quota: quotaStatus
  });
});

// Update user subscription tier
router.post('/subscription', (req, res) => {
  const { tier } = req.body;
  const userId = req.headers['x-user-id'] as string || 'demo-user';
  
  if (tier !== 'free' && tier !== 'pro') {
    return res.status(400).json({
      error: {
        message: 'Invalid tier',
        code: 'INVALID_TIER'
      }
    });
  }
  
  updateUserTier(userId, tier);
  
  return res.status(200).json({
    message: `Subscription updated to ${tier}`,
    quota: getQuotaStatus(userId)
  });
});

export const quoteRoutes = router; 
interface QuoteResponse {
  quotes: string[];
  remaining_quota?: number;
  tier: 'free' | 'pro';
}

export async function extractQuotesWithAI(text: string): Promise<string[]> {
  try {
    const response = await fetch('/api/extract-quotes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // We'll add auth header here once we implement authentication
        'x-user-id': 'demo-user',
        'x-subscription-tier': localStorage.getItem('subscription_tier') || 'free',
        ...(localStorage.getItem('together_api_key') ? 
          { 'x-api-key': localStorage.getItem('together_api_key') as string } : {})
      },
      body: JSON.stringify({
        text,
        preferences: {
          count: 10,
          maxLength: 150
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      if (error.code === 'QUOTA_EXCEEDED') {
        throw new Error('Quote extraction quota exceeded. Please upgrade to Pro plan for unlimited quotes.');
      }
      throw new Error(error.message || 'Failed to extract quotes');
    }

    const data: QuoteResponse = await response.json();
    return data.quotes;
    
  } catch (error) {
    console.error('Error extracting quotes:', error);
    throw error;
  }
}

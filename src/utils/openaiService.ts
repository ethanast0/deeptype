
interface OpenAIResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

export async function extractQuotesWithAI(text: string): Promise<string[]> {
  const apiKey = localStorage.getItem('openai_api_key');
  
  if (!apiKey) {
    throw new Error("OpenAI API key not found. Please add your API key in settings.");
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Extract 5-10 meaningful quotes from the following text. Return ONLY a JSON array of strings with no additional text. Each quote should be concise (under 150 characters if possible) and impactful for typing practice.'
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API Error: ${errorData.error?.message || response.statusText}`);
    }

    const data: OpenAIResponse = await response.json();
    
    try {
      // Try to parse the content as JSON
      const content = data.choices[0].message.content.trim();
      return JSON.parse(content);
    } catch (parseError) {
      // If parsing fails, try to extract quotes using regex
      const content = data.choices[0].message.content;
      const regex = /"(.*?)"/g;
      const matches = [...content.matchAll(regex)];
      
      if (matches.length > 0) {
        return matches.map(match => match[1]);
      }
      
      // If all else fails, split by newlines and clean up
      return content
        .split('\n')
        .filter(line => line.trim().length > 0)
        .map(line => line.replace(/^\d+\.\s*/, '').replace(/^["']|["']$/g, ''));
    }
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    throw error;
  }
}

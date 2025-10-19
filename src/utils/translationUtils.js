const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

/**
 * Translate a string or array of strings from German to English using OpenRouter.
 * @param {string|string[]} input - The text or array of texts to translate.
 * @returns {Promise<string|string[]>} - The translated text(s).
 */
export async function translateToEnglish(input) {
  // Get API key from environment
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  
  if (!apiKey) {
    console.error('OpenRouter API key not found. Please set VITE_OPENROUTER_API_KEY in your environment variables.');
    return input;
  }

  // Prepare the prompt for translation
  const prompt = Array.isArray(input)
    ? `Translate the following list of skills or locations from German to English. Return only the translated list, comma separated.\n${input.join(', ')}`
    : `Translate the following text from German to English. Return only the translated text.\n${input}`;

  const messages = [
    {
      role: 'system',
      content: 'You are a helpful translation assistant. Translate the given text from German to English. Return only the translated text without any additional formatting or explanations.'
    },
    {
      role: 'user',
      content: prompt
    }
  ];

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Velai Platform'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        messages: messages,
        max_tokens: 1000,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to translate text');
    }

    const responseData = await response.json();
    const translatedText = responseData.choices?.[0]?.message?.content;
    
    if (!translatedText) {
      throw new Error('No translation received from AI');
    }

    if (Array.isArray(input)) {
      // Split by comma and trim
      return translatedText.split(',').map(s => s.trim());
    }
    return translatedText.trim();
  } catch (error) {
    console.error('Translation error:', error);
    return input;
  }
} 
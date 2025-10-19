/**
 * Groq AI Client for Pani Platform
 * Provides fast AI inference using Groq's API
 */

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

class GroqClient {
  constructor() {
    this.apiKey = import.meta.env.VITE_GROQ_API_KEY;
    
    if (!this.apiKey) {
      console.warn('Groq API key not found. Please set VITE_GROQ_API_KEY in your environment variables.');
    }
  }

  /**
   * Send a chat completion request to Groq
   * @param {Array} messages - Array of message objects
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} - API response
   */
  async chatCompletion(messages, options = {}) {
    if (!this.apiKey) {
      throw new Error('Groq API key not found. Please set VITE_GROQ_API_KEY in your environment variables.');
    }

    const {
      model = 'llama-3.3-70b-versatile', // Default to Llama 3.3 70B
      maxTokens = 4000,
      temperature = 0.7,
      stream = false,
      ...otherOptions
    } = options;

    const payload = {
      model,
      messages,
      max_tokens: maxTokens,
      temperature,
      stream,
      ...otherOptions
    };

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      let errorMessage = 'Failed to get AI response';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error?.message || errorMessage;
      } catch (e) {
        // If we can't parse the error, use the status text
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    return response;
  }

  /**
   * Send a streaming chat completion request
   * @param {Array} messages - Array of message objects
   * @param {Function} onChunk - Callback for each chunk
   * @param {Object} options - Additional options
   */
  async streamChatCompletion(messages, onChunk, options = {}) {
    const response = await this.chatCompletion(messages, { ...options, stream: true });
    
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is not readable');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete lines from buffer
        while (true) {
          const lineEnd = buffer.indexOf('\n');
          if (lineEnd === -1) break;

          const line = buffer.slice(0, lineEnd).trim();
          buffer = buffer.slice(lineEnd + 1);

          // Skip empty lines and comments
          if (!line || line.startsWith(':')) continue;

          // Parse data lines
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            // Check for end of stream
            if (data === '[DONE]') {
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              
              if (content && onChunk) {
                onChunk(content);
              }
            } catch (e) {
              console.warn('Failed to parse streaming chunk:', e);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Get available models
   * @returns {Array} - List of available models
   */
  getAvailableModels() {
    return [
      'llama-3.3-70b-versatile',
      'llama-3.1-8b-instant',
      'mixtral-8x7b-32768',
      'gemma-7b-it',
      'gemma2-9b-it'
    ];
  }

  /**
   * Check if API key is configured
   * @returns {boolean}
   */
  isConfigured() {
    return !!this.apiKey;
  }
}

// Export singleton instance
export const groqClient = new GroqClient();
export default groqClient;
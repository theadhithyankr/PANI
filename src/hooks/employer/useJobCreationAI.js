import { useState, useCallback } from 'react';
import { useAuth } from '../common/useAuth';
import { chatPrompts } from '../../prompts/chatPrompts';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Job creation AI system prompt
const JOB_CREATION_SYSTEM_PROMPT = chatPrompts.jobCreation;

// JSON Schema for structured outputs
const JOB_DATA_SCHEMA = {
  type: "object",
  properties: {
    message: {
      type: "string", 
      description: "Conversational response to the user"
    },
    data: {
      type: "object",
      properties: {
        title: { type: "string", description: "Job title" },
        description: { type: "string", description: "Job description" },
        requirements: { type: "string", description: "Job requirements" },
        responsibilities: { type: "string", description: "Job responsibilities" },
        location: { type: "string", description: "Job location" },
        featureImageUrl: { type: "string", description: "Feature image URL" },
        isRemote: { type: "boolean", description: "Is remote work allowed" },
        isHybrid: { type: "boolean", description: "Is hybrid work allowed" },
        jobType: {
          type: "string",
          enum: ["internship", "permanent", "contract", "full_time", "part_time", "freelance"],
          description: "Type of job"
        },
        experienceLevel: {
          type: "string", 
          enum: ["entry", "junior", "mid", "senior", "lead", "director"],
          description: "Required experience level"
        },
        salaryMin: { type: "string", description: "Minimum salary" },
        salaryMax: { type: "string", description: "Maximum salary" },
        salaryCurrency: { type: "string", description: "Salary currency" },
        skillsRequired: {
          type: "array",
          items: { type: "string" },
          description: "Required skills"
        },
        benefits: {
          type: "array", 
          items: { type: "string" },
          description: "Job benefits"
        },
        applicationDeadline: { type: "string", description: "Application deadline in YYYY-MM-DD format" },
        startDate: { type: "string", description: "Job start date in YYYY-MM-DD format" },
        supportTierId: {
          type: "integer",
          enum: [1, 2, 3],
          description: "Support tier ID: 1=Basic, 2=Professional, 3=Advanced"
        },
        driversLicense: {
          type: "string",
          enum: ["preferred", "required", "not_required"],
          description: "Driver's license requirement"
        },
        additionalQuestions: {
          type: "array",
          items: { type: "string" }, 
          description: "Additional questions for candidates"
        },
        preferredLanguage: {
          type: "string",
          enum: ["german", "english", "both"],
          description: "Preferred language"
        },
        priority: {
          type: "string",
          enum: ["high", "medium", "low"], 
          description: "Job priority"
        }
      },
      required: [],
      additionalProperties: false,
      description: "Job data extracted from conversation - only include fields with information"
    }
  },
  required: ["message"],
  additionalProperties: false
};

const useJobCreationAI = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState([]);

  // Add message to conversation
  const addMessage = useCallback((type, content) => {
    const newMessage = {
      id: Date.now(),
      type,
      content,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  }, []);

  // Clear conversation
  const clearConversation = useCallback(() => {
    setMessages([]);
  }, []);

  // Send message with structured output support
  const sendJobCreationMessage = useCallback(async (userMessage, currentFormData = {}, streaming = false, onChunk = null) => {
    setIsLoading(true);
    setError(null);

    try {
      // Get API key from environment
      const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
      
      if (!apiKey) {
        throw new Error('OpenRouter API key not found. Please set VITE_OPENROUTER_API_KEY in your environment variables.');
      }

      // Add user message to conversation
      const userMsg = addMessage('user', userMessage);

      // Create context about current form data
      const formContext = Object.keys(currentFormData).length > 0 
        ? `\n\nCurrent form data that the user has already filled:\n${JSON.stringify(currentFormData, null, 2)}`
        : '\n\nThe form is currently empty.';

      // Prepare messages array with system prompt and context
      const apiMessages = [
        {
          role: 'system',
          content: JOB_CREATION_SYSTEM_PROMPT + formContext
        },
        // Include previous conversation messages
        ...messages.map(msg => ({
          role: msg.type === 'ai' ? 'assistant' : 'user',
          content: msg.content
        })),
        {
          role: 'user',
          content: userMessage
        }
      ];

      // Prepare request payload with structured outputs
      const payload = {
        model: 'openai/gpt-4o', // Using GPT-4o for structured outputs support
        messages: apiMessages,
        max_tokens: 4000,
        temperature: 0.7,
        stream: streaming
      };

      // Only add structured output for non-streaming requests
      // Streaming + structured outputs may not work well together
      if (!streaming) {
        payload.response_format = {
          type: 'json_schema',
          json_schema: {
            name: 'job_creation_response',
            strict: false,
            schema: JOB_DATA_SCHEMA
          }
        };
      }

      // Make API request
      const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Velai Platform'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to get AI response');
      }

      // Handle streaming response
      if (streaming) {
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('Response body is not readable');
        }

        const decoder = new TextDecoder();
        let buffer = '';
        let fullContent = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            // Append new chunk to buffer
            buffer += decoder.decode(value, { stream: true });

            // Process complete lines from buffer
            while (true) {
              const lineEnd = buffer.indexOf('\n');
              if (lineEnd === -1) break;

              const line = buffer.slice(0, lineEnd).trim();
              buffer = buffer.slice(lineEnd + 1);

              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') break;

                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices[0].delta.content;
                  if (content) {
                    fullContent += content;
                    
                    // Try to extract just the message content during streaming
                    let displayContent = '';
                    let hasJobData = false;
                    try {
                      // Try to parse the current fullContent as JSON
                      const jsonResponse = JSON.parse(fullContent);
                      displayContent = jsonResponse.message || '';
                      hasJobData = jsonResponse.data && Object.keys(jsonResponse.data).length > 0;
                    } catch (parseError) {
                      // If JSON is incomplete, try to extract message content manually
                      const messageMatch = fullContent.match(/"message":\s*"([^"]*(?:\\.[^"]*)*)"/)
                      if (messageMatch) {
                        // Unescape the matched content
                        displayContent = messageMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n');
                      } else {
                        // If we can't extract message yet, show loading indicator
                        displayContent = '';
                      }
                      
                      // Check if we have data field even if JSON is incomplete
                      hasJobData = fullContent.includes('"data":') && fullContent.includes('{');
                    }
                    
                    if (onChunk) {
                      onChunk(content, displayContent, hasJobData);
                    }
                  }
                } catch (e) {
                  // Ignore invalid JSON
                }
              }
            }
          }
        } finally {
          reader.cancel();
        }

        // Parse final content and add to messages
        try {
          // For streaming, try to parse as JSON first
          const aiResponse = JSON.parse(fullContent);
          
          // Add the AI's conversational message
          addMessage('ai', aiResponse.message || fullContent);
          
          return {
            content: fullContent,
            parsed: aiResponse,
            type: 'job_data',
            data: aiResponse.data || {}
          };
        } catch (parseError) {
          // If not valid JSON, treat as plain text response
          // Try to extract JSON from the text if possible
          const jsonMatch = fullContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              const jsonContent = JSON.parse(jsonMatch[0]);
              addMessage('ai', jsonContent.message || fullContent);
              return {
                content: fullContent,
                parsed: jsonContent,
                type: 'job_data',
                data: jsonContent.data || {}
              };
            } catch (e) {
              // Still not valid JSON, treat as regular text
            }
          }
          
          // Fallback: treat as regular conversation
          addMessage('ai', fullContent);
          return {
            content: fullContent,
            parsed: { message: fullContent, data: {} },
            type: 'job_data',
            data: {}
          };
        }

      } else {
        // Handle non-streaming response
        const responseData = await response.json();
        
        // Extract the AI response
        const aiMessage = responseData.choices?.[0]?.message?.content;
        
        if (!aiMessage) {
          throw new Error('No response received from AI');
        }

        // Parse structured response
        try {
          const aiResponse = JSON.parse(aiMessage);
          
          // Add the AI's conversational message
          addMessage('ai', aiResponse.message);

          return {
            content: aiMessage,
            parsed: aiResponse,
            type: 'job_data', // Always job_data now
            data: aiResponse.data || {},
            usage: responseData.usage
          };
        } catch (parseError) {
          // Fallback: treat as regular conversation
          addMessage('ai', aiMessage);
          return {
            content: aiMessage,
            parsed: { message: aiMessage, data: {} },
            type: 'job_data',
            data: {},
            usage: responseData.usage
          };
        }
      }

    } catch (err) {
      const errorMessage = err.message || 'An error occurred while getting AI response';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [addMessage, messages]);

  // Stream message with structured output
  const sendJobCreationMessageStream = useCallback(async (userMessage, currentFormData = {}, onChunk) => {
    return sendJobCreationMessage(userMessage, currentFormData, true, onChunk);
  }, [sendJobCreationMessage]);

  return {
    // Core functionality
    sendJobCreationMessage,
    sendJobCreationMessageStream,
    
    // State
    isLoading,
    error,
    messages,
    
    // Conversation management
    addMessage,
    clearConversation,
    clearError: () => setError(null)
  };
};

export default useJobCreationAI; 
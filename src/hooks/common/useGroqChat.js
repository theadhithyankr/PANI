import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { chatPrompts } from '../../prompts/chatPrompts';
import { groqClient } from '../../clients/groqClient';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// System prompts for different user types and languages
const SYSTEM_PROMPTS = chatPrompts.general;

const useGroqChat = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get the appropriate system prompt based on user type and language
  const getSystemPrompt = useCallback((language = 'en') => {
    const userType = user?.type || 'candidate';
    const lang = language || 'en';
    return SYSTEM_PROMPTS[userType]?.[lang] || SYSTEM_PROMPTS.candidate.en;
  }, [user?.type]);

  // Convert file to base64 data URL
  const fileToBase64 = useCallback((file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  }, []);

  // Process uploaded files for the API
  const processFiles = useCallback(async (files) => {
    if (!files || files.length === 0) return [];

    const processedFiles = [];
    
    for (const fileData of files) {
      const { file, type } = fileData;
      
      try {
        const base64Data = await fileToBase64(file);
        
        // Handle images
        if (type.startsWith('image/')) {
          processedFiles.push({
            type: 'image_url',
            image_url: {
              url: base64Data
            }
          });
        } 
        // Handle PDFs
        else if (type === 'application/pdf') {
          processedFiles.push({
            type: 'file',
            file: {
              filename: file.name,
              file_data: base64Data
            }
          });
        }
        // Handle other document types as files
        else if (type.includes('document') || type.includes('text') || 
                 type.includes('sheet') || type.includes('presentation')) {
          processedFiles.push({
            type: 'file',
            file: {
              filename: file.name,
              file_data: base64Data
            }
          });
        }
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
      }
    }
    
    return processedFiles;
  }, [fileToBase64]);

  // Send message with streaming support
  const sendMessage = useCallback(async (messages, files = [], streaming = false, onChunk = null, language = 'en') => {
    setIsLoading(true);
    setError(null);

    try {
      // Get API key from environment
      const apiKey = import.meta.env.VITE_GROQ_API_KEY;
      
      if (!apiKey) {
        throw new Error('Groq API key not found. Please set VITE_GROQ_API_KEY in your environment variables.');
      }

      // Process files if any
      const processedFiles = await processFiles(files);

      // Prepare messages array with system prompt
      const apiMessages = [
        {
          role: 'system',
          content: getSystemPrompt(language)
        },
        ...messages.map(msg => {
          // For user messages with files, combine text and files
          if (msg.type === 'user' && msg.files && msg.files.length > 0) {
            const content = [];
            
            // Only add text content if it's not empty
            if (msg.content && msg.content.trim()) {
              content.push({
                type: 'text',
                text: msg.content
              });
            }

            // Add processed files to content
            if (processedFiles.length > 0) {
              content.push(...processedFiles);
            }

            // Ensure we have at least some content
            if (content.length === 0) {
              content.push({
                type: 'text',
                text: 'Please analyze the uploaded files.'
              });
            }

            return {
              role: 'user',
              content: content
            };
          }

          // For regular messages, ensure content is not empty
          const messageContent = msg.content && msg.content.trim() ? msg.content : 'Please provide a response.';

          return {
            role: msg.type === 'ai' ? 'assistant' : 'user',
            content: messageContent
          };
        })
      ];

      // Helper to attempt a request with specific PDF engine
      const attemptRequest = async (pdfEngine = null) => {
        const payload = {
          model: 'llama-3.3-70b-versatile',
          messages: apiMessages,
          max_tokens: 4000,
          temperature: 0.7,
          stream: streaming
        };

        // Note: Groq doesn't support PDF plugins like OpenRouter
        // Files will need to be processed differently or converted to text first

        const resp = await fetch(GROQ_API_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (!resp.ok) {
          let providerMessage = 'Failed to get AI response';
          try {
            const errorData = await resp.json();
            providerMessage = errorData.error?.message || providerMessage;
          } catch (_) {
            // ignore
          }
          const err = new Error(providerMessage);
          err.status = resp.status;
          err.pdfEngine = pdfEngine || 'mistral-ocr';
          throw err;
        }

        return resp;
      };

      // Try with basic request (Groq doesn't support PDF engines)
      let response;
      try {
        response = await attemptRequest();
      } catch (firstErr) {
        // For PDFs, provide a helpful error message
        const hasPDFs = files.some(file => file.type === 'application/pdf');
        if (hasPDFs) {
          const message = `PDF files are not directly supported with Groq API. Please convert your PDF to text or upload as images (PNG/JPG). Details: ${firstErr.message || 'Unknown error'}`;
          throw new Error(message);
        } else {
          throw firstErr;
        }
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
                    if (onChunk) {
                      onChunk(content, fullContent);
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

        return {
          content: fullContent,
          annotations: null,
          usage: null
        };
      } else {
        // Handle non-streaming response
        const responseData = await response.json();
        
        // Extract the AI response
        const aiMessage = responseData.choices?.[0]?.message?.content;
        
        if (!aiMessage) {
          throw new Error('No response received from AI');
        }

        return {
          content: aiMessage,
          annotations: responseData.choices?.[0]?.message?.annotations || null,
          usage: responseData.usage
        };
      }

    } catch (err) {
      const errorMessage = err.message || 'An error occurred while getting AI response';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [getSystemPrompt, processFiles]);

  // Stream message
  const sendMessageStream = useCallback(async (messages, files = [], onChunk, language = 'en') => {
    return sendMessage(messages, files, true, onChunk, language);
  }, [sendMessage]);

  return {
    sendMessage,
    sendMessageStream,
    isLoading,
    error,
    clearError: () => setError(null)
  };
};

export default useGroqChat;
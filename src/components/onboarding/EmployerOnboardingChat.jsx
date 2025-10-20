import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Bot, Send, ArrowRight, Sparkles, Building2, Users, CheckCircle, AlertCircle, MapPin } from 'lucide-react';
import { useGroqChat } from '../../hooks/common';
import { useToast } from '../../hooks/common';
import Button from '../common/Button';
import MarkdownRenderer from '../common/MarkdownRenderer';
import iconmark from '../../assets/logos/iconmark.svg';
import { chatPrompts } from '../../prompts/chatPrompts';

// Streaming dots component
const StreamingDots = () => {
  const [dots, setDots] = useState('');
  
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev.length >= 5) return '.';
        return prev + '.';
      });
    }, 300);
    
    return () => clearInterval(interval);
  }, []);
  
  return <span>thinking{dots}</span>;
};

// Custom hook for employer onboarding chat with data extraction
const useEmployerOnboardingChat = () => {
  const { sendMessageStream, isLoading, error, clearError } = useGroqChat();
  const [extractedData, setExtractedData] = useState({});
  const [dataExtractionComplete, setDataExtractionComplete] = useState(false);
  const [isExtractingData, setIsExtractingData] = useState(false);

  // Custom system prompt for employer onboarding data collection
  const ONBOARDING_SYSTEM_PROMPT = chatPrompts.employerOnboarding;

  const sendOnboardingMessage = useCallback(async (messages, onChunk) => {
    // We need to override the system prompt, so we'll send the messages directly
    // and handle the streaming manually with a custom approach
    
    try {
      // Create a temporary hook instance with custom system prompt
      const apiKey = import.meta.env.VITE_GROQ_API_KEY;
      
      if (!apiKey) {
        throw new Error('Groq API key not found. Please set VITE_GROQ_API_KEY in your environment variables.');
      }

      // Prepare messages array with custom system prompt
      const apiMessages = [
        {
          role: 'system',
          content: ONBOARDING_SYSTEM_PROMPT
        },
        ...messages.map(msg => ({
          role: msg.type === 'user' ? 'user' : 'assistant',
          content: msg.content
        }))
      ];

      // Prepare request payload
      const payload = {
        model: 'llama-3.3-70b-versatile',
        messages: apiMessages,
        max_tokens: 4000,
        temperature: 0.7,
        stream: true
      };

      // Make API request
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to get AI response');
      }

      // Handle streaming response
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

                  // Check if JSON extraction is starting
                  if (fullContent.includes('```json') && !isExtractingData) {
                    setIsExtractingData(true);
                  }
                  
                  // Check if the response contains complete JSON data
                  const jsonMatch = fullContent.match(/```json\s*\n([\s\S]*?)\n```/);
                  if (jsonMatch) {
                    try {
                      const data = JSON.parse(jsonMatch[1]);
                      console.log('=== AI JSON Data Extracted ===');
                      console.log('Raw JSON string:', jsonMatch[1]);
                      console.log('Parsed data:', data);
                      setExtractedData(data);
                      setDataExtractionComplete(true);
                      setIsExtractingData(false);
                    } catch (error) {
                      console.error('Error parsing extracted data:', error);
                      console.error('Raw JSON that failed to parse:', jsonMatch[1]);
                      setIsExtractingData(false);
                    }
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
        content: fullContent
      };
    } catch (error) {
      console.error('Error in sendOnboardingMessage:', error);
      throw error;
    }
  }, []);

  return {
    sendOnboardingMessage,
    isLoading,
    error,
    clearError,
    extractedData,
    dataExtractionComplete,
    isExtractingData,
    resetExtraction: () => {
      setExtractedData({});
      setDataExtractionComplete(false);
      setIsExtractingData(false);
    }
  };
};

const EmployerOnboardingChat = ({ onDataExtracted, onSkip, hideActions = false, existingMessages = [], readonly = false }) => {
  const {
    sendOnboardingMessage,
    isLoading,
    error,
    clearError,
    extractedData,
    dataExtractionComplete,
    isExtractingData,
    resetExtraction
  } = useEmployerOnboardingChat();
  
  const { success: toastSuccess, error: toastError } = useToast();
  const [messages, setMessages] = useState(existingMessages.length > 0 ? existingMessages : []);
  const [inputValue, setInputValue] = useState('');
  const [streamingContent, setStreamingContent] = useState('');
  const [hasStarted, setHasStarted] = useState(existingMessages.length > 0 || readonly);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, streamingContent]);

  // Start the conversation automatically (only if no existing messages and not readonly)
  useEffect(() => {
    if (!hasStarted && !readonly && existingMessages.length === 0) {
      startConversation();
      setHasStarted(true);
    }
  }, [hasStarted, readonly, existingMessages.length]);

  const startConversation = async () => {
    const welcomeMessage = {
      id: Date.now(),
      type: 'ai',
      content: `Welcome to Velai! 🎉 I'm excited to help you set up your company profile and start finding amazing talent from India.

Let's start with the basics - could you tell me about your company? What's the name and what industry are you in?`,
      timestamp: new Date(),
    };
    
    setMessages([welcomeMessage]);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;
    
    clearError();
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    const currentInput = inputValue;
    setInputValue('');
    setStreamingContent('');

    // Create placeholder AI message
    const aiMessageId = Date.now() + 1;
    const aiMessage = {
      id: aiMessageId,
      type: 'ai',
      content: '',
      timestamp: new Date(),
      isStreaming: true
    };
    
    setMessages(prev => [...prev, aiMessage]);

    try {
      await sendOnboardingMessage(
        newMessages,
        (chunk, fullContent) => {
          setStreamingContent(fullContent);
          setMessages(prev => prev.map(msg => 
            msg.id === aiMessageId 
              ? { ...msg, content: fullContent }
              : msg
          ));
        }
      );
      
      // Mark streaming as complete
      setMessages(prev => prev.map(msg => 
        msg.id === aiMessageId 
          ? { ...msg, isStreaming: false }
          : msg
      ));
      
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => prev.map(msg => 
        msg.id === aiMessageId 
          ? { 
              ...msg, 
              content: `I apologize, but I encountered an error: ${error.message}. Please try again.`,
              isError: true,
              isStreaming: false 
            }
          : msg
      ));
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleUseExtractedData = (action = 'submit') => {
    console.log('=== Using Extracted Data ===');
    console.log('Extracted data to pass:', extractedData);
    console.log('Data keys count:', Object.keys(extractedData).length);
    console.log('Action:', action);
    console.log('Current messages:', messages);
    
    if (Object.keys(extractedData).length > 0) {
      if (action === 'showArtifacts') {
        // Show artifacts view
        toastSuccess('✨ Perfect! Here\'s your detailed company profile.');
        onDataExtracted(extractedData, 'showArtifacts', messages);
      } else {
        // Direct submission
        toastSuccess('🎉 Great! Let me complete your setup with this information.');
        onDataExtracted(extractedData, 'submit', messages);
      }
    } else {
      console.warn('No extracted data available!');
    }
  };

  const handleSkipChat = () => {
    // Pass any extracted data and current messages to the skip handler
    onSkip(extractedData, messages);
  };

  const formatMessage = (content) => {
    // Remove JSON blocks from display and check if message contains JSON
    const hasJson = /```json\s*\n[\s\S]*?\n```/.test(content);
    const cleanContent = content.replace(/```json\s*\n[\s\S]*?\n```/g, '').trim();
    
    // If the message only contained JSON (or mostly JSON), don't show it
    if (hasJson && cleanContent.length < 20) {
      return null; // Don't render JSON-only messages
    }
    
    // Use MarkdownRenderer for the cleaned content
    return <MarkdownRenderer content={cleanContent} />;
  };

  const quickStarterPrompts = [
    "We're a tech startup in Berlin",
    "We're a manufacturing company in Munich",
    "We're a healthcare organization looking to expand"
  ];

  return (
    <div className="h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl h-full max-h-[800px] bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">V</span>
            </div>
            <div>
              <span className="font-semibold text-gray-900">Velai Setup Assistant</span>
              <p className="text-sm text-gray-500">Let's gather your company information</p>
            </div>
          </div>
          
          {/* Data extraction status */}
          {dataExtractionComplete && (
            <div className="flex items-center space-x-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-700">Information Gathered!</span>
            </div>
          )}
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start gap-3`}>
                  {message.type === 'ai' && (
                    <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center flex-shrink-0 shadow-sm border border-gray-200">
                      <img src={iconmark} alt="Velai" className="w-6 h-6 object-contain" />
                    </div>
                  )}
                  <div className="flex-1">
                    {message.type === 'ai' && (
                      <div className="font-bold text-gray-900 text-sm mb-2">Velai Assistant</div>
                    )}
                    <div className={`${
                      message.type === 'user'
                        ? 'rounded-2xl px-5 py-4 bg-violet-600 text-white shadow-sm'
                        : 'text-gray-900'
                    }`}>
                      <div className="text-sm leading-relaxed">
                        {message.type === 'ai' ? (
                          <>
                            {formatMessage(message.content) && (
                              <>
                                {formatMessage(message.content)}
                                {message.isStreaming && message.content && (
                                  <span className="text-gray-400 ml-1">...</span>
                                )}
                              </>
                            )}
                            {message.isStreaming && !message.content && (
                              <div className="text-gray-500 italic">
                                <StreamingDots />
                              </div>
                            )}
                          </>
                        ) : (
                          message.content
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Data Extraction Loading Indicator */}
            {isExtractingData && (
              <div className="flex justify-start">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center flex-shrink-0 shadow-sm border border-gray-200">
                    <img src={iconmark} alt="Velai" className="w-6 h-6 object-contain" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-gray-900 text-sm mb-2">Velai Assistant</div>
                    <div className="bg-gradient-to-r from-blue-50 to-violet-50 border border-blue-200 rounded-xl p-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <div className="text-sm text-gray-700">
                          <span className="font-medium">Analyzing your company information...</span>
                          <br />
                          <span className="text-gray-600">I'm extracting the key details to create your profile.</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Company Summary Card */}
            {dataExtractionComplete && Object.keys(extractedData).length > 0 && (
              <div className="flex justify-start">
                <div className="flex items-start gap-3 max-w-[80%]">
                  <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center flex-shrink-0 shadow-sm border border-gray-200">
                    <img src={iconmark} alt="Velai" className="w-6 h-6 object-contain" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-gray-900 text-sm mb-2">Velai Assistant</div>
                    
                    {/* Summary Card */}
                    <div 
                      onClick={() => handleUseExtractedData('showArtifacts')}
                      className="bg-white border-2 border-violet-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer hover:border-violet-300 group"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center">
                            <Building2 className="w-6 h-6 text-violet-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-900 group-hover:text-violet-700 transition-colors">
                              {extractedData.companyName || 'Company Profile'}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {extractedData.industry && `${extractedData.industry} • `}
                              {extractedData.companySize && extractedData.companySize}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1 bg-blue-50 border border-blue-200 rounded-full px-3 py-1">
                          <Bot className="w-4 h-4 text-blue-600" />
                          <span className="text-xs font-medium text-blue-700">AI Generated</span>
                        </div>
                      </div>
                      
                      {extractedData.location && (
                        <div className="flex items-center text-gray-600 mb-3">
                          <MapPin className="w-4 h-4 mr-2" />
                          <span className="text-sm">{extractedData.location}</span>
                        </div>
                      )}
                      
                      {extractedData.description && (
                        <p className="text-sm text-gray-700 mb-4 line-clamp-2">
                          {extractedData.description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500">
                          Click to view detailed profile
                        </div>
                        <div className="flex items-center text-violet-600 group-hover:text-violet-700 transition-colors">
                          <span className="text-sm font-medium mr-2">View Details</span>
                          <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Error Display */}
          {error && (
            <div className="mx-6 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-700 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
                <button 
                  onClick={clearError}
                  className="ml-auto text-red-600 underline hover:text-red-800"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Quick starters for first message */}
          {messages.length <= 1 && !inputValue && (
            <div className="px-6 pb-4">
              <p className="text-xs text-gray-500 mb-3">Quick starters:</p>
              <div className="space-y-2">
                {quickStarterPrompts.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => setInputValue(prompt)}
                    className="block w-full text-left p-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 text-sm hover:bg-gray-100 hover:border-gray-300 transition-colors"
                  >
                    "{prompt}"
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area - Hidden in readonly mode */}
          {!readonly && (
            <div className="border-t border-gray-200 p-6">
              <div className="flex items-end space-x-3">
                <div className="flex-1">
                  <textarea
                    ref={textareaRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Tell me about your company..."
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
                    rows={2}
                    disabled={isLoading}
                  />
                </div>
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-3 rounded-lg flex items-center space-x-2"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          )}
          
          {/* Readonly indicator */}
          {readonly && (
            <div className="border-t border-gray-200 p-4 bg-gray-50">
              <div className="text-center text-sm text-gray-500">
                Your conversation history
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons - Only show if not hidden and not readonly */}
        {!hideActions && !readonly && (
          <div className="border-t border-gray-200 p-6">
            {/* Show extracted data summary if available but not complete */}
            {Object.keys(extractedData).length > 0 && !dataExtractionComplete && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 text-blue-700 text-sm">
                  <Sparkles className="w-4 h-4" />
                  <span className="font-medium">Information being gathered...</span>
                </div>
                <p className="text-blue-600 text-xs mt-1">
                  I've collected some details about your company. You can continue chatting or proceed to the form.
                </p>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={handleSkipChat}
                className="text-gray-600 border-gray-300 hover:bg-gray-50"
              >
                {Object.keys(extractedData).length > 0 
                  ? 'Continue with Form (Data Saved)' 
                  : 'Skip & Fill Manually'
                }
              </Button>
              
              {dataExtractionComplete && (
                <Button
                  variant="primary"
                  onClick={() => handleUseExtractedData('submit')}
                  className="bg-violet-600 hover:bg-violet-700 text-white flex items-center space-x-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Complete Setup Now</span>
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployerOnboardingChat;
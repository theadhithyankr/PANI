import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Minimize2, Send, Sparkles, Plus, FileText, Users } from 'lucide-react';
import Button from '../common/Button';
import { useAuth } from '../../hooks/common';

const ChatWidget = ({ onJobCreated }) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: `Hello ${user?.name || 'there'}! 👋\n\nI'm your AI recruitment assistant. I can help you:\n\n• Create compelling job postings\n• Generate job descriptions\n• Find the right candidates\n• Optimize your hiring process\n\nWhat would you like to work on today?`,
      timestamp: new Date(),
      suggestedActions: [
        'Create a job posting',
        'Get job description ideas',
        'Find candidates',
        'Hiring best practices'
      ]
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentFlow, setCurrentFlow] = useState(null);
  const [jobData, setJobData] = useState({});
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  const handleSendMessage = async (message = inputValue) => {
    if (!message.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: message,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = generateAIResponse(message);
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: aiResponse.content,
        timestamp: new Date(),
        suggestedActions: aiResponse.suggestedActions,
        jobPreview: aiResponse.jobPreview,
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
      
      if (aiResponse.flow) {
        setCurrentFlow(aiResponse.flow);
      }
      if (aiResponse.jobData) {
        setJobData(prev => ({ ...prev, ...aiResponse.jobData }));
      }
    }, 1500);
  };

  const generateAIResponse = (userInput) => {
    const input = userInput.toLowerCase();
    
    // Job creation flow
    if (input.includes('create') && input.includes('job') || input.includes('job posting')) {
      setCurrentFlow('job-creation');
      return {
        content: "Great! I'll help you create an amazing job posting. Let's start with the basics.\n\nWhat position are you looking to fill?",
        suggestedActions: ['Software Engineer', 'Product Manager', 'Data Scientist', 'UX Designer'],
        flow: 'job-creation-title'
      };
    }

    // Job creation flow - title
    if (currentFlow === 'job-creation-title') {
      setJobData(prev => ({ ...prev, title: userInput }));
      return {
        content: `Perfect! A ${userInput} position. Now, where will this role be based?`,
        suggestedActions: ['Berlin, Germany', 'Munich, Germany', 'Remote', 'Hybrid'],
        flow: 'job-creation-location',
        jobData: { title: userInput }
      };
    }

    // Job creation flow - location
    if (currentFlow === 'job-creation-location') {
      setJobData(prev => ({ ...prev, location: userInput }));
      return {
        content: `Excellent! ${userInput} is a great location. What type of employment are you offering?`,
        suggestedActions: ['Full-time', 'Part-time', 'Contract', 'Internship'],
        flow: 'job-creation-type',
        jobData: { location: userInput }
      };
    }

    // Job creation flow - type
    if (currentFlow === 'job-creation-type') {
      setJobData(prev => ({ ...prev, type: userInput }));
      return {
        content: `Got it! ${userInput} position. What's the salary range for this role?`,
        suggestedActions: ['€50,000 - €70,000', '€70,000 - €90,000', '€90,000 - €120,000', 'Competitive'],
        flow: 'job-creation-salary',
        jobData: { type: userInput }
      };
    }

    // Job creation flow - salary
    if (currentFlow === 'job-creation-salary') {
      const completeJobData = { ...jobData, salary: userInput };
      setJobData(completeJobData);
      
      return {
        content: `Perfect! I've gathered all the basic information. Let me create a job posting for you:\n\n**${completeJobData.title}**\n📍 ${completeJobData.location}\n💼 ${completeJobData.type}\n💰 ${userInput}\n\nWould you like me to generate a complete job description, or would you prefer to customize it further?`,
        suggestedActions: ['Generate full description', 'Customize details', 'Add requirements', 'Preview & publish'],
        flow: 'job-creation-complete',
        jobData: { salary: userInput },
        jobPreview: completeJobData
      };
    }

    // Generate full description
    if (input.includes('generate full description') || input.includes('generate description')) {
      return {
        content: `I've created a comprehensive job description for your ${jobData.title} position:\n\n**Job Description:**\nWe are seeking a talented ${jobData.title} to join our innovative team. This role offers an exciting opportunity to work with cutting-edge technologies and contribute to meaningful projects.\n\n**Key Responsibilities:**\n• Develop and maintain high-quality software solutions\n• Collaborate with cross-functional teams\n• Participate in code reviews and technical discussions\n• Contribute to architectural decisions\n\n**Requirements:**\n• 3+ years of relevant experience\n• Strong technical skills\n• Excellent communication abilities\n• Team player with problem-solving mindset\n\n**Benefits:**\n• Competitive salary and benefits\n• Flexible working arrangements\n• Professional development opportunities\n• Modern office environment\n\nWould you like to publish this job posting or make any adjustments?`,
        suggestedActions: ['Publish job posting', 'Edit description', 'Add more requirements', 'Change benefits'],
        flow: 'job-ready'
      };
    }

    // Publish job
    if (input.includes('publish') && currentFlow === 'job-ready') {
      setTimeout(() => {
        onJobCreated && onJobCreated({
          ...jobData,
          description: 'AI-generated job description',
          status: 'active',
          postedDate: new Date().toISOString().split('T')[0],
          applicationsCount: 0,
          viewsCount: 0,
        });
      }, 1000);
      
      return {
        content: `🎉 Excellent! Your ${jobData.title} job posting has been published successfully!\n\nYour job is now live and candidates can start applying. I'll notify you when applications start coming in.\n\nIs there anything else I can help you with today?`,
        suggestedActions: ['Create another job', 'Find candidates', 'View job analytics', 'Hiring tips'],
        flow: null
      };
    }

    // Find candidates
    if (input.includes('find candidates') || input.includes('candidates')) {
      return {
        content: "I can help you find the perfect candidates! Here's what I can do:\n\n• **Smart Search**: Find candidates based on specific skills and experience\n• **AI Matching**: Get candidates ranked by compatibility\n• **Talent Pipeline**: Build a pool of potential candidates\n• **Market Insights**: Understand talent availability\n\nWhat type of candidates are you looking for?",
        suggestedActions: ['Software developers', 'Product managers', 'Designers', 'Data scientists']
      };
    }

    // Hiring best practices
    if (input.includes('hiring') && input.includes('practices') || input.includes('tips')) {
      return {
        content: "Here are some proven hiring best practices:\n\n**📝 Job Posting Tips:**\n• Use clear, specific job titles\n• Include salary ranges for transparency\n• Highlight company culture and benefits\n• Keep requirements realistic\n\n**🔍 Candidate Evaluation:**\n• Use structured interviews\n• Focus on both skills and cultural fit\n• Provide timely feedback\n• Consider diverse perspectives\n\n**⚡ Process Optimization:**\n• Streamline application process\n• Set clear expectations\n• Communicate regularly with candidates\n• Use data to improve decisions\n\nWould you like me to elaborate on any of these areas?",
        suggestedActions: ['Interview techniques', 'Candidate experience', 'Diversity hiring', 'Onboarding tips']
      };
    }

    // Default responses
    const defaultResponses = [
      "I understand you're looking for help with recruitment. I can assist with creating job postings, finding candidates, or providing hiring advice. What would you like to focus on?",
      "That's an interesting question! I'm here to help with your recruitment needs. Would you like to create a job posting, search for candidates, or get some hiring insights?",
      "I'm here to make your hiring process easier and more effective. How can I assist you today?"
    ];

    return {
      content: defaultResponses[Math.floor(Math.random() * defaultResponses.length)],
      suggestedActions: ['Create job posting', 'Find candidates', 'Hiring best practices', 'Interview tips']
    };
  };

  const handleSuggestedAction = (action) => {
    handleSendMessage(action);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          variant="primary"
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className={`bg-white rounded-lg shadow-2xl border border-gray-200 transition-all duration-300 ${
        isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-lg">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">AI Assistant</h3>
              <p className="text-xs text-gray-500">Always here to help</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
            >
              <Minimize2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 h-[480px]">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] rounded-lg px-4 py-3 ${
                    message.type === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    <div className="text-sm leading-relaxed whitespace-pre-line">
                      {message.content}
                    </div>
                    {message.suggestedActions && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {message.suggestedActions.map((action, index) => (
                          <button
                            key={index}
                            onClick={() => handleSuggestedAction(action)}
                            className="px-3 py-1 text-xs bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 transition-colors"
                          >
                            {action}
                          </button>
                        ))}
                      </div>
                    )}
                    <div className={`text-xs mt-2 ${
                      message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg px-4 py-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center space-x-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about recruitment..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <Button
                  onClick={() => handleSendMessage()}
                  disabled={!inputValue.trim()}
                  variant="primary"
                  size="sm"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ChatWidget;

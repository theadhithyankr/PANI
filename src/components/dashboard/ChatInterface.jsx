import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Send, Paperclip, FileText, Image, File, X, Bot, User, Briefcase, Users, FileBarChart, MessageSquare, MoreVertical, Edit3, Pin, Trash2, Check, AlertCircle, RotateCcw, ThumbsUp, ThumbsDown, Info, PlusCircle, Calendar, FileEdit, Zap, Globe } from 'lucide-react';
import { useAuth, useGroqChat } from '../../hooks/common';
import Button from '../common/Button';
import Header from '../common/Header';
import useChatStore from '../../store/useChatStore';
import logo from '../../assets/logos/logo.svg';
import iconmark from '../../assets/logos/iconmark.svg';

// Streaming dots component
const StreamingDots = () => {
  const { t } = useTranslation();
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
  
  return <span>{t('chatInterface.thinking')}{dots}</span>;
};

const ChatInterface = ({ currentChatTitle = null, showHeader = true }) => {
  const { user } = useAuth();
  const { sendMessageStream, isLoading: aiLoading, error: aiError, clearError } = useGroqChat();
  const location = useLocation();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  
  // Chat store integration
  const { 
    createChat, 
    addMessageToChat, 
    updateChatTitle, 
    getChatById, 
    setCurrentChatId,
    currentChatId,
    pinChat,
    unpinChat,
    isPinned: isChatPinned,
    deleteChat,
    setCurrentUserId
  } = useChatStore();

  // Scope chat store to the current user
  useEffect(() => {
    if (user?.id) {
      setCurrentUserId(user.id);
    }
  }, [user?.id, setCurrentUserId]);

  // Initialize chat data
  const chatId = location.state?.chatId;
  const existingChat = chatId ? getChatById(chatId) : null;
  const initialMessages = existingChat?.messages || location.state?.messages || [];
  
  const [messages, setMessages] = useState(initialMessages);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isChatting, setIsChatting] = useState(initialMessages.length > 0);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [currentChatInfo, setCurrentChatInfo] = useState(existingChat);
  const [streamingMessageId, setStreamingMessageId] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);
  const [showInfoTooltip, setShowInfoTooltip] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language || 'en');
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const moreOptionsRef = useRef(null);

  // Get chat title from current chat or fallback
  const chatTitle = currentChatInfo?.title || currentChatTitle || location.state?.chatTitle || t('chatInterface.newChat');
  const isPinned = currentChatInfo ? isChatPinned(currentChatInfo.id) : false;
  
  // Setup breadcrumbs for the header
  const breadcrumbs = [
    {
      name: t('chatInterface.allChats'),
      href: '/dashboard/chat-history'
    },
    {
      name: chatTitle
    }
  ];

  const handleNavigateToAllChats = () => {
    navigate('/dashboard/chat-history');
  };

  const handleEditTitle = () => {
    setEditedTitle(chatTitle);
    setIsEditingTitle(true);
    setShowMoreOptions(false);
  };

  const handleSaveTitle = () => {
    if (editedTitle.trim() && currentChatInfo) {
      updateChatTitle(currentChatInfo.id, editedTitle.trim());
      setCurrentChatInfo(prev => ({ ...prev, title: editedTitle.trim() }));
      setIsEditingTitle(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingTitle(false);
    setEditedTitle('');
  };

  const handlePinChat = () => {
    if (currentChatInfo) {
      if (isPinned) {
        unpinChat(currentChatInfo.id);
      } else {
        pinChat(currentChatInfo.id);
      }
    }
    setShowMoreOptions(false);
  };

  const handleDeleteChat = () => {
    if (window.confirm(t('chatInterface.deleteConfirm'))) {
      if (currentChatInfo) {
        deleteChat(currentChatInfo.id);
      }
      navigate('/dashboard/chat-history');
    }
    setShowMoreOptions(false);
  };

  // Close more options and info tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (moreOptionsRef.current && !moreOptionsRef.current.contains(event.target)) {
        setShowMoreOptions(false);
      }
      // Close info tooltip when clicking outside
      if (showInfoTooltip && !event.target.closest('.info-tooltip-container')) {
        setShowInfoTooltip(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showInfoTooltip]);

  useEffect(() => {
    i18n.changeLanguage(selectedLanguage);
  }, [selectedLanguage, i18n]);

  // Clear AI error when component mounts or user starts typing
  useEffect(() => {
    if (aiError) {
      clearError();
    }
  }, [inputValue]);

  // Get suggestion chips based on user type
  const getSuggestionChips = () => {
    // Check both user.type and user.user_type
    const userType = user?.type || user?.user_type;
    
    // Check if user is a job seeker (either 'candidate' or 'job_seeker')
    if (userType === 'candidate' || userType === 'job_seeker') {
      return [
        { text: t('chatInterface.suggestions.analyzeResume'), icon: <FileBarChart className="w-4 h-4" /> },
        { text: t('chatInterface.suggestions.generateQuestions'), icon: <MessageSquare className="w-4 h-4" /> },
        { text: t('chatInterface.suggestions.optimizeProfile'), icon: <User className="w-4 h-4" /> },
        { text: t('chatInterface.suggestions.careerAdvice'), icon: <Briefcase className="w-4 h-4" /> }
      ];
    } else if (userType === 'employer') {
      return [
        { text: t('chatInterface.suggestions.createJob'), icon: <Briefcase className="w-4 h-4" /> },
        { text: t('chatInterface.suggestions.findCandidates'), icon: <Users className="w-4 h-4" /> },
        { text: t('chatInterface.suggestions.analyzeResume'), icon: <FileBarChart className="w-4 h-4" /> },
        { text: t('chatInterface.suggestions.generateQuestions'), icon: <MessageSquare className="w-4 h-4" /> }
      ];
    } else {
      // Default to employer suggestions if user type is not recognized
      return [
        { text: t('chatInterface.suggestions.createJob'), icon: <Briefcase className="w-4 h-4" /> },
        { text: t('chatInterface.suggestions.findCandidates'), icon: <Users className="w-4 h-4" /> },
        { text: t('chatInterface.suggestions.analyzeResume'), icon: <FileBarChart className="w-4 h-4" /> },
        { text: t('chatInterface.suggestions.generateQuestions'), icon: <MessageSquare className="w-4 h-4" /> }
      ];
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isChatting) scrollToBottom();
  }, [messages, isChatting]);

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    const newFiles = files.map(file => ({
      id: Date.now() + Math.random(),
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      preview: URL.createObjectURL(file)
    }));
    setAttachedFiles(prev => [...prev, ...newFiles]);
    
    // Automatically focus the text input after file upload
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 100);
  };

  const removeFile = (fileId) => {
    setAttachedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) return <Image className="w-4 h-4" />;
    if (fileType === 'application/pdf') return <FileText className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return `0 ${t('chatInterface.fileSize.bytes')}`;
    const k = 1024;
    const sizes = [t('chatInterface.fileSize.bytes'), t('chatInterface.fileSize.kb'), t('chatInterface.fileSize.mb'), t('chatInterface.fileSize.gb')];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSuggestionClick = (suggestion) => {
    setInputValue(suggestion);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleEditMessage = (message) => {
    setInputValue(message.content);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
    // Scroll to input
    setTimeout(() => {
      textareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const handleRegenerateMessage = (messageId) => {
    // Find the user message that preceded this AI message
    const messageIndex = messages.findIndex(msg => msg.id === messageId);
    if (messageIndex > 0) {
      // Remove all messages after the previous user message
      const userMessageIndex = messageIndex - 1;
      const truncatedMessages = messages.slice(0, userMessageIndex + 1);
      setMessages(truncatedMessages);
      
      // Regenerate response for the last user message
      const lastUserMessage = messages[userMessageIndex];
      if (lastUserMessage.type === 'user') {
        // Re-send the last user message
        regenerateResponse(truncatedMessages, lastUserMessage);
      }
    }
  };

  const regenerateResponse = async (messageHistory, userMessage) => {
    setIsTyping(true);
    
    // Create an initial AI message placeholder for streaming
    const aiMessageId = Date.now() + 1;
    const aiMessage = {
      id: aiMessageId,
      type: 'ai',
      content: '',
      timestamp: new Date(),
      isStreaming: true
    };
    
    setMessages(prev => [...prev, aiMessage]);
    setStreamingMessageId(aiMessageId);

    try {
      // Send message to AI with streaming
      await sendMessageStream(
        messageHistory, 
        userMessage.files || [],
        (chunk, fullContent) => {
          // Update the streaming message with new content
          setMessages(prev => prev.map(msg => 
            msg.id === aiMessageId 
              ? { ...msg, content: fullContent }
              : msg
          ));
        },
        selectedLanguage
      );
      
      // Mark streaming as complete
      setMessages(prev => prev.map(msg => 
        msg.id === aiMessageId 
          ? { ...msg, isStreaming: false }
          : msg
      ));
      
    } catch (error) {
      console.error('Error regenerating message:', error);
      
      // Update the AI message with error content
      setMessages(prev => prev.map(msg => 
        msg.id === aiMessageId 
          ? { 
              ...msg, 
              content: t('chatInterface.error.generic', { message: error.message }),
              isError: true,
              isStreaming: false 
            }
          : msg
      ));
    } finally {
      setIsTyping(false);
      setStreamingMessageId(null);
    }
  };

  const handleThumbsUp = (messageId) => {
    // Update message with thumbs up
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, feedback: 'up' }
        : msg
    ));
    // Here you would typically send feedback to your backend
    console.log('Thumbs up for message:', messageId);
  };

  const handleThumbsDown = (messageId) => {
    // Update message with thumbs down
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, feedback: 'down' }
        : msg
    ));
    // Here you would typically send feedback to your backend
    console.log('Thumbs down for message:', messageId);
  };

  const handleInfoClick = (messageId, event) => {
    event.stopPropagation();
    setShowInfoTooltip(showInfoTooltip === messageId ? null : messageId);
  };

  // Get suggested actions based on conversation context
  const getSuggestedActions = (messageContent, userType) => {
    const content = messageContent.toLowerCase();
    const actions = [];

    if (userType === 'employer') {
      // Job posting related
      if (content.includes('job description') || content.includes('job posting') || content.includes('requirements') || content.includes('qualifications')) {
        actions.push({
          id: 'create-job-post',
          title: t('chatInterface.actions.createJob.title'),
          description: t('chatInterface.actions.createJob.description'),
          icon: <PlusCircle className="w-5 h-5" />,
          color: 'bg-blue-50 border-blue-200 text-blue-900',
          hoverColor: 'hover:bg-blue-100'
        });
      }

      // Interview related
      if (content.includes('interview') || content.includes('candidate') || content.includes('assessment')) {
        actions.push({
          id: 'schedule-interview',
          title: t('chatInterface.actions.scheduleInterview.title'),
          description: t('chatInterface.actions.scheduleInterview.description'),
          icon: <Calendar className="w-5 h-5" />,
          color: 'bg-green-50 border-green-200 text-green-900',
          hoverColor: 'hover:bg-green-100'
        });
      }

      // Communication/Letter drafting
      if (content.includes('offer') || content.includes('rejection') || content.includes('communication') || content.includes('email')) {
        actions.push({
          id: 'draft-letter',
          title: t('chatInterface.actions.draftCommunication.title'),
          description: t('chatInterface.actions.draftCommunication.description'),
          icon: <FileEdit className="w-5 h-5" />,
          color: 'bg-purple-50 border-purple-200 text-purple-900',
          hoverColor: 'hover:bg-purple-100'
        });
      }
    } else {
      // Candidate actions
      if (content.includes('resume') || content.includes('cv') || content.includes('application')) {
        actions.push({
          id: 'optimize-resume',
          title: t('chatInterface.actions.optimizeResume.title'),
          description: t('chatInterface.actions.optimizeResume.description'),
          icon: <FileEdit className="w-5 h-5" />,
          color: 'bg-blue-50 border-blue-200 text-blue-900',
          hoverColor: 'hover:bg-blue-100'
        });
      }

      if (content.includes('cover letter') || content.includes('application letter')) {
        actions.push({
          id: 'draft-cover-letter',
          title: t('chatInterface.actions.draftCoverLetter.title'),
          description: t('chatInterface.actions.draftCoverLetter.description'),
          icon: <FileEdit className="w-5 h-5" />,
          color: 'bg-green-50 border-green-200 text-green-900',
          hoverColor: 'hover:hover:bg-green-100'
        });
      }

      if (content.includes('interview') || content.includes('preparation') || content.includes('practice')) {
        actions.push({
          id: 'interview-prep',
          title: t('chatInterface.actions.interviewPrep.title'),
          description: t('chatInterface.actions.interviewPrep.description'),
          icon: <Zap className="w-5 h-5" />,
          color: 'bg-purple-50 border-purple-200 text-purple-900',
          hoverColor: 'hover:bg-purple-100'
        });
      }
    }

    return actions.slice(0, 3); // Limit to 3 actions
  };

  const handleActionClick = (actionId, messageContent) => {
    console.log('Action clicked:', actionId);
    
    // Find the action details
    const userType = user?.type || user?.user_type;
    const suggestedActions = getSuggestedActions(messageContent, userType);
    const action = suggestedActions.find(a => a.id === actionId);
    
    setSelectedAction(action);
    setShowActionModal(true);
  };

  const closeActionModal = () => {
    setShowActionModal(false);
    setSelectedAction(null);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() && attachedFiles.length === 0) return;
    
    // Clear any previous errors
    clearError();

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputValue,
      files: [...attachedFiles],
      timestamp: new Date(),
    };

    let chatInfo = currentChatInfo;
    
    // Create new chat if this is the first message
    if (!isChatting) {
      setIsChatting(true);
      chatInfo = createChat(userMessage);
      setCurrentChatInfo(chatInfo);
      setCurrentChatId(chatInfo.id);
    } else if (chatInfo) {
      // Add message to existing chat
      addMessageToChat(chatInfo.id, userMessage);
    }

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue;
    const currentFiles = [...attachedFiles];
    setInputValue('');
    setAttachedFiles([]);
    setIsTyping(true);

    // Create an initial AI message placeholder for streaming
    const aiMessageId = Date.now() + 1;
    const aiMessage = {
      id: aiMessageId,
      type: 'ai',
      content: '',
      timestamp: new Date(),
      isStreaming: true
    };
    
    setMessages(prev => [...prev, aiMessage]);
    setStreamingMessageId(aiMessageId);

    try {
      // Send message to AI with streaming
      await sendMessageStream(
        messages.concat(userMessage), 
        currentFiles,
        (chunk, fullContent) => {
          // Update the streaming message with new content
          setMessages(prev => prev.map(msg => 
            msg.id === aiMessageId 
              ? { ...msg, content: fullContent }
              : msg
          ));
        },
        selectedLanguage
      );
      
      // Mark streaming as complete
      setMessages(prev => prev.map(msg => 
        msg.id === aiMessageId 
          ? { ...msg, isStreaming: false }
          : msg
      ));
      
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Update the AI message with error content
      setMessages(prev => prev.map(msg => 
        msg.id === aiMessageId 
          ? { 
              ...msg, 
              content: t('chatInterface.error.generic', { message: error.message }),
              isError: true,
              isStreaming: false 
            }
          : msg
      ));
    } finally {
      setIsTyping(false);
      setStreamingMessageId(null);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [inputValue]);

  // Generate chat title from first user message
  const generateChatTitle = (userMessage) => {
    const content = userMessage.content.trim();
    if (content.length <= 50) return content;
    
    // Find the first sentence or take first 50 characters
    const firstSentence = content.split(/[.!?]/)[0];
    if (firstSentence.length <= 50) {
      return firstSentence.trim();
    }
    
    return content.substring(0, 47).trim() + '...';
  };

  // Save messages to store when they change
  useEffect(() => {
    if (!currentChatInfo || messages.length === 0) return;
    
    // Only update if messages have changed and there are actual messages
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && !lastMessage.isStreaming) {
      // Find messages that are not yet in the store
      const storeChat = getChatById(currentChatInfo.id);
      if (storeChat && storeChat.messages.length < messages.length) {
        // Save the new messages
        const newMessages = messages.slice(storeChat.messages.length);
        newMessages.forEach(message => {
          if (message.type === 'ai' && !message.isStreaming) {
            addMessageToChat(currentChatInfo.id, message);
          }
        });
      }
    }
  }, [messages, currentChatInfo, addMessageToChat, getChatById]);

  // Update chat title when first AI response is received
  useEffect(() => {
    if (!currentChatInfo || messages.length < 2) return;
    
    const firstUserMessage = messages.find(m => m.type === 'user');
    const firstAiMessage = messages.find(m => m.type === 'ai' && !m.isStreaming);
    
    if (firstUserMessage && firstAiMessage && currentChatInfo.title === 'New Chat') {
      const newTitle = generateChatTitle(firstUserMessage);
      updateChatTitle(currentChatInfo.id, newTitle);
      setCurrentChatInfo(prev => ({ ...prev, title: newTitle }));
    }
  }, [messages, currentChatInfo, updateChatTitle]);

  const formatMessage = (content) => {
    return content.split('\n').map((line, index) => {
      if (line.startsWith('• **') && line.includes('**:')) {
        const [title, description] = line.split('**:');
        return (
          <div key={index} className="mb-2">
            <span className="font-semibold text-gray-900">{title.replace('• **', '• ')}</span>
            <span className="text-gray-700">: {description}</span>
          </div>
        );
      }
      if (line.startsWith('• ')) {
        return (
          <div key={index} className="mb-1 text-gray-700">
            {line}
          </div>
        );
      }
      return line ? <div key={index} className="mb-2">{line}</div> : <br key={index} />;
    });
  };

  // Initial State: Centered chatbox only
  if (!isChatting) {
    return (
      <div className="fixed top-0 left-0 lg:left-16 right-0 bottom-0 flex flex-col bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 z-10">
        {/* Header */}
        {showHeader && (
          <Header 
            pageName=""
            breadcrumbs={breadcrumbs}
            searchPlaceholder="Search chats..."
          />
        )}
        
        {/* Main content centered */}
        <div className="flex-1 flex flex-col items-center justify-center px-4">
        {/* Main Title with Logo */}
        <div className="flex items-center justify-center mb-6">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mr-3">
            {
              (() => {
                const userType = user?.type || user?.user_type;
                return (userType === 'candidate' || userType === 'job_seeker')
                  ? t('chatInterface.initialState.hiredWith')
                  : t('chatInterface.initialState.findTalentWith');
              })()
            }
          </h1>
          <img src={logo} alt="Velai" className="w-24 h-24 md:w-28 md:h-28 object-contain" />
        </div>
        
        {/* Subtitle */}
        <p className="text-xl text-gray-600 mb-12 text-center max-w-2xl">
          {
            (() => {
              const userType = user?.type || user?.user_type;
              return (userType === 'candidate' || userType === 'job_seeker')
                ? t('chatInterface.initialState.subtitleSeeker')
                : t('chatInterface.initialState.subtitleEmployer');
            })()
          }
        </p>

        {/* Error Alert */}
        {aiError && (
          <div className="mb-6 w-full max-w-3xl">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800">{t('chatInterface.error.connection')}</h3>
                <p className="text-sm text-red-700 mt-1">{aiError}</p>
                <button 
                  onClick={clearError}
                  className="text-sm text-red-800 underline mt-2 hover:text-red-900"
                >
                  {t('chatInterface.error.dismiss')}
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Input Area */}
        <div className="w-full max-w-3xl">
          {/* File Attachments Preview */}
          {attachedFiles.length > 0 && (
            <div className="mb-6 space-y-3">
              {attachedFiles.map((file) => (
                <div key={file.id} className="flex items-center bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <div className="flex items-center text-gray-600 mr-4">
                    {getFileIcon(file.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                  <button
                    onClick={() => removeFile(file.id)}
                    className="ml-3 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {/* Input Box */}
          <div className="relative mb-8">
            <div className="flex items-end bg-white border border-gray-200 rounded-2xl shadow-lg focus-within:ring-2 focus-within:ring-primary focus-within:border-primary transition-all">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center px-5 py-4 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Paperclip className="w-5 h-5" />
              </button>
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={t('chatInterface.initialState.promptPlaceholder')}
                className="flex-1 bg-transparent outline-none resize-none min-h-[84px] max-h-[120px] py-4 px-0 text-base leading-relaxed"
                rows={3}
              />
              <Button
                onClick={handleSendMessage}
                disabled={(!inputValue.trim() && attachedFiles.length === 0) || aiLoading}
                className="m-3 p-3 bg-primary hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white shadow-sm disabled:bg-gray-200"
              >
                {aiLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>

          {/* Suggestion Chips */}
          <div className="flex flex-wrap justify-center gap-3 max-w-2xl mx-auto">
            {getSuggestionChips().map((chip, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(chip.text)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
              >
                <span className="text-gray-500">{chip.icon}</span>
                {chip.text}
              </button>
            ))}
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileUpload}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xlsx,.xls"
          />
        </div>
        </div>
      </div>
    );
  }

  // Chatting State: Chat history and floating chatbox at bottom center
  return (
    <div className="relative min-h-screen flex flex-col bg-transparent">
      {/* Fixed Chat Header - sticks to top, 65px height */}
      <div className="fixed top-0 left-0 lg:left-16 right-0 bg-white border-b border-gray-200 z-50" style={{ height: '65px' }}>
        <div className="flex items-center justify-between h-full px-6">
          <nav className="flex items-center space-x-1 flex-1 min-w-0">
            <button 
              onClick={handleNavigateToAllChats}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors whitespace-nowrap"
            >
              {t('chatInterface.allChats')}
            </button>
            <span className="text-gray-400 mx-2">›</span>
            <div className="flex items-center min-w-0 flex-1">
              {isPinned && (
                <Pin className="w-4 h-4 text-blue-500 fill-current mr-2 flex-shrink-0" />
              )}
              {isEditingTitle ? (
                <div className="flex items-center space-x-2 flex-1">
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') handleSaveTitle();
                      if (e.key === 'Escape') handleCancelEdit();
                    }}
                    className="flex-1 text-lg font-semibold text-gray-900 bg-transparent border-b border-gray-300 focus:border-blue-500 focus:outline-none"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveTitle}
                    className="p-1 text-green-600 hover:text-green-700"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <h1 className="text-lg font-semibold text-gray-900 truncate">{chatTitle}</h1>
              )}
            </div>
          </nav>
          
          {/* Language Toggle & More Options */}
          <div className="flex items-center gap-2">
            {/* Language Toggle */}
            <div className="flex items-center bg-gray-50 rounded-lg p-1">
              <button
                onClick={() => setSelectedLanguage('en')}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  selectedLanguage === 'en' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setSelectedLanguage('de')}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  selectedLanguage === 'de' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                DE
              </button>
            </div>
            
            {/* More Options */}
            <div className="relative" ref={moreOptionsRef}>
              <button
                onClick={() => setShowMoreOptions(!showMoreOptions)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            
              {showMoreOptions && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
                  <button
                    onClick={handleEditTitle}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    {t('chatInterface.editTitle')}
                  </button>
                  <button
                    onClick={handlePinChat}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                  >
                    <Pin className="w-4 h-4 mr-2" />
                    {isPinned ? t('chatInterface.unpinChat') : t('chatInterface.pinChat')}
                  </button>
                  <hr className="my-1" />
                  <button
                    onClick={handleDeleteChat}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {t('chatInterface.deleteChat')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Chat history - with top padding for fixed header */}
      <div className="flex-1 flex flex-col items-center justify-end pt-20 pb-48 px-4" style={{ paddingTop: '85px' }}>
        <div className="w-full max-w-3xl space-y-8">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`group flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex max-w-[85%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start gap-3`}>
                {message.type === 'ai' && (
                  <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center flex-shrink-0 shadow-sm border border-gray-200">
                    <img src={iconmark} alt="Velai" className="w-6 h-6 object-contain" />
                  </div>
                )}
                <div className="flex-1">
                  {message.type === 'ai' && (
                    <div className="font-bold text-gray-900 text-sm mb-2">
                      {
                        (() => {
                          const userType = user?.type || user?.user_type;
                          return (userType === 'candidate' || userType === 'job_seeker')
                            ? t('chatInterface.aiAssistant.jobSeeker')
                            : t('chatInterface.aiAssistant.employer');
                        })()
                      }
                    </div>
                  )}
                  <div className={`${
                    message.type === 'user'
                      ? 'rounded-2xl px-5 py-4 bg-white border border-gray-200 text-gray-900 shadow-sm relative'
                      : '' // No background for AI messages
                  }`}>
                    {/* User Message Edit Button */}
                    {message.type === 'user' && (
                      <button
                        onClick={() => handleEditMessage(message)}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                        title={t('chatInterface.editTitle')}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* File attachments */}
                    {message.files && message.files.length > 0 && (
                      <div className="mb-4 space-y-2">
                        {message.files.map((file) => (
                          <div key={file.id} className={`flex items-center rounded-lg p-3 border ${
                            message.type === 'user' ? 'bg-gray-50 border-gray-200' : 'bg-gray-50 border-gray-200'
                          }`}>
                            <div className={`flex items-center mr-3 ${
                              message.type === 'user' ? 'text-gray-600' : 'text-gray-600'
                            }`}>
                              {getFileIcon(file.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-medium truncate ${
                                message.type === 'user' ? 'text-gray-900' : 'text-gray-900'
                              }`}>{file.name}</p>
                              <p className={`text-xs ${
                                message.type === 'user' ? 'text-gray-500' : 'text-gray-500'
                              }`}>{formatFileSize(file.size)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Message content */}
                    <div className={`text-sm leading-relaxed ${
                      message.type === 'ai' 
                        ? message.isError 
                          ? 'text-red-600' 
                          : 'text-gray-900'
                        : 'text-gray-900'
                    }`}>
                      {message.type === 'ai' ? (
                        <>
                          {message.content ? formatMessage(message.content) : (
                            message.isStreaming && (
                              <div className="text-gray-500 italic">
                                <StreamingDots />
                              </div>
                            )
                          )}
                          {message.isStreaming && message.content && (
                            <span className="text-gray-400 ml-1">...</span>
                          )}
                        </>
                      ) : (
                        message.content
                      )}
                    </div>
                  </div>

                  {/* Suggested Action Cards - Hidden for now */}
                  {false && message.type === 'ai' && !message.isStreaming && !message.isError && (
                    (() => {
                      const userType = user?.type || user?.user_type;
                      const suggestedActions = getSuggestedActions(message.content, userType);
                      return suggestedActions.length > 0 ? (
                        <div className="mt-6 space-y-4">
                          <div className="grid gap-4">
                            {suggestedActions.map((action) => (
                              <button
                                key={action.id}
                                onClick={() => handleActionClick(action.id, message.content)}
                                className={`p-6 rounded-2xl border-2 transition-all text-left ${action.color} ${action.hoverColor} hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]`}
                              >
                                <div className="flex items-center gap-4">
                                  <div className="flex-shrink-0 p-3 bg-white/50 rounded-xl">
                                    {action.icon}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-bold text-base mb-1">
                                      {action.title}
                                    </div>
                                    <div className="text-sm opacity-75">
                                      {action.description}
                                    </div>
                                  </div>
                                  <div className="flex-shrink-0 text-lg opacity-60">
                                    →
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : null;
                    })()
                  )}

                  {/* AI Message Action Buttons */}
                  {message.type === 'ai' && !message.isStreaming && (
                    <div className="flex items-center gap-1 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleRegenerateMessage(message.id)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title={t('chatInterface.tooltips.regenerate')}
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleThumbsUp(message.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          message.feedback === 'up' 
                            ? 'text-green-600 bg-green-50' 
                            : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                        }`}
                        title={t('chatInterface.tooltips.goodResponse')}
                      >
                        <ThumbsUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleThumbsDown(message.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          message.feedback === 'down' 
                            ? 'text-red-600 bg-red-50' 
                            : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                        }`}
                        title={t('chatInterface.tooltips.poorResponse')}
                      >
                        <ThumbsDown className="w-4 h-4" />
                      </button>
                      <div className="relative info-tooltip-container">
                        <button
                          onClick={(e) => handleInfoClick(message.id, e)}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title={t('chatInterface.tooltips.info')}
                        >
                          <Info className="w-4 h-4" />
                        </button>
                        
                        {/* Info Tooltip */}
                        {showInfoTooltip === message.id && (
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50">
                            <div className="bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg min-w-48">
                              <div className="flex items-center gap-2 mb-2">
                                <img src={iconmark} alt="Velai" className="w-4 h-4 object-contain" />
                                <span className="font-semibold">Velai AI v2</span>
                              </div>
                              <div className="space-y-1 text-gray-300">
                                <div>{t('chatInterface.info.model', { modelName: 'Velai AI v2' })}</div>
                                <div>{t('chatInterface.info.generated', { timestamp: new Date(message.timestamp).toLocaleString() })}</div>
                                <div>{t('chatInterface.info.responseId', { id: message.id })}</div>
                              </div>
                              {/* Tooltip arrow */}
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {isTyping && !streamingMessageId && (
            <div className="flex justify-start">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center flex-shrink-0 shadow-sm border border-gray-200">
                  <img src={iconmark} alt="Velai" className="w-6 h-6 object-contain" />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-gray-900 text-sm mb-2">VelaiBuddy</div>
                  <div className="text-gray-500 italic text-sm">
                    <StreamingDots />
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      {/* Floating chatbox at bottom center */}
      <div className="fixed left-1/2 bottom-6 transform -translate-x-1/2 w-full max-w-3xl px-4 z-50">
        {/* Error Alert */}
        {aiError && (
          <div className="mb-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-red-700">{aiError}</p>
                <button 
                  onClick={clearError}
                  className="text-xs text-red-600 underline mt-1 hover:text-red-800"
                >
                  {t('chatInterface.error.dismiss')}
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* File Attachments Preview */}
        {attachedFiles.length > 0 && (
          <div className="mb-4 space-y-3">
            {attachedFiles.map((file) => (
              <div key={file.id} className="flex items-center bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                <div className="flex items-center text-gray-600 mr-4">
                  {getFileIcon(file.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                </div>
                <button
                  onClick={() => removeFile(file.id)}
                  className="ml-3 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
        
        {/* Input Box */}
        <div className="flex items-end bg-white border border-gray-200 rounded-2xl shadow-lg focus-within:ring-2 focus-within:ring-primary focus-within:border-primary transition-all">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center px-5 py-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={t('chatInterface.input.placeholder')}
            className="flex-1 bg-transparent outline-none resize-none min-h-[60px] max-h-[120px] py-4 px-0 text-base leading-relaxed"
            rows={2}
          />
          <Button
            onClick={handleSendMessage}
            disabled={(!inputValue.trim() && attachedFiles.length === 0) || aiLoading}
            className="m-3 p-3 bg-primary hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white shadow-sm disabled:bg-gray-200"
          >
            {aiLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
        
        {/* Disclaimer */}
        <p className="text-xs text-gray-500 mt-4 text-center">
          {t('chatInterface.disclaimer')}
        </p>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileUpload}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xlsx,.xls"
        />
      </div>

      {/* Action Modal */}
      {showActionModal && selectedAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl ${selectedAction.color}`}>
                    {selectedAction.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {selectedAction.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {selectedAction.description}
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeActionModal}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="text-center text-gray-500 py-12">
                <div className="text-4xl mb-4">🚧</div>
                <h4 className="text-lg font-semibold mb-2">{t('chatInterface.actionModal.comingSoon')}</h4>
                <p className="text-sm">
                  {t('chatInterface.actionModal.inDevelopment')}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatInterface;

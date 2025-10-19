import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MessageSquare, 
  Search, 
  Filter, 
  Plus, 
  Calendar,
  Bot,
  MoreVertical,
  Pin,
  Archive,
  Trash2
} from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';

const ChatHistoryPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  // Mock chat history data (in a real app, this would come from API)
  const chatHistory = [
    {
      id: 1,
      title: "Job Search Assistance",
      lastMessage: "Thank you for helping me find software engineering positions in Seattle. The recommendations were very helpful!",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      messageCount: 15,
      isPinned: true,
      isArchived: false,
      category: "job_search"
    },
    {
      id: 2,
      title: "Resume Review",
      lastMessage: "Can you help me improve my resume for data science roles?",
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      messageCount: 8,
      isPinned: false,
      isArchived: false,
      category: "career_advice"
    },
    {
      id: 3,
      title: "Interview Preparation",
      lastMessage: "What are some common questions for product manager interviews?",
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      messageCount: 22,
      isPinned: false,
      isArchived: false,
      category: "interview_prep"
    },
    {
      id: 4,
      title: "Salary Negotiation Tips",
      lastMessage: "How should I approach salary negotiation for my upcoming offer?",
      timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
      messageCount: 12,
      isPinned: false,
      isArchived: false,
      category: "career_advice"
    },
    {
      id: 5,
      title: "Technical Skills Assessment",
      lastMessage: "Which programming languages should I focus on for mobile development?",
      timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 2 weeks ago
      messageCount: 18,
      isPinned: false,
      isArchived: true,
      category: "skills"
    }
  ];

  const filterOptions = [
    { value: 'all', label: 'All Chats' },
    { value: 'job_search', label: 'Job Search' },
    { value: 'career_advice', label: 'Career Advice' },
    { value: 'interview_prep', label: 'Interview Prep' },
    { value: 'skills', label: 'Skills' }
  ];

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const diffInHours = (now - timestamp) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else if (diffInHours < 168) { // 1 week
      return `${Math.floor(diffInHours / 24)} days ago`;
    } else {
      return timestamp.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: timestamp.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const filteredChats = chatHistory.filter(chat => {
    const matchesSearch = chat.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         chat.lastMessage.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || chat.category === selectedFilter;
    const isNotArchived = !chat.isArchived;
    
    return matchesSearch && matchesFilter && isNotArchived;
  });

  const pinnedChats = filteredChats.filter(chat => chat.isPinned);
  const regularChats = filteredChats.filter(chat => !chat.isPinned);

  const handleChatClick = (chat) => {
    // Navigate to chat interface with the selected chat
    navigate('/dashboard', { state: { chatId: chat.id, chatTitle: chat.title } });
  };

  const handleNewChat = () => {
    navigate('/dashboard');
  };

  const ChatCard = ({ chat }) => (
    <Card 
      key={chat.id}
      className="p-4 hover:shadow-md transition-shadow cursor-pointer group relative"
      onClick={() => handleChatClick(chat)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-gray-800 to-gray-900 rounded-full flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-white" strokeWidth={1.5} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-gray-900 truncate">
                  {chat.title}
                </h3>
                {chat.isPinned && (
                  <Pin className="w-3 h-3 text-blue-500 fill-current" />
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>{chat.messageCount} messages</span>
                <span>•</span>
                <span>{formatTimestamp(chat.timestamp)}</span>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
            {chat.lastMessage}
          </p>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          className="opacity-0 group-hover:opacity-100 transition-opacity ml-2"
          onClick={(e) => {
            e.stopPropagation();
            // Handle more options (pin, archive, delete)
          }}
        >
          <MoreVertical className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chat History</h1>
          <p className="text-gray-600 mt-1">Your conversations with Velai Buddy</p>
        </div>
        <Button onClick={handleNewChat} className="bg-primary hover:bg-primary-600">
          <Plus className="w-4 h-4 mr-2" />
          New Chat
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search chats..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm"
          >
            {filterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Pinned Chats */}
      {pinnedChats.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Pin className="w-4 h-4" />
            Pinned Chats
          </h2>
          <div className="space-y-3">
            {pinnedChats.map((chat) => (
              <ChatCard key={chat.id} chat={chat} />
            ))}
          </div>
        </div>
      )}

      {/* Recent Chats */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {pinnedChats.length > 0 ? 'Recent Chats' : 'All Chats'}
        </h2>
        
        {regularChats.length === 0 ? (
          <Card className="p-8 text-center">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No chats found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria.' 
                : 'Start a conversation with Velai Buddy to see your chat history here.'
              }
            </p>
            {!searchTerm && selectedFilter === 'all' && (
              <Button onClick={handleNewChat} className="bg-primary hover:bg-primary-600">
                <Plus className="w-4 h-4 mr-2" />
                Start Your First Chat
              </Button>
            )}
          </Card>
        ) : (
          <div className="space-y-3">
            {regularChats.map((chat) => (
              <ChatCard key={chat.id} chat={chat} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatHistoryPage;

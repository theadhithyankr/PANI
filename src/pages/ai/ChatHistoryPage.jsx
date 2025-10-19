import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
import useChatStore from '../../store/useChatStore';
import { useAuth } from '../../hooks/common';

const ChatHistoryPage = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const { user } = useAuth();

  // Zustand store for chat management
  const {
    getConversations,
    searchChats,
    pinChat,
    unpinChat,
    isPinned,
    deleteChat,
    getChatStats,
    setCurrentUserId
  } = useChatStore();

  // Scope store to current user
  useEffect(() => {
    if (user?.id) {
      setCurrentUserId(user.id);
    }
  }, [user?.id, setCurrentUserId]);

  // Get conversations from store
  const allConversations = getConversations();
  const loading = false; // No loading state needed for local store
  const error = null; // No error state needed for local store

  // Filtering logic
  const filteredChats = React.useMemo(() => {
    let chats = searchTerm ? searchChats(searchTerm) : allConversations;
    
    if (selectedFilter !== 'all') {
      chats = chats.filter(chat => chat.conversation_type === selectedFilter);
    }
    
    return chats;
  }, [allConversations, searchTerm, selectedFilter, searchChats]);

  const pinnedChats = filteredChats.filter(chat => isPinned(chat.id));
  const regularChats = filteredChats.filter(chat => !isPinned(chat.id));

  const handleChatClick = (chat) => {
    navigate('/dashboard', { state: { chatId: chat.id, chatTitle: chat.title, messages: chat.messages } });
  };

  const handleNewChat = () => {
    navigate('/dashboard');
  };

  const handleDeleteChat = (chatId, chatTitle, event) => {
    event.stopPropagation(); // Prevent navigation when clicking delete
    if (window.confirm(t('chatHistoryPage.deleteConfirm', { title: chatTitle }))) {
      deleteChat(chatId);
    }
  };

  const ChatCard = ({ chat }) => (
    <Card 
      key={chat.id}
      className="p-6 border border-gray-200 rounded-lg hover:border-primary-200 transition-all duration-300 cursor-pointer group relative"
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
                  {chat.title || t('chatHistoryPage.untitled')}
                </h3>
                {isPinned(chat.id) && (
                  <Pin className="w-3 h-3 text-blue-500 fill-current" />
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>{t('chatHistoryPage.messages', { count: chat.messages?.length || 0 })}</span>
                <span>•</span>
                <span>{chat.updated_at ? formatTimestamp(new Date(chat.updated_at)) : formatTimestamp(new Date(chat.created_at))}</span>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
            {chat.summary || (chat.messages && chat.messages.length > 0 ? chat.messages[chat.messages.length-1]?.content : '')}
          </p>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              isPinned(chat.id) ? unpinChat(chat.id) : pinChat(chat.id);
            }}
            title={isPinned(chat.id) ? t('chatHistoryPage.tooltips.unpin') : t('chatHistoryPage.tooltips.pin')}
          >
            <Pin className={`w-4 h-4 ${isPinned(chat.id) ? 'text-blue-500 fill-current' : 'text-gray-400'}`} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => handleDeleteChat(chat.id, chat.title || t('chatHistoryPage.untitled'), e)}
            title={t('chatHistoryPage.tooltips.delete')}
            className="text-gray-400 hover:text-red-500"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const diffInHours = (now - timestamp) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return t('chatHistoryPage.timestamps.justNow');
    } else if (diffInHours < 24) {
      return t('chatHistoryPage.timestamps.hoursAgo', { count: Math.floor(diffInHours) });
    } else if (diffInHours < 48) {
      return t('chatHistoryPage.timestamps.yesterday');
    } else if (diffInHours < 168) { // 1 week
      return t('chatHistoryPage.timestamps.daysAgo', { count: Math.floor(diffInHours / 24) });
    } else {
      return timestamp.toLocaleDateString(i18n.language || 'en', {
        month: 'short',
        day: 'numeric',
        year: timestamp.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('chatHistoryPage.title')}</h1>
          <p className="text-gray-600 mt-1">{t('chatHistoryPage.subtitle')}</p>
        </div>
        <Button onClick={handleNewChat} className="bg-primary hover:bg-primary-600">
          <Plus className="w-4 h-4 mr-2" />
          {t('chatHistoryPage.newChat')}
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder={t('chatHistoryPage.searchPlaceholder')}
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
            <option value="all">{t('chatHistoryPage.filters.all')}</option>
            {/* Optionally, dynamically generate filter options from conversation_type values */}
            <option value="job_posting">{t('chatHistoryPage.filters.job_posting')}</option>
            <option value="screening">{t('chatHistoryPage.filters.screening')}</option>
            <option value="interviews">{t('chatHistoryPage.filters.interviews')}</option>
            <option value="compensation">{t('chatHistoryPage.filters.compensation')}</option>
            <option value="strategy">{t('chatHistoryPage.filters.strategy')}</option>
            <option value="candidate_analysis">{t('chatHistoryPage.filters.candidate_analysis')}</option>
          </select>
        </div>
      </div>

      {/* Loading/Error UI */}
      {loading && <Card className="p-8 text-center">{t('chatHistoryPage.loading')}</Card>}
      {error && <Card className="p-8 text-center text-red-500">{t('chatHistoryPage.error')}</Card>}

      {/* Pinned Chats */}
      {pinnedChats.length > 0 && !loading && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Pin className="w-4 h-4" />
            {t('chatHistoryPage.pinned')}
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
          {pinnedChats.length > 0 ? t('chatHistoryPage.recent') : t('chatHistoryPage.filters.all')}
        </h2>
        {regularChats.length === 0 && !loading ? (
          <Card className="p-8 text-center">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('chatHistoryPage.emptyState.title')}</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedFilter !== 'all' 
                ? t('chatHistoryPage.emptyState.messageFilter')
                : t('chatHistoryPage.emptyState.messageDefault')
              }
            </p>
            {!searchTerm && selectedFilter === 'all' && (
              <Button onClick={handleNewChat} className="bg-primary hover:bg-primary-600">
                <Plus className="w-4 h-4 mr-2" />
                {t('chatHistoryPage.emptyState.button')}
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

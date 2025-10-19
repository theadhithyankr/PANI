import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, MessageCircle, Phone, Video, Loader2, CheckCircle2 } from 'lucide-react';
import Button from './Button';
import Input from './Input';
import Badge from './Badge';
import InitialsAvatar from './InitialsAvatar';

const MessagesView = ({
  user,
  loading,
  conversations,
  currentConversation,
  getConversation,
  getUserConversations,
  sendMessage,
  markMessagesAsRead,
  onBack,
  leftHeaderExtras,
  rightHeaderActions,
  getListTitle,
  getHeaderTitle,
  getSubtitle,
  getParticipantName,
  getParticipantAvatar,
  getStatusBadge,
  getLastMessagePreview,
  getLastMessageTime,
  getUnreadCount,
}) => {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);

  const userId = useMemo(() => user?.id, [user?.id]);

  useEffect(() => {
    if (userId) getUserConversations();
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (selectedConversation && currentConversation) {
      markMessagesAsRead(selectedConversation);
    }
  }, [selectedConversation, currentConversation, markMessagesAsRead]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentConversation?.messages]);

  const filteredConversations = conversations.filter(conv => {
    if (!searchTerm) return true;
    return (
      (getListTitle?.(conv) || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (getLastMessagePreview?.(conv) || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (getSubtitle?.(conv) || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || !selectedConversation || isSending) return;
    setIsSending(true);
    try {
      const success = await sendMessage(selectedConversation, message);
      if (success) setMessage('');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="h-screen flex bg-gray-50">
      <div className="w-1/3 border-r border-gray-200 bg-white">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {onBack && (
                <Button variant="outline" size="sm" onClick={onBack}>Back</Button>
              )}
              {leftHeaderExtras}
            </div>
            <h1 className="text-lg font-semibold">Messages</h1>
            <div className="text-xs text-gray-500">{conversations.length} convos</div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input placeholder="Search conversations..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
        </div>

        <div className="overflow-y-auto h-full">
          {loading && conversations.length === 0 ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center">
              <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No conversations</p>
            </div>
          ) : (
            filteredConversations.map((conversation) => {
              const isSelected = selectedConversation === conversation.id;
              const unreadCount = typeof getUnreadCount === 'function' ? getUnreadCount(conversation) : (conversation.__unreadCount ?? 0);
              return (
                <div
                  key={conversation.id}
                  onClick={() => { setSelectedConversation(conversation.id); getConversation(conversation.id); }}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}
                >
                  <div className="flex items-start space-x-3">
                    <InitialsAvatar name={getParticipantName?.(conversation) || 'User'} size="md" src={getParticipantAvatar?.(conversation)} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate">{getListTitle?.(conversation) || getHeaderTitle?.(conversation)}</p>
                        <div className="flex items-center gap-2">
                          {unreadCount > 0 && (
                            <Badge variant="error" size="sm">{unreadCount}</Badge>
                          )}
                          <span className="text-xs text-gray-500">{getLastMessageTime?.(conversation)}</span>
                        </div>
                      </div>
                      {getSubtitle && (
                        <p className="text-xs text-gray-500 truncate mt-1">{getSubtitle(conversation)}</p>
                      )}
                      <p className="text-sm text-gray-600 truncate mt-1">{getLastMessagePreview?.(conversation)}</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-white">
        {!selectedConversation || !currentConversation ? (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">{selectedConversation ? 'Loading conversation...' : 'Select a conversation'}</h3>
              {selectedConversation && (
                <p className="text-sm text-gray-400 mt-2">Conversation ID: {selectedConversation}</p>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <InitialsAvatar name={getParticipantName?.(currentConversation) || 'User'} size="md" src={getParticipantAvatar?.(currentConversation)} />
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{getHeaderTitle?.(currentConversation) || getParticipantName?.(currentConversation)}</h2>
                    {getSubtitle && (
                      <p className="text-sm text-gray-500">{getSubtitle(currentConversation)}</p>
                    )}
                    {getStatusBadge && (
                      <div className="flex items-center gap-2 mt-1">{getStatusBadge(currentConversation)}</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {rightHeaderActions || (
                    <>
                      <Button variant="outline" size="sm"><Phone className="w-4 h-4" /></Button>
                      <Button variant="outline" size="sm"><Video className="w-4 h-4" /></Button>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {(currentConversation.messages || []).length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No messages yet. Start the conversation!</p>
                </div>
              ) : (
                (currentConversation.messages || []).map((msg, index, arr) => {
                  const isOwn = msg.sender_id === user?.id;
                  const showDate = index === 0 || formatDate(msg.timestamp) !== formatDate(arr[index - 1].timestamp);
                  return (
                    <div key={msg.id}>
                      {showDate && (
                        <div className="text-center my-4">
                          <span className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">{formatDate(msg.timestamp)}</span>
                        </div>
                      )}
                      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${isOwn ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'}`}>
                          <p className="text-sm">{msg.message}</p>
                          <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                            <span className={`text-xs ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>{formatTime(msg.timestamp)}</span>
                            {isOwn && msg.read && (<CheckCircle2 className="w-3 h-3 text-blue-100" />)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-gray-200 bg-white">
              <form onSubmit={handleSendMessage} className="flex items-end space-x-2">
                <div className="flex-1">
                  <Input placeholder="Type your message..." value={message} onChange={(e) => setMessage(e.target.value)} disabled={isSending} className="resize-none" />
                </div>
                <Button type="submit" disabled={!message.trim() || isSending} className="flex items-center gap-2">
                  {isSending ? (<Loader2 className="w-4 h-4 animate-spin" />) : 'Send'}
                </Button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MessagesView;



import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import MessagesView from '../../components/common/MessagesView';
import { useConversations } from '../../hooks/common/useConversations';
import { useAuth } from '../../hooks/common/useAuth';
import { supabase } from '../../clients/supabaseClient';

const MessagesPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { conversationId } = useParams();
  const { user } = useAuth();
  const [lastMessageByConversation, setLastMessageByConversation] = useState({});

  const {
    loading,
    conversations,
    currentConversation,
    getConversation,
    getUserConversations,
    sendMessage,
    markMessagesAsRead,
    refreshConversations
  } = useConversations();

  // Get application context from navigation state
  const applicationContext = location.state;

  // Memoize user ID to prevent unnecessary re-renders
  const userId = useMemo(() => user?.id, [user?.id]);

  // Load conversations on mount - only when user ID changes
  useEffect(() => {
    if (userId) {
      getUserConversations();
    }
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch a lightweight last-message preview for each conversation for the sidebar
  useEffect(() => {
    const fetchLastMessages = async () => {
      if (!userId) return;
      if (!conversations || conversations.length === 0) return;
      const results = {};
      await Promise.all(
        conversations.map(async (conv) => {
          try {
            const { data, error } = await supabase
              .from('messages_v3')
              .select('messages')
              .eq('conversation_id', conv.id)
              .maybeSingle();
            if (error) return; // ignore not-found style errors
            const msgs = Array.isArray(data?.messages) ? data.messages : [];
            if (msgs.length === 0) return;
            const unreadCount = msgs.filter(m => m.sender_id !== userId && !m.read_at).length;
            const last = msgs.reduce((latest, m) => (
              new Date(m.created_at) > new Date(latest.created_at) ? m : latest
            ), msgs[0]);
            results[conv.id] = {
              id: last.id,
              sender_id: last.sender_id,
              message: last.content,
              timestamp: last.created_at,
              read: !!last.read_at,
              unreadCount
            };
          } catch (e) {
            // ignore per-conversation errors
          }
        })
      );
      setLastMessageByConversation(results);
    };
    fetchLastMessages();
  }, [conversations, userId]);

  // Load specific conversation if conversationId is provided
  useEffect(() => {
    if (conversationId && userId) {
      getConversation(conversationId);
      setSelectedConversation(conversationId);
    }
  }, [conversationId, userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const getUnreadCount = (conversation) => {
    const preview = lastMessageByConversation[conversation.id];
    if (preview && typeof preview.unreadCount === 'number') {
      return preview.unreadCount;
    }
    if (!conversation.messages || !user?.id) return 0;
    return conversation.messages.filter(msg => 
      msg.sender_id !== user.id && !msg.read
    ).length;
  };

  const getLastMessage = (conversation) => {
    const preview = lastMessageByConversation[conversation.id];
    const hasListMessages = conversation.messages && conversation.messages.length > 0;
    if (!preview && !hasListMessages) {
      return 'No messages yet';
    }
    const lastMsg = preview || conversation.messages[conversation.messages.length - 1];
    const isOwn = lastMsg.sender_id === user?.id;
    const prefix = isOwn ? 'You: ' : '';
    
    return `${prefix}${lastMsg.message.substring(0, 50)}${lastMsg.message.length > 50 ? '...' : ''}`;
  };

  const getLastMessageTime = (conversation) => {
    const preview = lastMessageByConversation[conversation.id];
    const ts = preview?.timestamp || conversation.last_message_at || conversation.updated_at;
    return ts ? new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : '';
  };

  if (!user) return null;

  const getListTitle = (conv) => conv.title;
  const getHeaderTitle = (conv) => conv.title;
  const getSubtitle = (conv) => conv.jobs?.title || '';
  const getParticipantName = (conv) => conv.jobs?.companies?.name || 'Company';
  const getParticipantAvatar = () => undefined;
  const getStatusBadge = (conv) => null;
  const getLastMessagePreview = (conv) => getLastMessage(conv);

  return (
    <MessagesView
      user={user}
      loading={loading}
      conversations={conversations}
      currentConversation={currentConversation}
      getConversation={getConversation}
      getUserConversations={getUserConversations}
      sendMessage={sendMessage}
      markMessagesAsRead={markMessagesAsRead}
      onBack={() => navigate(-1)}
      getListTitle={getListTitle}
      getHeaderTitle={getHeaderTitle}
      getSubtitle={getSubtitle}
      getParticipantName={getParticipantName}
      getParticipantAvatar={getParticipantAvatar}
      getStatusBadge={getStatusBadge}
      getLastMessagePreview={getLastMessagePreview}
      getLastMessageTime={getLastMessageTime}
      getUnreadCount={getUnreadCount}
    />
  );
};

export default MessagesPage;
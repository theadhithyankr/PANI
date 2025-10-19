import { useState, useCallback, useMemo, useEffect } from 'react';
import { supabase } from '../../clients/supabaseClient';
import { useToast } from './useToast';
import { useAuth } from './useAuth';

export const useConversationsOptimized = () => {
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [hasFetchedConversations, setHasFetchedConversations] = useState(false);
  const { error: showError } = useToast();
  const { user } = useAuth();

  const userId = useMemo(() => user?.id, [user?.id]);
  
  // Reset cache when user changes
  useEffect(() => {
    setConversations([]);
    setCurrentConversation(null);
    setHasFetchedConversations(false);
  }, [userId]);

  // Fetch conversations using the optimized view
  const fetchConversations = useCallback(async () => {
    if (!userId || hasFetchedConversations) {
      return conversations;
    }

    try {
      setLoading(true);

      // Use the optimized view for better performance
      const { data: userConversations, error } = await supabase
        .from('conversation_participants')
        .select(`
          conversation_id,
          conversations_v2!inner(
            id,
            title,
            application_id,
            created_at,
            updated_at,
            last_message_at,
            job_applications_v2!application_id(
              status,
              jobs!job_id(
                title,
                companies!company_id(
                  name
                )
              ),
              applicant:applicant_id(
                full_name,
                avatar_url
              )
            )
          )
        `)
        .eq('user_id', userId)
        .order('updated_at', { ascending: false, foreignTable: 'conversations_v2' });

      if (error) throw error;

      const conversationsList = userConversations
        .map(item => {
          const conversation = item.conversations_v2;
          if (!conversation) return null;
          
          const jobApplication = conversation.job_applications_v2?.[0];
          const job = jobApplication?.jobs;
          const company = job?.companies;
          const applicant = jobApplication?.applicant;
          
          return {
            ...conversation,
            job_id: job?.id,
            job_title: job?.title,
            company_name: company?.name,
            application_status: jobApplication?.status,
            candidate_name: applicant?.full_name,
            candidate_avatar: applicant?.avatar_url,
            messages: [] // Will be loaded separately
          };
        })
        .filter(Boolean);

      setConversations(conversationsList);
      setHasFetchedConversations(true);
      return conversationsList;

    } catch (err) {
      console.error('Error fetching conversations:', err);
      showError('Failed to load conversations.');
      return [];
    } finally {
      setLoading(false);
    }
  }, [userId, showError, hasFetchedConversations, conversations]);

  // Fetch messages for a conversation with pagination
  const fetchMessages = useCallback(async (conversationId, limit = 50, offset = 0) => {
    if (!conversationId) return [];

    try {
      const { data: messagesData, error } = await supabase
        .from('messages_v3')
        .select('messages')
        .eq('conversation_id', conversationId)
        .single();

      if (error) throw error;

      const messages = messagesData?.messages || [];
      
      // Apply pagination to the messages array
      const paginatedMessages = messages
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(offset, offset + limit);

      return paginatedMessages;

    } catch (err) {
      console.error('Error fetching messages:', err);
      return [];
    }
  }, []);

  // Send a message
  const sendMessage = useCallback(async (conversationId, messageText, messageType = 'text', attachmentUrls = []) => {
    if (!userId || !conversationId || !messageText.trim()) {
      return false;
    }

    try {
      setLoading(true);

      // Use the add_message_to_conversation function for messages_v3
      const { data: updatedMessages, error: messageError } = await supabase
        .rpc('add_message_to_conversation', {
          p_conversation_id: conversationId,
          p_sender_id: userId,
          p_content: messageText.trim(),
          p_message_type: messageType,
          p_attachment_urls: attachmentUrls.length > 0 ? attachmentUrls : null
        });

      if (messageError) throw messageError;

      // Update conversation's last_message_at timestamp
      const { error: updateError } = await supabase
        .from('conversations_v2')
        .update({
          last_message_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId);

      if (updateError) throw updateError;

      // Transform the updated messages to match expected format
      const transformedMessages = (updatedMessages || []).map(msg => ({
        id: msg.id,
        sender_id: msg.sender_id,
        content: msg.content,
        message_type: msg.message_type,
        attachment_urls: msg.attachment_urls,
        read_at: msg.read_at,
        created_at: msg.created_at,
        profiles: null // Will be populated separately if needed
      }));

      // Update local state
      setCurrentConversation(prev => {
        if (prev && prev.id === conversationId) {
          return {
            ...prev,
            messages: transformedMessages,
            updated_at: new Date().toISOString(),
            last_message_at: new Date().toISOString()
          };
        }
        return prev;
      });

      // Update conversations list
      setConversations(prev => prev.map(conv => 
        conv.id === conversationId 
          ? { 
              ...conv, 
              messages: transformedMessages, 
              updated_at: new Date().toISOString(),
              last_message_at: new Date().toISOString()
            }
          : conv
      ));

      return true;

    } catch (err) {
      console.error('Error sending message:', err);
      showError('Failed to send message.');
      return false;
    } finally {
      setLoading(false);
    }
  }, [userId, showError]);

  // Mark messages as read
  const markMessagesAsRead = useCallback(async (conversationId) => {
    if (!userId || !conversationId) return false;

    try {
      // Use the mark_messages_as_read function for messages_v3
      const { error } = await supabase.rpc('mark_messages_as_read', {
        p_conversation_id: conversationId,
        p_user_id: userId
      });

      if (error) throw error;

      // Update local state
      setCurrentConversation(prev => {
        if (prev && prev.id === conversationId) {
          return {
            ...prev,
            messages: (prev.messages || []).map(msg => 
              msg.sender_id !== userId ? { ...msg, read_at: new Date().toISOString() } : msg
            )
          };
        }
        return prev;
      });

      return true;

    } catch (err) {
      console.error('Error marking messages as read:', err);
      return false;
    }
  }, [userId]);

  // Get or create conversation
  const getOrCreateConversation = useCallback(async (applicationId, title) => {
    if (!userId || !applicationId) return null;

    try {
      // Check if conversation already exists
      const { data: existingConversations, error: searchError } = await supabase
        .from('conversation_participants')
        .select(`
          conversation_id,
          conversations_v2!inner(
            id,
            title,
            application_id
          )
        `)
        .eq('user_id', userId)
        .eq('conversations_v2.application_id', applicationId)
        .limit(1);

      if (searchError) throw searchError;

      if (existingConversations && existingConversations.length > 0) {
        const conversation = existingConversations[0].conversations_v2;
        return await getConversation(conversation.id);
      }

      // Create new conversation
      return await createConversation(applicationId, title);

    } catch (err) {
      console.error('Error getting or creating conversation:', err);
      return null;
    }
  }, [userId]);

  // Create new conversation
  const createConversation = useCallback(async (applicationId, title) => {
    if (!userId || !applicationId) return null;

    try {
      setLoading(true);

      // Create conversation
      const { data: newConversation, error: createError } = await supabase
        .from('conversations_v2')
        .insert({
          title: title || 'New Conversation',
          application_id: applicationId,
          last_message_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) throw createError;

      // Add current user as participant
      const { error: participantError } = await supabase
        .from('conversation_participants')
        .insert({
          conversation_id: newConversation.id,
          user_id: userId
        });

      if (participantError) throw participantError;

      // Refresh conversations
      await fetchConversations();

      return newConversation;

    } catch (err) {
      console.error('Error creating conversation:', err);
      showError('Failed to create conversation.');
      return null;
    } finally {
      setLoading(false);
    }
  }, [userId, showError, fetchConversations]);

  // Get specific conversation
  const getConversation = useCallback(async (conversationId) => {
    if (!conversationId) return null;

    try {
      const { data: conversation, error } = await supabase
        .from('conversations_v2')
        .select(`
          id,
          title,
          application_id,
          created_at,
          updated_at,
          last_message_at,
          job_applications_v2!application_id(
            status,
            jobs!job_id(
              title,
              companies!company_id(
                name
              )
            ),
            applicant:applicant_id(
              full_name,
              avatar_url
            )
          )
        `)
        .eq('id', conversationId)
        .single();

      if (error) throw error;

      // Transform conversation data
      const jobApplication = conversation.job_applications_v2?.[0];
      const job = jobApplication?.jobs;
      const company = job?.companies;
      const applicant = jobApplication?.applicant;

      const transformedConversation = {
        ...conversation,
        job_id: job?.id,
        job_title: job?.title,
        company_name: company?.name,
        application_status: jobApplication?.status,
        candidate_name: applicant?.full_name,
        candidate_avatar: applicant?.avatar_url,
        messages: []
      };

      // Fetch messages
      const messages = await fetchMessages(conversationId);
      transformedConversation.messages = messages;

      return transformedConversation;

    } catch (err) {
      console.error('Error fetching conversation:', err);
      return null;
    }
  }, [fetchMessages]);

  // Set current conversation with messages
  const setCurrentConversationWithMessages = useCallback(async (conversation) => {
    setCurrentConversation(conversation);
    
    if (conversation?.id) {
      const messages = await fetchMessages(conversation.id);
      setCurrentConversation(prev => ({
        ...prev,
        messages: messages
      }));
    }
  }, [fetchMessages]);

  // Refresh conversations
  const refreshConversations = useCallback(async () => {
    setHasFetchedConversations(false);
    return await fetchConversations();
  }, [fetchConversations]);

  // Alias for backward compatibility
  const getUserConversations = useCallback(async () => {
    return await fetchConversations();
  }, [fetchConversations]);

  return {
    loading,
    conversations,
    currentConversation,
    hasFetchedConversations,
    fetchConversations,
    getUserConversations,
    getConversation,
    getOrCreateConversation,
    sendMessage,
    fetchMessages,
    setCurrentConversation: setCurrentConversationWithMessages,
    createConversation,
    markMessagesAsRead,
    refreshConversations
  };
};

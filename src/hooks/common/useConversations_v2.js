import { useState, useCallback, useMemo, useEffect } from 'react';
import { supabase } from '../../clients/supabaseClient';
import { useToast } from './useToast';
import { useAuth } from './useAuth';

export const useConversations = () => {
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [hasFetchedConversations, setHasFetchedConversations] = useState(false);
  const { error: showError } = useToast();
  const { user } = useAuth();

  // Memoize user ID to prevent unnecessary re-renders
  const userId = useMemo(() => user?.id, [user?.id]);
  
  // Reset cache when user changes
  useEffect(() => {
    setConversations([]);
    setCurrentConversation(null);
    setHasFetchedConversations(false);
  }, [userId]);

  

  // Fetch conversations for the current user
  const fetchConversations = useCallback(async () => {
    if (!userId || hasFetchedConversations) {
      return conversations;
    }

    try {
      setLoading(true);

      // Get conversations with participant info using new schema
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
        .order('last_message_at', { ascending: false, foreignTable: 'conversations_v2', nullsFirst: false })
        .order('updated_at', { ascending: false, foreignTable: 'conversations_v2', nullsFirst: false });

      if (error) throw error;

      const conversationsList = userConversations
        .map(item => {
          const conversation = item.conversations_v2;
          if (!conversation) return null;
          
          // Transform the conversation data to match expected format
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
            employer_name: null, // Will be populated separately if needed
            employer_avatar: null,
            candidate_name: applicant?.full_name,
            candidate_avatar: applicant?.avatar_url,
            messages: [] // Messages are stored separately in the messages table
          };
        })
        .filter(Boolean);

      setConversations(conversationsList);
      setHasFetchedConversations(true);
      return conversationsList;

    } catch (err) {
      console.error('Error fetching user conversations:', err);
      showError('Failed to load conversations.');
      return [];
    } finally {
      setLoading(false);
    }
  }, [userId, showError, hasFetchedConversations, conversations]);

  // Send a message
  const sendMessage = useCallback(async (conversationId, messageText, messageType = 'text') => {
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
          p_message_type: messageType
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

      // Transform the updated messages to match MessagesPage expectations
      const transformedMessages = (updatedMessages || []).map(msg => ({
        id: msg.id,
        sender_id: msg.sender_id,
        message: msg.content,
        timestamp: msg.created_at,
        message_type: msg.message_type,
        read: !!msg.read_at,
        read_at: msg.read_at,
        profiles: null // Will be populated when conversation is refreshed
      }));

      // Update local conversation data
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

  // Fetch messages for a conversation
  const fetchMessages = useCallback(async (conversationId) => {
    if (!conversationId) return [];

    try {
      const { data: messagesData, error } = await supabase
        .from('messages_v3')
        .select('messages')
        .eq('conversation_id', conversationId)
        .maybeSingle();

      if (error) throw error;

      const messages = messagesData?.messages || [];

      // Transform messages to match MessagesPage expectations
      const transformedMessages = messages.map(msg => ({
        id: msg.id,
        sender_id: msg.sender_id,
        message: msg.content, // Transform content to message
        timestamp: msg.created_at, // Transform created_at to timestamp
        message_type: msg.message_type,
        read: !!msg.read_at, // Transform read_at to boolean read
        read_at: msg.read_at,
        profiles: null // Will be populated separately if needed
      }));

      return transformedMessages;

    } catch (err) {
      console.error('Error fetching messages:', err);
      return [];
    }
  }, []);

  // Realtime: subscribe to messages updates to reflect incoming messages instantly
  useEffect(() => {
    if (!userId) return;

    const channel = supabase.channel('realtime-messages-v3')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages_v3' }, async (payload) => {
        try {
          const updated = payload.new;
          const conversationId = updated?.conversation_id;
          if (!conversationId) return;

          // Only react if this conversation is relevant to the user (present in list or currently open)
          const isKnownConversation =
            conversations.some((c) => c.id === conversationId) || currentConversation?.id === conversationId;
          if (!isKnownConversation) return;

          // Transform messages from payload for quick UI update
          const rawMessages = Array.isArray(updated?.messages) ? updated.messages : [];
          const transformedMessages = rawMessages.map((msg) => ({
            id: msg.id,
            sender_id: msg.sender_id,
            message: msg.content,
            timestamp: msg.created_at,
            message_type: msg.message_type,
            read: !!msg.read_at,
            read_at: msg.read_at,
            profiles: null
          }));

          // Update current conversation if it matches
          setCurrentConversation((prev) => {
            if (prev?.id !== conversationId) return prev;
            return {
              ...prev,
              messages: transformedMessages,
              updated_at: updated?.updated_at || new Date().toISOString(),
              last_message_at: updated?.last_message_at || new Date().toISOString()
            };
          });

          // Update the conversations list preview and timestamps
          setConversations((prev) =>
            prev.map((conv) =>
              conv.id === conversationId
                ? {
                    ...conv,
                    messages: transformedMessages,
                    updated_at: updated?.updated_at || new Date().toISOString(),
                    last_message_at: updated?.last_message_at || new Date().toISOString()
                  }
                : conv
            )
          );
        } catch (err) {
          console.error('Realtime messages_v3 update handling error:', err);
        }
      })
      // Optional: if new conversations are created and messages row inserted for them
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages_v3' }, async (payload) => {
        try {
          const inserted = payload.new;
          const conversationId = inserted?.conversation_id;
          if (!conversationId) return;
          // If this conversation is already known, refresh its messages; if not, ignore here.
          if (conversations.some((c) => c.id === conversationId) || currentConversation?.id === conversationId) {
            // Fetch messages to ensure consistency
            const msgs = await fetchMessages(conversationId);
            setCurrentConversation((prev) => (prev?.id === conversationId ? { ...prev, messages: msgs } : prev));
            setConversations((prev) => prev.map((c) => (c.id === conversationId ? { ...c, messages: msgs } : c)));
          }
        } catch (err) {
          console.error('Realtime messages_v3 insert handling error:', err);
        }
      })
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch (_) {
        // noop
      }
    };
  }, [userId, conversations, currentConversation, fetchMessages]);

  // Set current conversation and fetch its messages
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

  // Create a new conversation
  const createConversation = useCallback(async (applicationId, title) => {
    if (!userId || !applicationId) return null;

    try {
      setLoading(true);

      // First, get the employer ID from the job application
      const { data: application, error: appError } = await supabase
        .from('job_applications_v2')
        .select(`
          id,
          jobs!job_id(
            employer_id
          )
        `)
        .eq('id', applicationId)
        .single();

      if (appError) throw appError;

      const employerId = application?.jobs?.employer_id;
      if (!employerId) {
        throw new Error('Could not find employer for this application');
      }

      // Create new conversation
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

      // Add both current user and employer as participants
      const { error: participantError } = await supabase
        .from('conversation_participants')
        .insert([
          {
            conversation_id: newConversation.id,
            user_id: userId
          },
          {
            conversation_id: newConversation.id,
            user_id: employerId
          }
        ]);

      if (participantError) throw participantError;

      // Refresh conversations list
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

  // Mark messages as read
  const markMessagesAsRead = useCallback(async (conversationId) => {
    if (!userId || !conversationId) return false;

    try {
      // Use the mark_messages_as_read function for messages_v3
      const { error } = await supabase
        .rpc('mark_messages_as_read', {
          p_conversation_id: conversationId,
          p_user_id: userId
        });

      if (error) throw error;

      return true;

    } catch (err) {
      console.error('Error marking messages as read:', err);
      return false;
    }
  }, [userId]);

  // Get a specific conversation by ID
  const getConversation = useCallback(async (conversationId) => {
    console.log('getConversation called with ID:', conversationId);
    if (!conversationId) return null;

    try {
      // First, let's check if the conversation exists at all
      const { data: simpleCheck, error: checkError } = await supabase
        .from('conversations_v2')
        .select('id, title')
        .eq('id', conversationId)
        .single();

      console.log('Simple conversation check:', simpleCheck, 'error:', checkError);

      if (checkError) {
        console.error('Conversation not found or error:', checkError);
        throw checkError;
      }

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
            applicant:profiles!job_applications_v2_applicant_id_fkey(
              full_name,
              avatar_url
            )
          )
        `)
        .eq('id', conversationId)
        .single();

      if (error) throw error;

      console.log('Raw conversation data:', conversation);

      // Transform the conversation data
      const jobApplication = conversation.job_applications_v2?.[0];
      const job = jobApplication?.jobs;
      const company = job?.companies;
      const applicant = jobApplication?.applicant;

      console.log('Transformed data - jobApplication:', jobApplication, 'job:', job, 'applicant:', applicant);
      console.log('jobApplication structure:', {
        status: jobApplication?.status,
        jobs: jobApplication?.jobs,
        applicant: jobApplication?.applicant
      });

      const transformedConversation = {
        ...conversation,
        // Structure expected by MessagesPage
        candidate: {
          full_name: applicant?.full_name,
          avatar_url: applicant?.avatar_url
        },
        jobs: {
          id: job?.id,
          title: job?.title,
          companies: {
            name: company?.name
          }
        },
        job_applications: {
          status: jobApplication?.status,
          applicant: {
            full_name: applicant?.full_name,
            avatar_url: applicant?.avatar_url
          }
        },
        // Legacy fields for backward compatibility
        job_id: job?.id,
        job_title: job?.title,
        company_name: company?.name,
        application_status: jobApplication?.status,
        employer_name: null,
        employer_avatar: null,
        candidate_name: applicant?.full_name,
        candidate_avatar: applicant?.avatar_url,
        messages: []
      };

      // Fetch messages for this conversation
      const messages = await fetchMessages(conversationId);
      transformedConversation.messages = messages;

      // Update the current conversation state
      setCurrentConversation(transformedConversation);

      return transformedConversation;

    } catch (err) {
      console.error('Error fetching conversation:', err);
      return null;
    }
  }, [fetchMessages]);

  // Get user conversations (alias for fetchConversations)
  const getUserConversations = useCallback(async () => {
    return await fetchConversations();
  }, [fetchConversations]);

  // Refresh conversations (alias for fetchConversations)
  const refreshConversations = useCallback(async () => {
    setHasFetchedConversations(false);
    return await fetchConversations();
  }, [fetchConversations]);

  // Get or create a conversation for an application
  const getOrCreateConversation = useCallback(async (applicationId, title) => {
    if (!userId || !applicationId) return null;

    try {
      // First, try to find existing conversation
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

      // If no existing conversation, create a new one
      return await createConversation(applicationId, title);

    } catch (err) {
      console.error('Error getting or creating conversation:', err);
      return null;
    }
  }, [userId, getConversation, createConversation]);

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

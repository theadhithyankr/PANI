import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import MessagesView from '../../components/common/MessagesView';
import { useConversations } from '../../hooks/common/useConversations';
import { useAuth } from '../../hooks/common/useAuth';
import { supabase } from '../../clients/supabaseClient';

const EmployerMessagesPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { conversationId: urlConversationId } = useParams();
  const { user } = useAuth();
  // Get conversation ID from either URL parameter or query parameter
  const searchParams = new URLSearchParams(location.search);
  const queryConversationId = searchParams.get('conversation');
  const conversationId = urlConversationId || queryConversationId;
  
  // Get candidate data from navigation state
  const passedCandidateData = location.state?.candidate;
  const passedJobData = location.state?.job;
  
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

  // Memoize user ID to prevent unnecessary re-renders
  const userId = useMemo(() => user?.id, [user?.id]);

  // Load conversations on mount - only when user ID changes
  useEffect(() => {
    if (userId) {
      getUserConversations();
    }
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load specific conversation if conversationId is provided
  useEffect(() => {
    if (conversationId && userId) {
      getConversation(conversationId);
    }
  }, [conversationId, userId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch a lightweight last-message preview for each conversation for the sidebar
  useEffect(() => {
    const fetchLastMessages = async () => {
      try {
        const results = await Promise.all(
          conversations.map(async (conv) => {
            try {
              const { data, error } = await supabase
                .from('messages_v3')
                .select('messages, last_message_at')
                .eq('conversation_id', conv.id)
                .maybeSingle();
              if (error) {
                // Ignore not-found style errors; just return no preview
                return [conv.id, null];
              }
              const msgs = Array.isArray(data?.messages) ? data.messages : [];
              if (msgs.length === 0) return [conv.id, null];
              // pick the latest by created_at
              const last = msgs.reduce((a, b) => (new Date(a.created_at) > new Date(b.created_at) ? a : b));
              return [conv.id, {
                id: last.id,
                sender_id: last.sender_id,
                message: last.content,
                timestamp: last.created_at,
                message_type: last.message_type,
                read: !!last.read_at,
                read_at: last.read_at
              }];
            } catch (_) {
              return [conv.id, null];
            }
          })
        );

        const map = {};
        results.forEach(([id, last]) => { map[id] = last; });
        setLastMessageByConversation(map);
      } catch (e) {
        console.error('Failed to fetch last messages previews', e);
      }
    };

    if (conversations.length > 0) {
      fetchLastMessages();
    } else {
      setLastMessageByConversation({});
    }
  }, [conversations]);

  // Mark messages as read when conversation is selected is handled by MessagesView

  const getUnreadCount = (conversation) => {
    const preview = lastMessageByConversation[conversation.id];
    if (preview && typeof preview.unreadCount === 'number') return preview.unreadCount;
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

  // Get candidate name from conversation - for employer view
  const getCandidateName = (conversation) => {
    console.log('Getting candidate name for conversation:', {
      conversation_id: conversation?.id,
      candidate: conversation?.candidate,
      candidate_id: conversation?.candidate_id,
      job_applications: conversation?.job_applications,
      job_applications_v2: conversation?.job_applications_v2,
      candidate_name: conversation?.candidate_name,
      passedCandidateData: passedCandidateData
    });
    
    console.log('job_applications.applicant details:', conversation?.job_applications?.applicant);
    console.log('job_applications_v2.applicant details:', conversation?.job_applications_v2?.applicant);

    // First, try to use the passed candidate data from navigation state
    if (passedCandidateData?.full_name) {
      console.log('Using passed candidate data:', passedCandidateData.full_name);
      return passedCandidateData.full_name;
    }

    // Try different possible locations for candidate name
    if (conversation?.candidate?.full_name) {
      return conversation.candidate.full_name;
    }
    
    if (conversation?.candidate_name) {
      return conversation.candidate_name;
    }
    
    // Check job_applications_v2 structure first (new structure)
    if (conversation?.job_applications_v2?.applicant?.full_name) {
      return conversation.job_applications_v2.applicant.full_name;
    }
    
    // Use job_applications applicant data (legacy structure)
    if (conversation?.job_applications?.applicant?.full_name) {
      return conversation.job_applications.applicant.full_name;
    }
    
    // If we have an application_id, we can fetch the applicant details
    if (conversation?.application_id && !conversation?.job_applications?.applicant && !conversation?.job_applications_v2?.applicant) {
      // This would require an async fetch, but for now we'll use the fallback
      console.log('Application ID found but no applicant data loaded:', conversation.application_id);
    }
    
    // Fallback to extracting from title
    if (conversation?.title) {
      const parts = conversation.title.split(' - ');
      if (parts.length > 1) {
        // Try to extract candidate name from title (format: "Candidate Name - Job Title")
        return parts[0].trim();
      }
      // If title doesn't have the expected format, use the whole title
      return conversation.title;
    }
    
    return 'Candidate';
  };

  // Get candidate avatar from conversation
  const getCandidateAvatar = (conversation) => {
    // First, try to use the passed candidate data from navigation state
    if (passedCandidateData?.avatar_url) {
      return passedCandidateData.avatar_url;
    }
    
    // Try direct candidate link first
    if (conversation?.candidate?.avatar_url) {
      return conversation.candidate.avatar_url;
    }
    
    // Fallback to job application applicant avatar
    if (conversation?.job_applications?.applicant?.avatar_url) {
      return conversation.job_applications.applicant.avatar_url;
    }
    
    return null;
  };

  // Get application status badge variant
  const getStatusVariant = (status) => {
    switch (status?.toLowerCase()) {
      case 'interviewing':
        return 'info';
      case 'hired':
        return 'success';
      case 'rejected':
        return 'error';
      case 'reviewing':
        return 'warning';
      default:
        return 'default';
    }
  };

  if (!user) return null;

  const getListTitle = (conv) => {
    // For employer side, show candidate name, job title, and company for better identification
    const candidateName = getCandidateName(conv);
    const jobTitle = passedJobData?.title || 
                    conv.job_applications_v2?.jobs?.title || 
                    conv.jobs?.title || 
                    conv.job_title;
    const companyName = conv.job_applications_v2?.jobs?.companies?.name || 
                       conv.jobs?.companies?.name || 
                       conv.company_name;
    
    // If we have a valid candidate name (not the fallback 'Candidate'), combine with job and company
    if (candidateName !== 'Candidate' && jobTitle && companyName) {
      return `${candidateName} - ${jobTitle} at ${companyName}`;
    }
    
    // If we have candidate name and job title but no company
    if (candidateName !== 'Candidate' && jobTitle) {
      return `${candidateName} - ${jobTitle}`;
    }
    
    // If we only have candidate name, use it
    if (candidateName !== 'Candidate') {
      return candidateName;
    }
    
    // If conversation has a title and it's not just the job title, use it
    if (conv.title && conv.title !== jobTitle) {
      return conv.title;
    }
    
    // Last resort: use job title or fallback
    return jobTitle || 'Job Application';
  };
  const getHeaderTitle = (conv) => {
    // For header, show candidate name with job title and company for context
    const candidateName = getCandidateName(conv);
    const jobTitle = passedJobData?.title || 
                    conv.job_applications_v2?.jobs?.title || 
                    conv.jobs?.title || 
                    conv.job_title;
    const companyName = conv.job_applications_v2?.jobs?.companies?.name || 
                       conv.jobs?.companies?.name || 
                       conv.company_name;
    
    if (candidateName !== 'Candidate' && jobTitle && companyName) {
      return `${candidateName} - ${jobTitle} at ${companyName}`;
    }
    
    if (candidateName !== 'Candidate' && jobTitle) {
      return `${candidateName} - ${jobTitle}`;
    }
    
    return candidateName;
  };
  const getSubtitle = (conv) => {
    const candidateName = getCandidateName(conv);
    const jobTitle = passedJobData?.title || conv.jobs?.title;
    
    if (candidateName !== 'Candidate' && jobTitle) {
      return `${candidateName} • ${jobTitle}`;
    }
    
    return candidateName !== 'Candidate' ? candidateName : (jobTitle || '');
  };
  const getParticipantName = (conv) => getCandidateName(conv);
  const getParticipantAvatar = (conv) => getCandidateAvatar(conv);
  const getStatusBadge = (conv) => null; // employer-specific header badges can be added if needed
  const getLastMessagePreview = (conv) => getLastMessage(conv);
  const getLastMessageTime = (conv) => (conv.updated_at ? new Date(conv.updated_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : '');

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

export default EmployerMessagesPage;

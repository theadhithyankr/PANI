import { useState, useCallback } from 'react';
import { supabase } from '../../clients/supabaseClient';
import useGlobalStore from '../../stores/globalStore';

export const useInterviewInvitations = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const user = useGlobalStore((state) => state.user);
  const profile = useGlobalStore((state) => state.profile);

  // Send interview invitation to candidate
  const sendInvitation = useCallback(async (invitationData) => {
    try {
      setLoading(true);
      setError(null);

      if (!user?.id || !profile?.company?.id) {
        throw new Error('User or company information is missing');
      }

      const invitation = {
        job_id: invitationData.jobId,
        candidate_id: invitationData.candidateId,
        employer_id: user.id,
        interview_type: invitationData.interviewType || '1st_interview',
        interview_format: invitationData.interviewFormat || 'video',
        proposed_date: invitationData.proposedDate,
        duration_minutes: invitationData.durationMinutes || 60,
        location: invitationData.location,
        message: invitationData.message,
        status: 'pending'
      };

      const { data, error: insertError } = await supabase
        .from('interview_invitations')
        .insert(invitation)
        .select()
        .single();

      if (insertError) throw insertError;

      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.id, profile?.company?.id]);

  // Get invitations sent by employer
  const getSentInvitations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('interview_invitations')
        .select(`
          *,
          job:jobs (
            id,
            title,
            companies (name)
          ),
          candidate:profiles!interview_invitations_candidate_id_fkey (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('employer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Get invitations received by candidate
  const getReceivedInvitations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('interview_invitations')
        .select(`
          *,
          job:jobs (
            id,
            title,
            companies (name, logo_url)
          ),
          employer:profiles!interview_invitations_employer_id_fkey (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('candidate_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Accept invitation (candidate)
  const acceptInvitation = useCallback(async (invitationId) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('interview_invitations')
        .update({ 
          status: 'accepted',
          updated_at: new Date().toISOString()
        })
        .eq('id', invitationId)
        .eq('candidate_id', user.id)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Decline invitation (candidate)
  const declineInvitation = useCallback(async (invitationId) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('interview_invitations')
        .update({ 
          status: 'declined',
          updated_at: new Date().toISOString()
        })
        .eq('id', invitationId)
        .eq('candidate_id', user.id)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Schedule interview from accepted invitation
  const scheduleInterviewFromInvitation = useCallback(async (invitationId, interviewData) => {
    try {
      setLoading(true);
      setError(null);

      // Get the invitation details
      const { data: invitation, error: inviteError } = await supabase
        .from('interview_invitations')
        .select('*')
        .eq('id', invitationId)
        .eq('status', 'accepted')
        .single();

      if (inviteError) throw inviteError;

      // Create the interview - match backend field names
      const interviewRecord = {
        invitation_id: invitationId,
        job_id: invitation.job_id,
        seeker_id: invitation.candidate_id,
        interviewer_id: invitation.employer_id,
        interview_type: interviewData.interviewType || invitation.interview_type,
        interview_format: interviewData.interviewFormat || invitation.interview_format,
        location: interviewData.location || invitation.location,
        interview_date: interviewData.interviewDate || invitation.proposed_date,
        duration_minutes: interviewData.durationMinutes || invitation.duration_minutes,
        meeting_link: interviewData.meetingLink,
        agenda: interviewData.agenda,
        interview_notes: interviewData.notes,
        status: 'scheduled'
      };

      const { data, error } = await supabase
        .from('interviews_v2')
        .insert(interviewRecord)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    sendInvitation,
    getSentInvitations,
    getReceivedInvitations,
    acceptInvitation,
    declineInvitation,
    scheduleInterviewFromInvitation
  };
};

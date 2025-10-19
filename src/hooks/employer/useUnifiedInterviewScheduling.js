import { useState, useCallback } from 'react';
import { supabase } from '../../clients/supabaseClient';
import useGlobalStore from '../../stores/globalStore';
import { useInterviewInvitations } from './useInterviewInvitations';

export const useUnifiedInterviewScheduling = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const user = useGlobalStore((state) => state.user);
  const profile = useGlobalStore((state) => state.profile);
  const { sendInvitation } = useInterviewInvitations();

  // Flow 1: Direct Interview Scheduling (no application needed)
  const scheduleDirectInterview = useCallback(async (interviewData) => {
    try {
      setLoading(true);
      setError(null);

      if (!user?.id || !profile?.company?.id) {
        throw new Error('User or company information is missing');
      }

      const interviewRecord = {
        job_id: interviewData.jobId,
        seeker_id: interviewData.candidateId,
        interviewer_id: user.id,
        interview_type: interviewData.interviewType || '1st_interview',
        interview_format: interviewData.interviewFormat || 'video',
        location: interviewData.location,
        interview_date: interviewData.interviewDate,
        duration_minutes: interviewData.durationMinutes || 60,
        meeting_link: interviewData.meetingLink,
        agenda: interviewData.agenda,
        interview_notes: interviewData.notes,
        additional_interviewers: interviewData.additionalInterviewers || [],
        status: 'scheduled'
      };

      const { data, error } = await supabase
        .from('interviews_v2')
        .insert(interviewRecord)
        .select(`
          *,
          job:jobs (
            id,
            title,
            companies (name)
          ),
          seeker_profile:profiles!interviews_v2_seeker_id_fkey (
            id,
            full_name,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;

      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.id, profile?.company?.id]);

  // Flow 2: Send Interview Invitation (employer invites candidate)
  const sendInterviewInvitation = useCallback(async (invitationData) => {
    try {
      setLoading(true);
      setError(null);

      const invitation = await sendInvitation({
        jobId: invitationData.jobId,
        candidateId: invitationData.candidateId,
        interviewType: invitationData.interviewType || '1st_interview',
        interviewFormat: invitationData.interviewFormat || 'video',
        proposedDate: invitationData.proposedDate,
        durationMinutes: invitationData.durationMinutes || 60,
        location: invitationData.location,
        message: invitationData.message
      });

      return invitation;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [sendInvitation]);

  // Flow 3: Schedule Interview from Application (traditional flow)
  const scheduleInterviewFromApplication = useCallback(async (interviewData) => {
    try {
      setLoading(true);
      setError(null);

      if (!user?.id || !profile?.company?.id) {
        throw new Error('User or company information is missing');
      }

      const interviewRecord = {
        application_id: interviewData.applicationId,
        job_id: interviewData.jobId,
        seeker_id: interviewData.candidateId,
        interviewer_id: user.id,
        interview_type: interviewData.interviewType || '1st_interview',
        interview_format: interviewData.interviewFormat || 'video',
        location: interviewData.location,
        interview_date: interviewData.interviewDate,
        duration_minutes: interviewData.durationMinutes || 60,
        meeting_link: interviewData.meetingLink,
        agenda: interviewData.agenda,
        interview_notes: interviewData.notes,
        additional_interviewers: interviewData.additionalInterviewers || [],
        status: 'scheduled'
      };

      const { data, error } = await supabase
        .from('interviews_v2')
        .insert(interviewRecord)
        .select(`
          *,
          application:job_applications_v2!interviews_v2_application_id_fkey (
            id,
            status,
            applicant:profiles!job_applications_v2_applicant_id_fkey (
              id,
              full_name,
              avatar_url
            )
          ),
          job:jobs (
            id,
            title,
            companies (name)
          )
        `)
        .single();

      if (error) throw error;

      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.id, profile?.company?.id]);

  // Get all interviews for employer (all flows)
  const getEmployerInterviews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('interviews_v2')
        .select(`
          *,
          job:jobs (
            id,
            title,
            companies (name)
          ),
          seeker_profile:profiles!interviews_v2_seeker_id_fkey (
            id,
            full_name,
            avatar_url
          ),
          application:job_applications_v2!interviews_v2_application_id_fkey (
            id,
            status
          ),
          invitation:interview_invitations!interviews_v2_invitation_id_fkey (
            id,
            status
          )
        `)
        .eq('interviewer_id', user.id)
        .order('interview_date', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Determine interview flow type
  const getInterviewFlowType = useCallback((interview) => {
    if (interview.invitation_id) {
      return 'invitation'; // Flow 2: Invitation-based
    } else if (interview.application_id) {
      return 'application'; // Flow 3: Application-based
    } else {
      return 'direct'; // Flow 1: Direct scheduling
    }
  }, []);

  return {
    loading,
    error,
    scheduleDirectInterview,
    sendInterviewInvitation,
    scheduleInterviewFromApplication,
    getEmployerInterviews,
    getInterviewFlowType
  };
};

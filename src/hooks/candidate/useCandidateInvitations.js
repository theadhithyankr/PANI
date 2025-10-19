import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../clients/supabaseClient';

/**
 * Hook to manage candidate invitations
 * @param {string} candidateId - The candidate's job seeker profile ID
 */
export const useCandidateInvitations = (candidateId) => {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch invitations for the candidate
  const fetchInvitations = useCallback(async () => {
    if (!candidateId) {
      setInvitations([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Fetching invitations for candidate:', candidateId);
      
      // Use the new unified job_applications table with status filter
      const query = supabase
        .from('job_applications_v2')
        .select(`
          id,
          job_id,
          status,
          application_date,
          applicant_id,
          jobs:job_id (
            id,
            title,
            location,
            job_type,
            salary_range,
            is_remote,
            description,
            companies:company_id (
              id,
              name,
              logo_url,
              industry
            )
          ),
          employer_profiles:employer_id (
            id,
            company_id,
            position,
            companies:company_id (
              id,
              name,
              logo_url
            )
          )
        `)
        .eq('applicant_id', candidateId)
        .in('status', ['invited', 'accepted', 'declined'])
        .order('application_date', { ascending: false });

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      console.log('Fetched invitations:', data?.length || 0);

      // Transform invitations to a more usable format
      const transformedInvitations = (data || []).map(invitation => ({
        id: invitation.id,
        jobId: invitation.job_id,
        status: invitation.status,
        response: invitation.status === 'accepted' ? 'accepted' : 
                 invitation.status === 'declined' ? 'declined' : 'pending',
        createdAt: invitation.application_date,
        employerId: invitation.employer_id,
        candidateId: invitation.applicant_id,
        job: {
          id: invitation.jobs?.id,
          title: invitation.jobs?.title || '',
          location: invitation.jobs?.location || '',
          jobType: invitation.jobs?.job_type || '',
          salary: invitation.jobs?.salary_range ?
            (typeof invitation.jobs.salary_range === 'object' && 
             invitation.jobs.salary_range.min && invitation.jobs.salary_range.max ?
              `€${invitation.jobs.salary_range.min} - €${invitation.jobs.salary_range.max}` :
              invitation.jobs.salary_range) : '',
          isRemote: invitation.jobs?.is_remote || false,
          description: invitation.jobs?.description || '',
          company: {
            id: invitation.jobs?.companies?.id,
            name: invitation.jobs?.companies?.name || '',
            logo: invitation.jobs?.companies?.logo_url || '/default-company-logo.png',
            industry: invitation.jobs?.companies?.industry || ''
          }
        },
                 employer: {
           id: invitation.employer_profiles?.id,
           companyId: invitation.employer_profiles?.company_id,
           position: invitation.employer_profiles?.position || '',
           companyName: invitation.employer_profiles?.companies?.name || '',
           companyLogo: invitation.employer_profiles?.companies?.logo_url || ''
         }
      }));

      setInvitations(transformedInvitations);
    } catch (err) {
      console.error('Error fetching invitations:', err);
      setError(err.message || 'Failed to fetch invitations');
      setInvitations([]);
    } finally {
      setLoading(false);
    }
  }, [candidateId]);

  // Accept an invitation
  const acceptInvitation = useCallback(async (invitationId) => {
    if (!invitationId || !candidateId) {
      throw new Error('Missing required parameters');
    }

    try {
      console.log('Accepting invitation:', invitationId);
      
      // Get the invitation details first (before updating status)
      const { data: invitationData, error: invitationError } = await supabase
        .from('job_applications_v2')
        .select(`
          job_id,
          employer_id,
          jobs:job_id (
            title,
            companies:company_id (
              name
            )
          )
        `)
        .eq('id', invitationId)
        .eq('applicant_id', candidateId) // Security check
        .single();

      if (invitationError) throw invitationError;

      // Update the invitation status
      const { error: updateError } = await supabase
        .from('job_applications_v2')
        .update({ 
          status: 'accepted',
          updated_at: new Date().toISOString()
        })
        .eq('id', invitationId)
        .eq('applicant_id', candidateId); // Security check

      if (updateError) throw updateError;

      // Note: Interview will be created by the employer after acceptance
      // Candidates cannot create interviews due to RLS policies
      // The employer will schedule the interview and the candidate will see it

      // Refresh invitations to reflect the change
      await fetchInvitations();

      return { success: true };
    } catch (err) {
      console.error('Error accepting invitation:', err);
      throw err;
    }
  }, [candidateId, fetchInvitations]);

  // Decline an invitation
  const declineInvitation = useCallback(async (invitationId) => {
    if (!invitationId || !candidateId) {
      throw new Error('Missing required parameters');
    }

    try {
      console.log('Declining invitation:', invitationId);
      
      const { error: updateError } = await supabase
        .from('job_applications_v2')
        .update({ 
          status: 'declined',
          updated_at: new Date().toISOString()
        })
        .eq('id', invitationId)
        .eq('applicant_id', candidateId); // Security check

      if (updateError) throw updateError;

      // Refresh invitations to reflect the change
      await fetchInvitations();

      return { success: true };
    } catch (err) {
      console.error('Error declining invitation:', err);
      throw err;
    }
  }, [candidateId, fetchInvitations]);

  // Set up real-time updates for invitations
  useEffect(() => {
    if (!candidateId) return;

    const channel = supabase
      .channel(`candidate-invitations-${candidateId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'job_applications',
          filter: `applicant_id=eq.${candidateId}`
        },
        (payload) => {
          console.log('Invitation changed:', payload);
          // Refresh invitations when changes occur
          fetchInvitations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [candidateId, fetchInvitations]);

  // Fetch invitations when component mounts or candidateId changes
  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  return {
    invitations,
    loading,
    error,
    acceptInvitation,
    declineInvitation,
    refetch: fetchInvitations
  };
};

export default useCandidateInvitations;

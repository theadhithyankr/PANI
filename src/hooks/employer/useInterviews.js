import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../clients/supabaseClient';
import useGlobalStore from '../../stores/globalStore';
import { useAuth } from '../common/useAuth';

const useInterviews = () => {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const profile = useGlobalStore((state) => state.profile);
  const company = profile?.company;
  const { user } = useAuth();

  // Fetch all interviews
  const fetchInterviews = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);

      // Ensure we have company data and user data to filter by
      if (!company?.id || !user?.id) {
        console.warn('No company data or user data available for filtering interviews');
        setInterviews([]);
        return [];
      }

      let query = supabase
        .from('interviews_v2')
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
          job:jobs!interviews_v2_job_id_fkey!inner (
            id,
            title,
            companies (
              id,
              name
            )
          ),
          interviewer:profiles!interviews_v2_interviewer_id_fkey (
            id,
            full_name,
            avatar_url
          ),
          seeker_profile:profiles!interviews_v2_seeker_id_fkey (
            id,
            full_name,
            avatar_url,
            phone,
            email_verified,
            phone_verified
          )
        `)
        .order('interview_date', { ascending: true });

      // Filter by company - inner join ensures filter is applied correctly under RLS
      query = query.eq('job.company_id', profile?.company?.id);
      
      // Filter by interviewer - only show interviews where the current user is the interviewer
      // This ensures only interviews scheduled by the current employer are shown
      query = query.eq('interviewer_id', user.id);

      // Apply filters
      if (filters.job_id) {
        query = query.eq('job_id', filters.job_id);
      }
      if (filters.interviewer_id) {
        query = query.eq('interviewer_id', filters.interviewer_id);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.application_id) {
        query = query.eq('application_id', filters.application_id);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      const validInterviews = (data || []).filter(
        interview => interview.interview_date && !isNaN(new Date(interview.interview_date))
      );

      setInterviews(validInterviews);
      return validInterviews;
    } catch (err) {
      console.error('Error fetching interviews:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [company, user]); // Include company and user in dependencies to refetch when either changes

  // Validate interview scheduling to prevent multiple concurrent interviews
  const validateInterviewScheduling = useCallback(async (interviewData) => {
    try {
      let query = supabase
        .from('interviews_v2')
        .select('id, interview_type, interview_date, status')
        .eq('status', 'scheduled');

      // Check based on application_id or seeker_id + job_id
      if (interviewData.application_id) {
        query = query.eq('application_id', interviewData.application_id);
      } else if (interviewData.seeker_id && interviewData.job_id) {
        query = query
          .eq('seeker_id', interviewData.seeker_id)
          .eq('job_id', interviewData.job_id);
      } else {
        throw new Error('Cannot validate interview scheduling without proper identifiers');
      }

      const { data: existingInterviews, error } = await query;

      if (error) {
        console.error('Error checking existing interviews:', error);
        throw new Error('Failed to validate interview scheduling');
      }

      if (existingInterviews && existingInterviews.length > 0) {
        const activeInterview = existingInterviews[0];
        const interviewDate = new Date(activeInterview.interview_date).toLocaleDateString();
        
        throw new Error(
          `A ${activeInterview.interview_type} interview is already scheduled for ${interviewDate}. ` +
          'Please complete or cancel the existing interview before scheduling a new one.'
        );
      }

      return true;
    } catch (error) {
      throw error;
    }
  }, []);

  // Check if next interview can be scheduled (only after current one is completed)
  const canScheduleNextInterview = useCallback(async (applicationId, seekerId, jobId) => {
    try {
      let query = supabase
        .from('interviews_v2')
        .select('id, interview_type, interview_date, status')
        .in('status', ['scheduled', 'in_progress']);

      // Check based on application_id or seeker_id + job_id
      if (applicationId) {
        query = query.eq('application_id', applicationId);
      } else if (seekerId && jobId) {
        query = query
          .eq('seeker_id', seekerId)
          .eq('job_id', jobId);
      } else {
        throw new Error('Cannot check interview status without proper identifiers');
      }

      const { data: activeInterviews, error } = await query;

      if (error) {
        console.error('Error checking active interviews:', error);
        return { canSchedule: false, reason: 'Failed to check interview status' };
      }

      if (activeInterviews && activeInterviews.length > 0) {
        const activeInterview = activeInterviews[0];
        const interviewDate = new Date(activeInterview.interview_date).toLocaleDateString();
        
        return {
          canSchedule: false,
          reason: `Please complete the ${activeInterview.interview_type} interview scheduled for ${interviewDate} before scheduling the next round.`,
          activeInterview: activeInterview
        };
      }

      return { canSchedule: true, reason: 'No active interviews found' };
    } catch (error) {
      console.error('Error in canScheduleNextInterview:', error);
      return { canSchedule: false, reason: error.message };
    }
  }, []);

  // Get interview progression status for a candidate
  const getInterviewProgression = useCallback(async (applicationId, seekerId, jobId) => {
    try {
      let query = supabase
        .from('interviews_v2')
        .select('id, interview_type, interview_date, status')
        .order('interview_date', { ascending: true });

      // Check based on application_id or seeker_id + job_id
      if (applicationId) {
        query = query.eq('application_id', applicationId);
      } else if (seekerId && jobId) {
        query = query
          .eq('seeker_id', seekerId)
          .eq('job_id', jobId);
      } else {
        throw new Error('Cannot get interview progression without proper identifiers');
      }

      const { data: interviews, error } = await query;

      if (error) {
        console.error('Error fetching interview progression:', error);
        return { interviews: [], currentStage: 0, canProceed: true };
      }

      const interviewStages = ['1st_interview', 'technical', 'hr_interview', 'final'];
      const completedInterviews = (interviews || []).filter(i => i.status === 'completed');
      const scheduledInterviews = (interviews || []).filter(i => i.status === 'scheduled');
      const currentStage = completedInterviews.length;
      const canProceed = scheduledInterviews.length === 0; // Can only proceed if no scheduled interviews

      return {
        interviews: interviews || [],
        completedInterviews,
        scheduledInterviews,
        currentStage,
        canProceed,
        nextStage: currentStage < interviewStages.length ? interviewStages[currentStage] : null
      };
    } catch (error) {
      console.error('Error in getInterviewProgression:', error);
      return { interviews: [], currentStage: 0, canProceed: false, error: error.message };
    }
  }, []);

  // Create a new interview
  const createInterview = useCallback(async (interviewData) => {
    try {
      // Validate required fields
      if (!interviewData.interview_type || !interviewData.interview_date) {
        throw new Error('Interview type and date are required');
      }

      // Check if user owns the job
      if (interviewData.job_id) {
        const { data: job, error: jobError } = await supabase
          .from('jobs')
          .select('id')
          .eq('id', interviewData.job_id)
          .eq('employer_id', user.id)
          .single();

        if (jobError || !job) {
          throw new Error('Job not found or you do not have permission to schedule interviews for this job');
        }
      }

      // Check if next interview can be scheduled (status checking)
      const statusCheck = await canScheduleNextInterview(
        interviewData.application_id,
        interviewData.seeker_id,
        interviewData.job_id
      );

      if (!statusCheck.canSchedule) {
        throw new Error(statusCheck.reason);
      }

      // Validate interview scheduling (prevent multiple concurrent interviews)
      await validateInterviewScheduling(interviewData);

      // Transform data to match database schema
      const dbData = {
        interview_type: interviewData.interview_type,
        interview_date: interviewData.interview_date,
        interview_time: interviewData.interview_time || null,
        duration_minutes: interviewData.duration || 60,
        location: interviewData.location || null,
        interview_notes: interviewData.interview_notes || null,
        status: 'scheduled',
        employer_id: user.id,
        application_id: interviewData.application_id || null,
        seeker_id: interviewData.seeker_id || null,
        job_id: interviewData.job_id || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('interviews_v2')
        .insert([dbData])
        .select()
        .single();

      if (error) {
        console.error('Error creating interview:', error);
        throw error;
      }

      // Refresh interviews list
      await fetchInterviews();

      return { data, error: null };
    } catch (error) {
      console.error('Error in createInterview:', error);
      return { data: null, error };
    }
  }, [user, fetchInterviews, canScheduleNextInterview, validateInterviewScheduling]);

  // Update an existing interview
  const updateInterview = useCallback(async (interviewId, updateData) => {
    try {
      setLoading(true);
      setError(null);

      // Ensure we have company data and user data
      if (!company?.id || !user?.id) {
        throw new Error('No company data or user data available. Please ensure you are logged in with a valid company account.');
      }

      // First, verify that the interview belongs to the user's company
      const { data: existingInterview, error: fetchError } = await supabase
        .from('interviews_v2')
        .select(`
          *,
          job:jobs!interviews_v2_job_id_fkey (
            company_id
          )
        `)
        .eq('id', interviewId)
        .single();

      if (fetchError) {
        throw new Error('Interview not found');
      }

      if (existingInterview.job?.company_id !== profile?.company?.id) {
        throw new Error('You can only update interviews for jobs belonging to your company');
      }

      // Also verify that the current user is the interviewer
      if (existingInterview.interviewer_id !== user.id) {
        throw new Error('You can only update interviews that you scheduled');
      }

      const { data, error } = await supabase
        .from('interviews_v2')
        .update(updateData)
        .eq('id', interviewId)
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
          job:jobs!interviews_v2_job_id_fkey (
            id,
            title,
            companies (
              id,
              name
            )
          ),
          interviewer:profiles!interviews_v2_interviewer_id_fkey (
            id,
            full_name,
            avatar_url
          ),
          seeker_profile:profiles!interviews_v2_seeker_id_fkey (
            id,
            full_name,
            avatar_url,
            phone,
            email_verified,
            phone_verified
          )
        `)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (!data) {
        throw new Error('Interview not found');
      }

      // Update local state
      setInterviews(prev => 
        prev.map(interview => 
          interview.id === interviewId ? data : interview
        )
      );

      return data;
    } catch (err) {
      console.error('Error updating interview:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [company, user]);

  // Delete an interview
  const deleteInterview = useCallback(async (interviewId) => {
    try {
      setLoading(true);
      setError(null);

      // Ensure we have company data and user data
      if (!company?.id || !user?.id) {
        throw new Error('No company data or user data available. Please ensure you are logged in with a valid company account.');
      }

      // First, verify that the interview belongs to the user's company
      const { data: existingInterview, error: fetchError } = await supabase
        .from('interviews_v2')
        .select(`
          *,
          job:jobs!interviews_v2_job_id_fkey (
            company_id
          )
        `)
        .eq('id', interviewId)
        .single();

      if (fetchError) {
        throw new Error('Interview not found');
      }

      if (existingInterview.job?.company_id !== profile?.company?.id) {
        throw new Error('You can only delete interviews for jobs belonging to your company');
      }
      // Also verify that the current user is the interviewer
      if (existingInterview.interviewer_id !== user.id) {
        throw new Error('You can only delete interviews that you scheduled');
      }

      const { error } = await supabase
        .from('interviews_v2')
        .delete()
        .eq('id', interviewId);

      if (error) {
        throw error;
      }

      // Remove from local state
      setInterviews(prev => prev.filter(interview => interview.id !== interviewId));
      return true;
    } catch (err) {
      console.error('Error deleting interview:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [company, user]);

  // Get interview by ID
  const getInterviewById = async (interviewId) => {
    try {
      setLoading(true);
      setError(null);

      // Ensure we have company data
      if (!company?.id) {
        throw new Error('No company data available. Please ensure you are logged in with a valid company account.');
      }

      const { data, error } = await supabase
        .from('interviews_v2')
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
          job:jobs!interviews_v2_job_id_fkey (
            id,
            title,
            companies (
              id,
              name
            )
          ),
          interviewer:profiles!interviews_v2_interviewer_id_fkey (
            id,
            full_name,
            avatar_url
          ),
          seeker_profile:profiles!interviews_v2_seeker_id_fkey (
            id,
            full_name,
            avatar_url,
            phone,
            email_verified,
            phone_verified
          )
        `)
        .eq('id', interviewId)
        .eq('job.company_id', profile?.company?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (!data) {
        return null;
      }

      return data;
    } catch (err) {
      console.error('Error fetching interview:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Update interview status
  const updateInterviewStatus = async (interviewId, status) => {
    try {
      setLoading(true);
      setError(null);

      // Ensure we have company data
      if (!company?.id) {
        throw new Error('No company data available. Please ensure you are logged in with a valid company account.');
      }

      const validStatuses = ['scheduled', 'completed', 'cancelled', 'rescheduled'];
      if (!validStatuses.includes(status)) {
        throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      }

      // First, verify that the interview belongs to the user's company
      const { data: existingInterview, error: fetchError } = await supabase
        .from('interviews_v2')
        .select(`
          *,
          job:jobs!interviews_v2_job_id_fkey (
            company_id
          )
        `)
        .eq('id', interviewId)
        .single();

      if (fetchError) {
        throw new Error('Interview not found');
      }

      if (existingInterview.job?.company_id !== profile?.company?.id) {
        throw new Error('You can only update interviews for jobs belonging to your company');
      }

      const { data, error } = await supabase
        .from('interviews_v2')
        .update({ status })
        .eq('id', interviewId)
        .select()
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (!data) {
        throw new Error('Interview not found');
      }

      // Update local state
      setInterviews(prev => 
        prev.map(interview => 
          interview.id === interviewId ? { ...interview, status } : interview
        )
      );

      return data;
    } catch (err) {
      console.error('Error updating interview status:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Add feedback to interview
  const addInterviewFeedback = async (interviewId, feedback, rating) => {
    try {
      setLoading(true);
      setError(null);

      // Ensure we have company data
      if (!company?.id) {
        throw new Error('No company data available. Please ensure you are logged in with a valid company account.');
      }

      const updateData = { feedback };
      if (rating !== undefined) {
        if (rating < 1 || rating > 5) {
          throw new Error('Rating must be between 1 and 5');
        }
        updateData.rating = rating;
      }

      // First, verify that the interview belongs to the user's company
      const { data: existingInterview, error: fetchError } = await supabase
        .from('interviews_v2')
        .select(`
          *,
          job:jobs!interviews_v2_job_id_fkey (
            company_id
          )
        `)
        .eq('id', interviewId)
        .single();

      if (fetchError) {
        throw new Error('Interview not found');
      }

      if (existingInterview.job?.company_id !== profile?.company?.id) {
        throw new Error('You can only add feedback to interviews for jobs belonging to your company');
      }

      const { data, error } = await supabase
        .from('interviews_v2')
        .update(updateData)
        .eq('id', interviewId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Update local state
      setInterviews(prev => 
        prev.map(interview => 
          interview.id === interviewId ? { ...interview, ...updateData } : interview
        )
      );

      return data;
    } catch (err) {
      console.error('Error adding interview feedback:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get interviews by date range
  const getInterviewsByDateRange = async (startDate, endDate, filters = {}) => {
    try {
      setLoading(true);
      setError(null);

      // Ensure we have company data and user data to filter by
      if (!company?.id || !user?.id) {
        console.warn('No company data or user data available for filtering interviews by date range');
        return [];
      }

      let query = supabase
        .from('interviews_v2')
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
          job:jobs!interviews_v2_job_id_fkey (
            id,
            title,
            companies (
              id,
              name
            )
          ),
          interviewer:profiles!interviews_v2_interviewer_id_fkey (
            id,
            full_name,
            avatar_url
          ),
          seeker_profile:profiles!interviews_v2_seeker_id_fkey (
            id,
            full_name,
            avatar_url,
            phone,
            email_verified,
            phone_verified
          )
        `)
        .gte('interview_date', startDate)
        .lte('interview_date', endDate)
        .order('interview_date', { ascending: true });

      // Filter by company - only show interviews for jobs belonging to the logged-in user's company
      query = query.eq('job.company_id', profile?.company?.id);
      
      // Filter by interviewer - only show interviews where the current user is the interviewer
      query = query.eq('interviewer_id', user.id);

      // Apply additional filters
      if (filters.job_id) {
        query = query.eq('job_id', filters.job_id);
      }
      if (filters.interviewer_id) {
        query = query.eq('interviewer_id', filters.interviewer_id);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data || [];
    } catch (err) {
      console.error('Error fetching interviews by date range:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  return {
    interviews,
    loading,
    error,
    fetchInterviews,
    createInterview,
    updateInterview,
    deleteInterview,
    getInterviewById,
    updateInterviewStatus,
    addInterviewFeedback,
    getInterviewsByDateRange,
    canScheduleNextInterview,
    getInterviewProgression,
    clearError
  };
};

export default useInterviews;
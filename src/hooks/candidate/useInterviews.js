import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../clients/supabaseClient';

const useInterviews = (userId = null, jobSeekerProfileId = null) => {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all interviews for a candidate (both application-linked and direct)
  const fetchInterviews = useCallback(async (filters = {}) => {
    if (!userId || !jobSeekerProfileId) {
      console.warn('useInterviews: userId and jobSeekerProfileId are required');
      return [];
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch interviews linked to job applications
      const { data: applicationInterviews, error: applicationError } = await supabase
        .from('interviews_v2')
        .select(`
          id,
          application_id,
          interview_type,
          interview_format,
          location,
          interview_date,
          duration_minutes,
          notes,
          status,
          feedback,
          rating,
          meeting_link,
          agenda,
          reminder_sent,
          interviewer:interviewer_id (
            id,
            full_name,
            avatar_url
          ),
          job_applications_v2!inner (
            id,
            applicant_id,
            status,
            jobs (
              id,
              title,
              location,
              job_type,
              salary_range,
              is_remote,
              companies:company_id (
                id,
                name,
                logo_url
              )
            )
          )
        `)
        .eq('job_applications_v2.applicant_id', userId)
        .order('interview_date', { ascending: false });

      if (applicationError) throw applicationError;

      // Transform data to match expected format
      const transformedInterviews = (applicationInterviews || []).map(interview => ({
        id: interview.id,
        jobApplicationId: interview.application_id,
        interviewType: interview.interview_type,
        interviewFormat: interview.interview_format,
        location: interview.location, // Updated to match backend field name
        interviewDate: interview.interview_date,
        durationMinutes: interview.duration_minutes, // Updated to match backend field name
        notes: interview.interview_notes, // Updated to match backend field name
        status: interview.status,
        feedback: interview.feedback,
        rating: interview.rating,
        meetingLink: interview.meeting_link,
        agenda: interview.agenda,
        reminderSent: interview.reminder_sent,
        interviewer: interview.interviewer ? {
          id: interview.interviewer.id,
          fullName: interview.interviewer.full_name,
          avatarUrl: interview.interviewer.avatar_url
        } : null,
        job: interview.job_applications_v2?.jobs ? {
          id: interview.job_applications_v2.jobs.id,
          title: interview.job_applications_v2.jobs.title,
          location: interview.job_applications_v2.jobs.location,
          jobType: interview.job_applications_v2.jobs.job_type,
          salaryRange: interview.job_applications_v2.jobs.salary_range,
          isRemote: interview.job_applications_v2.jobs.is_remote,
          company: interview.job_applications_v2.jobs.companies ? {
            id: interview.job_applications_v2.jobs.companies.id,
            name: interview.job_applications_v2.jobs.companies.name,
            logoUrl: interview.job_applications_v2.jobs.companies.logo_url
          } : null
        } : null
      }));

      setInterviews(transformedInterviews);
      return transformedInterviews;
    } catch (err) {
      console.error('Error fetching interviews:', err);
      setError(err.message || 'Failed to fetch interviews');
      setInterviews([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [userId, jobSeekerProfileId]);

  // Get interview by ID
  const getInterviewById = useCallback(async (interviewId) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('interviews_v2')
        .select(`
          *,
          job_applications_v2 (
            id,
            applicant_id,
            status,
            jobs (
              id,
              title,
              location,
              job_type,
              salary_range,
              is_remote,
              companies:company_id (
                id,
                name,
                logo_url
              )
            )
          ),
          jobs:job_id (
            id,
            title,
            location,
            job_type,
            salary_range,
            is_remote,
            companies:company_id (
              id,
              name,
              logo_url
            )
          ),
          interviewer:interviewer_id (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('id', interviewId)
        .single();

      if (error) throw error;

      if (!data) return null;

      // Transform the data
      const transformedInterview = {
        ...data,
        type: data.application_id ? 'application-linked' : 'direct',
        jobTitle: data.job_applications_v2?.jobs?.title || data.jobs?.title,
        companyName: data.job_applications_v2?.jobs?.companies?.name || data.jobs?.companies?.name,
        companyLogo: data.job_applications_v2?.jobs?.companies?.logo_url || data.jobs?.companies?.logo_url,
        jobLocation: data.job_applications_v2?.jobs?.location || data.jobs?.location,
        jobType: data.job_applications_v2?.jobs?.job_type || data.jobs?.job_type,
        salaryRange: data.job_applications_v2?.jobs?.salary_range || data.jobs?.salary_range,
        isRemote: data.job_applications_v2?.jobs?.is_remote || data.jobs?.is_remote,
        applicationStatus: data.job_applications_v2?.status,
        applicationId: data.application_id
      };

      return transformedInterview;
    } catch (err) {
      console.error('Error fetching interview:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update interview status (for candidate actions like accepting/rescheduling)
  const updateInterviewStatus = useCallback(async (interviewId, status) => {
    try {
      setLoading(true);
      setError(null);

      const validStatuses = ['scheduled', 'completed', 'cancelled', 'rescheduled'];
      if (!validStatuses.includes(status)) {
        throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      }

      const { data, error } = await supabase
        .from('interviews_v2')
        .update({ status })
        .eq('id', interviewId)
        .select()
        .single();

      if (error) throw error;

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
  }, []);

  // Get upcoming interviews
  const getUpcomingInterviews = useCallback(() => {
    const now = new Date();
    return interviews.filter(interview => 
      interview.status === 'scheduled' && 
      new Date(interview.interview_date) > now
    );
  }, [interviews]);

  // Get past interviews
  const getPastInterviews = useCallback(() => {
    const now = new Date();
    return interviews.filter(interview => 
      interview.status === 'completed' || 
      new Date(interview.interview_date) < now
    );
  }, [interviews]);

  // Get interviews by date range
  const getInterviewsByDateRange = useCallback((startDate, endDate) => {
    return interviews.filter(interview => {
      const interviewDate = new Date(interview.interview_date);
      return interviewDate >= startDate && interviewDate <= endDate;
    });
  }, [interviews]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    interviews,
    loading,
    error,
    fetchInterviews,
    getInterviewById,
    updateInterviewStatus,
    getUpcomingInterviews,
    getPastInterviews,
    getInterviewsByDateRange,
    clearError
  };
};

export default useInterviews;
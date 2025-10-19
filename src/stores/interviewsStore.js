import { create } from 'zustand';
import { supabase } from '../clients/supabaseClient';

const useInterviewsStore = create((set, get) => ({
  // State
  interviews: [],
  selectedInterview: null,
  loading: {
    interviews: false,
    selectedInterview: false
  },
  error: {
    interviews: null,
    selectedInterview: null
  },
  filters: {
    status: 'all',
    dateRange: null,
    interviewer: null
  },

  // Actions
  setLoading: (key, loading) => 
    set(state => ({
      loading: { ...state.loading, [key]: loading }
    })),

  setError: (key, error) => 
    set(state => ({
      error: { ...state.error, [key]: error }
    })),

  setFilters: (filters) => 
    set(state => ({
      filters: { ...state.filters, ...filters }
    })),

  setSelectedInterview: (interview) => 
    set({ selectedInterview: interview }),

  // Fetch interviews using new clean structure
  fetchInterviews: async (userId, userType = 'candidate') => {
    get().setLoading('interviews', true);
    get().setError('interviews', null);

    try {
      let query = supabase
        .from('interviews_v2')
        .select(`
          id,
          application_id,
          interview_type,
          interview_format,
          location,
          interview_date,
          duration_minutes,
          interview_notes,
          status,
          feedback,
          rating,
          meeting_link,
          agenda,
          reminder_sent,
          created_at,
          updated_at,
          interviewer:interviewer_id (
            id,
            full_name,
            avatar_url,
            email
          ),
          job_applications_v2!inner:application_id (
            id,
            applicant_id,
            jobs:job_id (
              id,
              title,
              companies:company_id (
                id,
                name,
                logo_url
              )
            )
          )
        `)
        .order('interview_date', { ascending: false });

      // Apply user-specific filters
      if (userType === 'candidate') {
        query = query.eq('job_applications_v2.applicant_id', userId);
      } else if (userType === 'employer') {
        query = query.eq('interviewer_id', userId);
      }

      // Apply status filter
      const { status } = get().filters;
      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      // Apply date range filter
      const { dateRange } = get().filters;
      if (dateRange && dateRange.from && dateRange.to) {
        query = query
          .gte('interview_date', dateRange.from)
          .lte('interview_date', dateRange.to);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transform data to match expected format
      const transformedInterviews = (data || []).map(interview => ({
        id: interview.id,
        applicationId: interview.application_id,
        type: interview.interview_type,
        format: interview.interview_format,
        location: interview.location, // Updated to match backend field name
        date: interview.interview_date,
        duration: interview.duration_minutes, // Updated to match backend field name
        notes: interview.interview_notes, // Updated to match backend field name
        status: interview.status,
        feedback: interview.feedback,
        rating: interview.rating,
        meetingLink: interview.meeting_link,
        agenda: interview.agenda,
        reminderSent: interview.reminder_sent,
        createdAt: interview.created_at,
        updatedAt: interview.updated_at,
        interviewer: interview.interviewer ? {
          id: interview.interviewer.id,
          name: interview.interviewer.full_name,
          avatar: interview.interviewer.avatar_url,
          email: interview.interviewer.email
        } : null,
        job: interview.job_applications_v2?.jobs ? {
          id: interview.job_applications_v2.jobs.id,
          title: interview.job_applications_v2.jobs.title,
          company: interview.job_applications_v2.jobs.companies ? {
            id: interview.job_applications_v2.jobs.companies.id,
            name: interview.job_applications_v2.jobs.companies.name,
            logo: interview.job_applications_v2.jobs.companies.logo_url
          } : null
        } : null
      }));

      set({ interviews: transformedInterviews });
    } catch (err) {
      console.error('Error fetching interviews:', err);
      get().setError('interviews', err.message || 'Failed to fetch interviews');
      set({ interviews: [] });
    } finally {
      get().setLoading('interviews', false);
    }
  },

  // Fetch single interview by ID
  fetchInterviewById: async (interviewId) => {
    if (!interviewId) return;

    get().setLoading('selectedInterview', true);
    get().setError('selectedInterview', null);

    try {
      const { data, error } = await supabase
        .from('interviews_v2')
        .select(`
          id,
          application_id,
          interview_type,
          interview_format,
          location,
          interview_date,
          duration_minutes,
          interview_notes,
          status,
          feedback,
          rating,
          meeting_link,
          agenda,
          reminder_sent,
          created_at,
          updated_at,
          interviewer:interviewer_id (
            id,
            full_name,
            avatar_url,
            email
          ),
          job_applications_v2:application_id (
            id,
            applicant_id,
            jobs:job_id (
              id,
              title,
              companies:company_id (
                id,
                name,
                logo_url
              )
            )
          )
        `)
        .eq('id', interviewId)
        .single();

      if (error) throw error;

      // Transform data to match expected format
      const transformedInterview = {
        id: data.id,
        applicationId: data.application_id,
        type: data.interview_type,
        format: data.interview_format,
        location: data.location, // Updated to match backend field name
        date: data.interview_date,
        duration: data.duration_minutes, // Updated to match backend field name
        notes: data.interview_notes, // Updated to match backend field name
        status: data.status,
        feedback: data.feedback,
        rating: data.rating,
        meetingLink: data.meeting_link,
        agenda: data.agenda,
        reminderSent: data.reminder_sent,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        interviewer: data.interviewer ? {
          id: data.interviewer.id,
          name: data.interviewer.full_name,
          avatar: data.interviewer.avatar_url,
          email: data.interviewer.email
        } : null,
        job: data.job_applications_v2?.jobs ? {
          id: data.job_applications_v2.jobs.id,
          title: data.job_applications_v2.jobs.title,
          company: data.job_applications_v2.jobs.companies ? {
            id: data.job_applications_v2.jobs.companies.id,
            name: data.job_applications_v2.jobs.companies.name,
            logo: data.job_applications_v2.jobs.companies.logo_url
          } : null
        } : null
      };

      set({ selectedInterview: transformedInterview });
      return transformedInterview;
    } catch (err) {
      console.error('Error fetching interview:', err);
      get().setError('selectedInterview', err.message || 'Failed to fetch interview');
      set({ selectedInterview: null });
      return null;
    } finally {
      get().setLoading('selectedInterview', false);
    }
  },

  // Create new interview
  createInterview: async (interviewData) => {
    try {
      const { data, error } = await supabase
        .from('interviews_v2')
        .insert(interviewData)
        .select()
        .single();

      if (error) throw error;

      // Refresh interviews list
      await get().fetchInterviews(interviewData.interviewer_id, 'employer');
      
      return { success: true, interview: data };
    } catch (err) {
      console.error('Error creating interview:', err);
      return { success: false, error: err.message };
    }
  },

  // Update interview
  updateInterview: async (interviewId, updates) => {
    try {
      const { data, error } = await supabase
        .from('interviews_v2')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', interviewId)
        .select()
        .single();

      if (error) throw error;

      // Update local state
      set(state => ({
        interviews: state.interviews.map(interview => 
          interview.id === interviewId 
            ? { ...interview, ...updates, updatedAt: new Date().toISOString() }
            : interview
        ),
        selectedInterview: state.selectedInterview?.id === interviewId 
          ? { ...state.selectedInterview, ...updates, updatedAt: new Date().toISOString() }
          : state.selectedInterview
      }));

      return { success: true, interview: data };
    } catch (err) {
      console.error('Error updating interview:', err);
      return { success: false, error: err.message };
    }
  },

  // Delete interview
  deleteInterview: async (interviewId) => {
    try {
      const { error } = await supabase
        .from('interviews_v2')
        .delete()
        .eq('id', interviewId);

      if (error) throw error;

      // Update local state
      set(state => ({
        interviews: state.interviews.filter(interview => interview.id !== interviewId),
        selectedInterview: state.selectedInterview?.id === interviewId ? null : state.selectedInterview
      }));

      return { success: true };
    } catch (err) {
      console.error('Error deleting interview:', err);
      return { success: false, error: err.message };
    }
  },

  // Clear all data
  clearData: () => {
    set({
      interviews: [],
      selectedInterview: null,
      filters: {
        status: 'all',
        dateRange: null,
        interviewer: null
      }
    });
  },

  // Reset store to initial state
  reset: () => {
    set({
      interviews: [],
      selectedInterview: null,
      loading: {
        interviews: false,
        selectedInterview: false
      },
      error: {
        interviews: null,
        selectedInterview: null
      },
      filters: {
        status: 'all',
        dateRange: null,
        interviewer: null
      }
    });
  }
}));

export default useInterviewsStore;
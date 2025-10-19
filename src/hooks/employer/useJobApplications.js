import { useState, useCallback } from 'react';
import { supabase } from '../../clients/supabaseClient';
import useGlobalStore from '../../stores/globalStore';

export const useJobApplications = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Get user from global store
  const user = useGlobalStore((state) => state.user);

  // Check if an application exists for a job and candidate
  const checkApplicationExists = useCallback(async (jobId, applicantId) => {
    try {
      const { data, error } = await supabase
        .from('job_applications_v2')
        .select('*')
        .eq('job_id', jobId)
        .eq('applicant_id', applicantId)
        .maybeSingle(); // Use maybeSingle instead of single to handle 0 rows gracefully

      if (error) {
        console.error('Error checking application:', error);
        return null;
      }

      return data; // Will be null if no rows found
    } catch (err) {
      console.error('Error checking application:', err);
      return null;
    }
  }, []);

  // Create a new application (for AI-found candidates)
  const createApplication = useCallback(async (jobId, applicantId, status = 'interviewing', notes = '') => {
    try {
      setLoading(true);
      setError(null);

      if (!user?.id) {
        throw new Error('User information is missing');
      }

      const applicationData = {
        job_id: jobId,
        applicant_id: applicantId,
        status: status,
        employer_notes: notes,
        ai_match_score: null, // Could be populated if we have AI matching data
        cover_note: 'Added by employer through interview process',
        application_date: new Date().toISOString(),
        // Initialize other fields with null/default values
        resume_id: null,
        cover_letter_id: null,
        additional_document_ids: [],
        availability_date: null,
        salary_expectation: null,
        visa_status: null,
        motivation: null,
        custom_questions: {}
      };

      const { data, error } = await supabase
        .from('job_applications_v2')
        .insert(applicationData)
        .select()
        .single();

      if (error) {
        // Handle specific error cases
        if (error.code === '23505') {
          throw new Error('Application already exists for this job and candidate');
        } else if (error.code === '23503') {
          throw new Error('Invalid job or candidate reference');
        }
        throw error;
      }

      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Update application status
  const updateApplicationStatus = useCallback(async (applicationId, status, notes = '') => {
    try {
      setLoading(true);
      setError(null);

      if (!user?.id) {
        throw new Error('User information is missing');
      }

      const updateData = {
        status: status,
        updated_at: new Date().toISOString()
      };

      // Add employer notes if provided
      if (notes) {
        updateData.employer_notes = notes;
      }

      const { data, error } = await supabase
        .from('job_applications_v2')
        .update(updateData)
        .eq('id', applicationId)
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

  // Update or create application status (handles both scenarios)
  const manageApplicationStatus = useCallback(async (jobId, applicantId, newStatus, notes = '') => {
    try {
      setLoading(true);
      setError(null);

      // First check if application exists
      const existingApplication = await checkApplicationExists(jobId, applicantId);

      let updatedApplication;
      if (existingApplication) {
        // Update existing application
        updatedApplication = await updateApplicationStatus(existingApplication.id, newStatus, notes);
      } else {
        // Create new application with the specified status
        updatedApplication = await createApplication(jobId, applicantId, newStatus, notes);
      }

      // Also update interview status if there's an associated interview
      try {
        await updateAssociatedInterviewStatus(jobId, applicantId, newStatus);
      } catch (interviewError) {
        console.warn('Failed to update interview status:', interviewError);
        // Don't throw here as the application update was successful
      }

      return updatedApplication;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [checkApplicationExists, updateApplicationStatus, createApplication]);

  // Update interview application status based on application status
  const updateAssociatedInterviewStatus = useCallback(async (jobId, applicantId, applicationStatus) => {
    try {
      // Find and update the interview's application_status field
      const { data: interviews, error: fetchError } = await supabase
        .from('interviews_v2')
        .select('id, status, application_status')
        .eq('job_id', jobId)
        .eq('seeker_id', applicantId);

      if (fetchError) {
        console.error('Error fetching interviews:', fetchError);
        return;
      }

      if (interviews && interviews.length > 0) {
        // Update application_status for all matching interviews
        const { error: updateError } = await supabase
          .from('interviews_v2')
          .update({ 
            application_status: applicationStatus,
            updated_at: new Date().toISOString()
          })
          .eq('job_id', jobId)
          .eq('seeker_id', applicantId);

        if (updateError) {
          console.error('Error updating interview application status:', updateError);
        } else {
          console.log(`Updated ${interviews.length} interview(s) application status to: ${applicationStatus}`);
        }

        // Also update interview status for certain application statuses
        const interviewStatusMapping = {
          'rejected': 'cancelled',
          'withdrawn': 'cancelled'
        };

        const interviewStatus = interviewStatusMapping[applicationStatus];
        if (interviewStatus) {
          // Only update interview status if it's still scheduled or in_progress
          const { error: statusUpdateError } = await supabase
            .from('interviews_v2')
            .update({ 
              status: interviewStatus,
              updated_at: new Date().toISOString()
            })
            .eq('job_id', jobId)
            .eq('seeker_id', applicantId)
            .in('status', ['scheduled', 'in_progress']);

          if (statusUpdateError) {
            console.error('Error updating interview status:', statusUpdateError);
          } else {
            console.log(`Updated interview status to: ${interviewStatus}`);
          }
        }
      }
    } catch (err) {
      console.error('Error in updateAssociatedInterviewStatus:', err);
    }
  }, []);

  return {
    loading,
    error,
    checkApplicationExists,
    createApplication,
    updateApplicationStatus,
    manageApplicationStatus,
    updateAssociatedInterviewStatus
  };
}; 
import { useState, useEffect } from 'react';
import { supabase } from '../../clients/supabaseClient';

// Global submission lock to prevent multiple submissions for the same job-user combination
const submissionLocks = new Map();

export const useJobApplication = () => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear any remaining locks when component unmounts
      submissionLocks.clear();
    };
  }, []);

  const submitApplication = async ({
    jobId,
    applicantId,
    coverNote,
    documents = {
      resumeId: null,
      coverLetterId: null,
      additionalDocumentIds: []
    },
    personalInfo,
    jobSpecific,
    customQuestions
  }, onSuccess = null) => {
    if (!jobId || !applicantId) {
      throw new Error('Job ID and Applicant ID are required');
    }

    // Create a unique key for this job-user combination
    const submissionKey = `${jobId}-${applicantId}`;
    
    // Check if there's already a submission in progress for this job-user combination
    if (submissionLocks.has(submissionKey)) {
      console.log('Submission already in progress for this job-user combination');
      throw new Error('Application submission already in progress');
    }

    // Lock this submission
    submissionLocks.set(submissionKey, true);
    setSubmitting(true);
    setError(null);

    try {
      // Map the data to the new schema structure (without personal_info)
      const applicationData = {
        job_id: jobId,
        applicant_id: applicantId,
        cover_note: coverNote || '',
        status: 'applied',
        application_date: new Date().toISOString(),
        // Document references
        resume_id: documents.resumeId,
        cover_letter_id: documents.coverLetterId,
        additional_document_ids: documents.additionalDocumentIds || [],
        // Job-specific information
        availability_date: jobSpecific?.availabilityDate ? new Date(jobSpecific.availabilityDate).toISOString().split('T')[0] : null,
        salary_expectation: jobSpecific?.salaryExpectation || null,
        visa_status: jobSpecific?.visaStatus || null,
        motivation: jobSpecific?.motivation || null,
        // Custom questions as JSONB
        custom_questions: customQuestions || {}
      };

      // Create the job application using the new schema
      const { data: application, error: applicationError } = await supabase
        .from('job_applications_v2')
        .insert(applicationData)
        .select()
        .single();

      if (applicationError) {
        console.error('Error creating application:', applicationError);
        
        // Handle specific error cases
        if (applicationError.code === '23505') {
          throw new Error('You have already applied for this job');
        } else if (applicationError.code === '23503') {
          throw new Error('Invalid job or user information');
        } else if (applicationError.code === '409') {
          throw new Error('You have already applied for this job');
        } else {
          throw new Error(applicationError.message || 'Failed to submit application');
        }
      }

      if (onSuccess) {
        onSuccess(application);
      }

      return application;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      // Always release the lock
      submissionLocks.delete(submissionKey);
      setSubmitting(false);
    }
  };

  const getApplication = async (applicationId) => {
    try {
      const { data, error } = await supabase
        .from('job_applications_v2')
        .select(`
          *,
          job:jobs(*),
          applicant:profiles!job_applications_v2_applicant_id_fkey(*)
        `)
        .eq('id', applicationId)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // Map the new schema back to the expected format
      const mappedData = {
        ...data,
        applicationData: {
          message: data.cover_note,
          documents: {
            resumeId: data.resume_id,
            coverLetterId: data.cover_letter_id,
            additionalDocumentIds: data.additional_document_ids || []
          },
          personalInfo: data.applicant || {},
          jobSpecific: {
            availabilityDate: data.availability_date,
            salaryExpectation: data.salary_expectation,
            visaStatus: data.visa_status,
            motivation: data.motivation
          },
          customQuestions: data.custom_questions || {}
        }
      };

      return mappedData;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const updateApplicationStatus = async (applicationId, status, employerNotes = null) => {
    try {
      const { data, error } = await supabase
        .from('job_applications_v2')
        .update({
          status,
          employer_notes: employerNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', applicationId)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const getApplicationsByJob = async (jobId) => {
    try {
      const { data, error } = await supabase
        .from('job_applications_v2')
        .select(`
          *,
          applicant:profiles!job_applications_v2_applicant_id_fkey(*)
        `)
        .eq('job_id', jobId)
        .order('application_date', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      // Map the new schema back to the expected format for each application
      const mappedData = data.map(app => ({
        ...app,
        applicationData: {
          message: app.cover_note,
          documents: {
            resumeId: app.resume_id,
            coverLetterId: app.cover_letter_id,
            additionalDocumentIds: app.additional_document_ids || []
          },
          personalInfo: app.applicant || {},
          jobSpecific: {
            availabilityDate: app.availability_date,
            salaryExpectation: app.salary_expectation,
            visaStatus: app.visa_status,
            motivation: app.motivation
          },
          customQuestions: app.custom_questions || {}
        }
      }));

      return mappedData;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const getApplicationsByApplicant = async (applicantId) => {
    try {
      const { data, error } = await supabase
        .from('job_applications_v2')
        .select(`
          *,
          job:jobs(*),
          applicant:profiles!job_applications_v2_applicant_id_fkey(*)
        `)
        .eq('applicant_id', applicantId)
        .order('application_date', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      // Map the new schema back to the expected format for each application
      const mappedData = data.map(app => ({
        ...app,
        applicationData: {
          message: app.cover_note,
          documents: {
            resumeId: app.resume_id,
            coverLetterId: app.cover_letter_id,
            additionalDocumentIds: app.additional_document_ids || []
          },
          personalInfo: app.applicant || {},
          jobSpecific: {
            availabilityDate: app.availability_date,
            salaryExpectation: app.salary_expectation,
            visaStatus: app.visa_status,
            motivation: app.motivation
          },
          customQuestions: app.custom_questions || {}
        }
      }));

      return mappedData;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  return {
    submitApplication,
    getApplication,
    updateApplicationStatus,
    getApplicationsByJob,
    getApplicationsByApplicant,
    submitting,
    error
  };
}; 
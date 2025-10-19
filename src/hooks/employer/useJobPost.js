import { useState, useCallback } from 'react';
import { supabase } from '../../clients/supabaseClient';
import useGlobalStore from '../../stores/globalStore';
import { useJobsStore } from '../../stores/jobsStore';
import { translateToEnglish } from '../../utils/translationUtils';

export const useJobPost = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Get user and profile from global store
  const user = useGlobalStore((state) => state.user);
  const profile = useGlobalStore((state) => state.profile);
  
  // Extract company id (support both embedded company object and company_id on employer profile)
  const companyId = profile?.company?.id || profile?.company_id;

  // Get jobs store actions
  const {
    jobs,
    isLoading: storeLoading,
    error: storeError,
    initialized,
    setJobs,
    setLoading: setStoreLoading,
    setError: setStoreError,
    addJob,
    updateJob: updateJobInStore,
    removeJob
  } = useJobsStore();

  const listJobs = useCallback(async (force = false) => {
    // If already initialized and not forced, return cached jobs
    if (initialized && !force) {
      return jobs;
    }

    setStoreLoading(true);
    setStoreError(null);

    try {
      if (!user?.id) {
        throw new Error('User information is missing');
      }
      if (!companyId) {
        // Company not loaded yet; return empty instead of throwing to avoid blocking page
        setJobs([]);
        return [];
      }

      const { data: jobsData, error: fetchError } = await supabase
        .from('jobs')
        .select('*, companies(*)')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setJobs(jobsData);
      return jobsData;
    } catch (err) {
      setStoreError(err.message);
      throw err;
    }
  }, [user?.id, companyId, initialized, jobs, setJobs, setStoreLoading, setStoreError]);

  const createJob = async (jobData) => {
    try {
      setLoading(true);
      setError(null);

      if (!user?.id || !companyId) {
        throw new Error('User or company information is missing');
      }

      // Translate skills and location if job is in German
      let translatedSkills = jobData.skills_required;
      let translatedLocation = jobData.location;
      if (jobData.preferred_language === 'german') {
        translatedSkills = await translateToEnglish(jobData.skills_required);
        translatedLocation = await translateToEnglish(jobData.location);
      }

      // Format the salary range data
      const salaryRange = {
        type: jobData.salary_type,
        currency: jobData.salary_currency,
        period: jobData.salary_period,
        ...(jobData.salary_type === 'fixed' && { fixed: jobData.salary_fixed }),
        ...(jobData.salary_type === 'range' && {
          min: jobData.salary_min,
          max: jobData.salary_max
        })
      };

      // Prepare job data for insertion
      const jobPayload = {
        company_id: companyId,
        created_by: user.id,
        title: jobData.title,
        description: jobData.description,
        requirements: jobData.requirements,
        responsibilities: jobData.responsibilities,
        location: translatedLocation,
        is_remote: jobData.is_remote,
        is_hybrid: jobData.is_hybrid,
        job_type: jobData.job_type,
        experience_level: jobData.experience_level,
        salary_range: salaryRange,
        skills_required: translatedSkills,
        benefits: jobData.benefits,
        application_deadline: jobData.application_deadline,
        start_date: jobData.start_date,
        drivers_license: jobData.drivers_license,
        additional_questions: jobData.additional_questions,
        preferred_language: jobData.preferred_language,
        priority: jobData.priority,
        status: jobData.status || 'draft',
        support_tier_id: 1, // Default to basic tier
      };

      const { data: newJob, error: insertError } = await supabase
        .from('jobs')
        .insert(jobPayload)
        .select('*, companies(*)')
        .single();

      if (insertError && insertError.code !== 'PGRST116') throw insertError;
      if (!newJob) throw new Error('Failed to create job');

      // Add to store
      addJob(newJob);
      return newJob;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateJob = async (jobId, jobData) => {
    try {
      setLoading(true);
      setError(null);

      if (!user?.id || !companyId) {
        throw new Error('User or company information is missing');
      }

      // Translate skills and location if job is in German
      let translatedSkills = jobData.skills_required;
      let translatedLocation = jobData.location;
      if (jobData.preferred_language === 'german') {
        translatedSkills = await translateToEnglish(jobData.skills_required);
        translatedLocation = await translateToEnglish(jobData.location);
      }

      // Format the salary range data
      const salaryRange = {
        type: jobData.salary_type,
        currency: jobData.salary_currency,
        period: jobData.salary_period,
        ...(jobData.salary_type === 'fixed' && { fixed: jobData.salary_fixed }),
        ...(jobData.salary_type === 'range' && {
          min: jobData.salary_min,
          max: jobData.salary_max
        })
      };

      // Prepare job data for update
      const jobPayload = {
        title: jobData.title,
        description: jobData.description,
        requirements: jobData.requirements,
        responsibilities: jobData.responsibilities,
        location: translatedLocation,
        is_remote: jobData.is_remote,
        is_hybrid: jobData.is_hybrid,
        job_type: jobData.job_type,
        experience_level: jobData.experience_level,
        salary_range: salaryRange,
        skills_required: translatedSkills,
        benefits: jobData.benefits,
        application_deadline: jobData.application_deadline,
        start_date: jobData.start_date,
        drivers_license: jobData.drivers_license,
        additional_questions: jobData.additional_questions,
        preferred_language: jobData.preferred_language,
        priority: jobData.priority,
        status: jobData.status,
        updated_at: new Date().toISOString()
      };

      const { data: updatedJob, error: updateError } = await supabase
        .from('jobs')
        .update(jobPayload)
        .eq('id', jobId)
        .eq('company_id', companyId)
        .select('*, companies(*)')
        .single();

      if (updateError && updateError.code !== 'PGRST116') throw updateError;
      if (!updatedJob) throw new Error('Job not found');

      // Update in store
      updateJobInStore(jobId, updatedJob);
      return updatedJob;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateJobStatus = async (jobId, status) => {
    try {
      setLoading(true);
      setError(null);

      if (!user?.id || !companyId) {
        throw new Error('User or company information is missing');
      }

      const { data: updatedJob, error: updateError } = await supabase
        .from('jobs')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId)
        .eq('company_id', companyId)
        .select('*, companies(*)')
        .single();

      if (updateError && updateError.code !== 'PGRST116') throw updateError;
      if (!updatedJob) throw new Error('Job not found');

      // Update in store
      updateJobInStore(jobId, updatedJob);
      return updatedJob;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteJob = async (jobId) => {
    try {
      setLoading(true);
      setError(null);

      if (!user?.id || !companyId) {
        throw new Error('User or company information is missing');
      }

      const { error: deleteError } = await supabase
        .from('jobs')
        .delete()
        .eq('id', jobId)
        .eq('company_id', companyId);

      if (deleteError) throw deleteError;

      // Remove from store
      removeJob(jobId);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getJobById = async (jobId) => {
    try {
      setLoading(true);
      setError(null);

      if (!user?.id || !companyId) {
        throw new Error('User or company information is missing');
      }

      const { data: job, error: fetchError } = await supabase
        .from('jobs')
        .select('*, companies(*)')
        .eq('id', jobId)
        .eq('company_id', companyId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;
      if (!job) throw new Error('Job not found');

      return job;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    // State
    loading: loading || storeLoading,
    error: error || storeError,
    jobs,
    
    // Actions
    listJobs,
    createJob,
    updateJob,
    updateJobStatus,
    deleteJob,
    getJobById
  };
}; 
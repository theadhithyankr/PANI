import { useState, useCallback } from 'react';
import { jobMatchingAgent } from '../agents/JobMatchingAgent';
import useGlobalStore from '../stores/globalStore';

/**
 * React hook for Job Matching Agent
 * Provides a clean interface to all agent functionalities
 */
export const useJobMatchingAgent = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const user = useGlobalStore((state) => state.user);
  const profile = useGlobalStore((state) => state.profile);

  /**
   * Fetch matching jobs for the current candidate
   * @param {Object} filters - Optional filters for job search
   * @returns {Promise<Array>} Array of matching jobs
   */
  const fetchMatchingJobs = useCallback(async (filters = {}) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    setLoading(true);
    setError(null);

    try {
      const jobs = await jobMatchingAgent.fetchMatchingJobs(user.id, filters);
      return jobs;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  /**
   * Fetch recommended candidates for a job
   * @param {string} jobId - The job ID
   * @param {Object} filters - Optional filters for candidate search
   * @returns {Promise<Array>} Array of recommended candidates
   */
  const fetchRecommendedCandidates = useCallback(async (jobId, filters = {}) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    setLoading(true);
    setError(null);

    try {
      const candidates = await jobMatchingAgent.fetchRecommendedCandidates(jobId, filters);
      return candidates;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  /**
   * Create a new job post
   * @param {Object} jobData - Job data to create
   * @returns {Promise<Object>} Created job object
   */
  const createJobPost = useCallback(async (jobData) => {
    if (!user?.id || !profile?.company?.id) {
      throw new Error('User or company information is missing');
    }

    setLoading(true);
    setError(null);

    try {
      const job = await jobMatchingAgent.createJobPost(jobData, user.id, profile.company.id);
      return job;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.id, profile?.company?.id]);

  /**
   * Schedule an interview for a candidate
   * @param {Object} interviewData - Interview scheduling data
   * @returns {Promise<Object>} Created interview object
   */
  const scheduleInterview = useCallback(async (interviewData) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    setLoading(true);
    setError(null);

    try {
      const interview = await jobMatchingAgent.scheduleInterview(interviewData, user.id);
      return interview;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  /**
   * Get agent cache statistics
   * @returns {Object} Cache statistics
   */
  const getCacheStats = useCallback(() => {
    return jobMatchingAgent.getCacheStats();
  }, []);

  /**
   * Clear agent cache
   */
  const clearCache = useCallback(() => {
    jobMatchingAgent.clearCache();
  }, []);

  return {
    // State
    loading,
    error,
    
    // Actions
    fetchMatchingJobs,
    fetchRecommendedCandidates,
    createJobPost,
    scheduleInterview,
    
    // Utilities
    getCacheStats,
    clearCache
  };
};

export default useJobMatchingAgent;

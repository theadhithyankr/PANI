import { useState, useCallback } from 'react';
import { candidateAIAgent } from '../agents/CandidateAIAgent';
import useGlobalStore from '../stores/globalStore';

/**
 * React hook for Candidate AI Agent
 * Provides AI-powered job matching and career assistance for candidates
 */
export const useCandidateAIAgent = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const user = useGlobalStore((state) => state.user);
  const profile = useGlobalStore((state) => state.profile);

  /**
   * Fetch AI-enhanced matching jobs for the current candidate
   * @param {Object} filters - Optional filters for job search
   * @param {string} aiPrompt - Optional AI prompt for personalized matching
   * @returns {Promise<Array>} Array of AI-recommended jobs
   */
  const fetchAIMatchingJobs = useCallback(async (filters = {}, aiPrompt = null) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    setLoading(true);
    setError(null);

    try {
      const jobs = await candidateAIAgent.fetchAIMatchingJobs(user.id, filters, aiPrompt);
      return jobs;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  /**
   * Get AI career coaching and advice
   * @param {string} query - Career question or request
   * @returns {Promise<Object>} AI career coaching response
   */
  const getCareerCoaching = useCallback(async (query) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    setLoading(true);
    setError(null);

    try {
      const coaching = await candidateAIAgent.getCareerCoaching(user.id, query);
      return coaching;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  /**
   * Analyze resume with AI
   * @param {string} resumeText - Resume text to analyze
   * @returns {Promise<Object>} AI resume analysis
   */
  const analyzeResume = useCallback(async (resumeText) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    setLoading(true);
    setError(null);

    try {
      const analysis = await candidateAIAgent.analyzeResume(user.id, resumeText);
      return analysis;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  /**
   * Prepare for interview with AI
   * @param {string} jobId - The job ID for interview preparation
   * @param {string} interviewType - Type of interview
   * @returns {Promise<Object>} AI interview preparation
   */
  const prepareForInterview = useCallback(async (jobId, interviewType = 'general') => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    setLoading(true);
    setError(null);

    try {
      const preparation = await candidateAIAgent.prepareForInterview(user.id, jobId, interviewType);
      return preparation;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  /**
   * Get salary negotiation guidance
   * @param {string} jobId - The job ID
   * @param {Object} offerDetails - Job offer details
   * @returns {Promise<Object>} AI salary negotiation guidance
   */
  const getSalaryNegotiationGuidance = useCallback(async (jobId, offerDetails) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    setLoading(true);
    setError(null);

    try {
      const guidance = await candidateAIAgent.getSalaryNegotiationGuidance(user.id, jobId, offerDetails);
      return guidance;
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
    return candidateAIAgent.getCacheStats();
  }, []);

  /**
   * Clear agent cache
   */
  const clearCache = useCallback(() => {
    candidateAIAgent.clearCache();
  }, []);

  return {
    // State
    loading,
    error,
    
    // Actions
    fetchAIMatchingJobs,
    getCareerCoaching,
    analyzeResume,
    prepareForInterview,
    getSalaryNegotiationGuidance,
    
    // Utilities
    getCacheStats,
    clearCache
  };
};

export default useCandidateAIAgent;

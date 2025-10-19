import { useState, useCallback } from 'react';
import { employerAIAgent } from '../agents/EmployerAIAgent';
import useGlobalStore from '../stores/globalStore';

/**
 * React hook for Employer AI Agent
 * Provides AI-powered candidate matching and job creation for employers
 */
export const useEmployerAIAgent = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const user = useGlobalStore((state) => state.user);
  const profile = useGlobalStore((state) => state.profile);

  /**
   * Fetch AI-enhanced candidate recommendations for a job
   * @param {string} jobId - The job ID
   * @param {Object} filters - Optional filters for candidate search
   * @param {string} aiPrompt - Optional AI prompt for personalized matching
   * @returns {Promise<Array>} Array of AI-recommended candidates
   */
  const fetchAICandidateRecommendations = useCallback(async (jobId, filters = {}, aiPrompt = null) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    setLoading(true);
    setError(null);

    try {
      const candidates = await employerAIAgent.fetchAICandidateRecommendations(jobId, filters, aiPrompt);
      return candidates;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  /**
   * Create AI-optimized job post
   * @param {Object} jobData - Job data to create
   * @param {string} aiPrompt - AI prompt for job creation
   * @returns {Promise<Object>} AI-optimized job post
   */
  const createAIJobPost = useCallback(async (jobData, aiPrompt = null) => {
    if (!user?.id || !profile?.company?.id) {
      throw new Error('User or company information is missing');
    }

    setLoading(true);
    setError(null);

    try {
      const result = await employerAIAgent.createAIJobPost(jobData, profile.company.id, user.id, aiPrompt);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.id, profile?.company?.id]);

  /**
   * Evaluate candidate with AI
   * @param {string} candidateId - The candidate's user ID
   * @param {string} jobId - The job ID
   * @param {string} evaluationType - Type of evaluation
   * @returns {Promise<Object>} AI candidate evaluation
   */
  const evaluateCandidate = useCallback(async (candidateId, jobId, evaluationType = 'overall') => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    setLoading(true);
    setError(null);

    try {
      const evaluation = await employerAIAgent.evaluateCandidate(candidateId, jobId, evaluationType);
      return evaluation;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  /**
   * Get market insights and compensation analysis
   * @param {string} jobTitle - Job title to analyze
   * @param {string} location - Location to analyze
   * @param {string} industry - Industry context
   * @returns {Promise<Object>} AI market insights
   */
  const getMarketInsights = useCallback(async (jobTitle, location, industry = null) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    setLoading(true);
    setError(null);

    try {
      const insights = await employerAIAgent.getMarketInsights(jobTitle, location, industry);
      return insights;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  /**
   * Analyze resume for hiring decision
   * @param {string} resumeText - Resume text to analyze
   * @param {string} jobId - Job ID for context
   * @returns {Promise<Object>} AI resume analysis
   */
  const analyzeResumeForHiring = useCallback(async (resumeText, jobId) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    setLoading(true);
    setError(null);

    try {
      const analysis = await employerAIAgent.analyzeResumeForHiring(resumeText, jobId);
      return analysis;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  /**
   * Prepare interview for employer
   * @param {string} candidateId - The candidate's user ID
   * @param {string} jobId - The job ID
   * @param {string} interviewType - Type of interview
   * @returns {Promise<Object>} AI interview preparation
   */
  const prepareInterviewForEmployer = useCallback(async (candidateId, jobId, interviewType = 'general') => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    setLoading(true);
    setError(null);

    try {
      const preparation = await employerAIAgent.prepareInterviewForEmployer(candidateId, jobId, interviewType);
      return preparation;
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
    return employerAIAgent.getCacheStats();
  }, []);

  /**
   * Clear agent cache
   */
  const clearCache = useCallback(() => {
    employerAIAgent.clearCache();
  }, []);

  return {
    // State
    loading,
    error,
    
    // Actions
    fetchAICandidateRecommendations,
    createAIJobPost,
    evaluateCandidate,
    getMarketInsights,
    analyzeResumeForHiring,
    prepareInterviewForEmployer,
    
    // Utilities
    getCacheStats,
    clearCache
  };
};

export default useEmployerAIAgent;

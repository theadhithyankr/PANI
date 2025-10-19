import { jobMatchingAgent } from '../agents/JobMatchingAgent';

/**
 * Job Matching Agent Service
 * Provides a service layer for the Job Matching Agent
 * Can be used for API endpoints, background jobs, or external integrations
 */
class JobMatchingAgentService {
  /**
   * Get matching jobs for a candidate via API
   * @param {string} candidateId - Candidate's user ID
   * @param {Object} filters - Search filters
   * @returns {Promise<Object>} API response with matching jobs
   */
  async getMatchingJobs(candidateId, filters = {}) {
    try {
      const jobs = await jobMatchingAgent.fetchMatchingJobs(candidateId, filters);
      
      return {
        success: true,
        data: jobs,
        count: jobs.length,
        message: `Found ${jobs.length} matching jobs`
      };
    } catch (error) {
      console.error('JobMatchingAgentService: Error getting matching jobs:', error);
      return {
        success: false,
        data: [],
        count: 0,
        error: error.message,
        message: 'Failed to fetch matching jobs'
      };
    }
  }

  /**
   * Get recommended candidates for a job via API
   * @param {string} jobId - Job ID
   * @param {Object} filters - Search filters
   * @returns {Promise<Object>} API response with recommended candidates
   */
  async getRecommendedCandidates(jobId, filters = {}) {
    try {
      const candidates = await jobMatchingAgent.fetchRecommendedCandidates(jobId, filters);
      
      return {
        success: true,
        data: candidates,
        count: candidates.length,
        message: `Found ${candidates.length} recommended candidates`
      };
    } catch (error) {
      console.error('JobMatchingAgentService: Error getting recommended candidates:', error);
      return {
        success: false,
        data: [],
        count: 0,
        error: error.message,
        message: 'Failed to fetch recommended candidates'
      };
    }
  }

  /**
   * Create a job post via API
   * @param {Object} jobData - Job data
   * @param {string} employerId - Employer's user ID
   * @param {string} companyId - Company ID
   * @returns {Promise<Object>} API response with created job
   */
  async createJobPost(jobData, employerId, companyId) {
    try {
      const job = await jobMatchingAgent.createJobPost(jobData, employerId, companyId);
      
      return {
        success: true,
        data: job,
        message: 'Job post created successfully'
      };
    } catch (error) {
      console.error('JobMatchingAgentService: Error creating job post:', error);
      return {
        success: false,
        data: null,
        error: error.message,
        message: 'Failed to create job post'
      };
    }
  }

  /**
   * Schedule an interview via API
   * @param {Object} interviewData - Interview data
   * @param {string} employerId - Employer's user ID
   * @returns {Promise<Object>} API response with scheduled interview
   */
  async scheduleInterview(interviewData, employerId) {
    try {
      const interview = await jobMatchingAgent.scheduleInterview(interviewData, employerId);
      
      return {
        success: true,
        data: interview,
        message: 'Interview scheduled successfully'
      };
    } catch (error) {
      console.error('JobMatchingAgentService: Error scheduling interview:', error);
      return {
        success: false,
        data: null,
        error: error.message,
        message: 'Failed to schedule interview'
      };
    }
  }

  /**
   * Get agent statistics
   * @returns {Object} Agent statistics
   */
  getAgentStats() {
    const cacheStats = jobMatchingAgent.getCacheStats();
    
    return {
      cache: cacheStats,
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    };
  }

  /**
   * Clear agent cache
   * @returns {Object} Operation result
   */
  clearAgentCache() {
    try {
      jobMatchingAgent.clearCache();
      return {
        success: true,
        message: 'Agent cache cleared successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to clear agent cache'
      };
    }
  }

  /**
   * Health check for the agent service
   * @returns {Object} Health status
   */
  healthCheck() {
    try {
      const stats = this.getAgentStats();
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        stats
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }

  /**
   * Batch process multiple job matches
   * @param {Array} candidateIds - Array of candidate IDs
   * @param {Object} filters - Search filters
   * @returns {Promise<Object>} Batch processing results
   */
  async batchProcessJobMatches(candidateIds, filters = {}) {
    try {
      const results = await Promise.allSettled(
        candidateIds.map(candidateId => 
          this.getMatchingJobs(candidateId, filters)
        )
      );

      const successful = results.filter(result => result.status === 'fulfilled' && result.value.success);
      const failed = results.filter(result => result.status === 'rejected' || !result.value.success);

      return {
        success: true,
        data: {
          total: candidateIds.length,
          successful: successful.length,
          failed: failed.length,
          results: results.map((result, index) => ({
            candidateId: candidateIds[index],
            success: result.status === 'fulfilled' && result.value.success,
            data: result.status === 'fulfilled' ? result.value.data : null,
            error: result.status === 'rejected' ? result.reason.message : result.value.error
          }))
        },
        message: `Batch processed ${candidateIds.length} candidates: ${successful.length} successful, ${failed.length} failed`
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error.message,
        message: 'Failed to batch process job matches'
      };
    }
  }

  /**
   * Batch process multiple candidate recommendations
   * @param {Array} jobIds - Array of job IDs
   * @param {Object} filters - Search filters
   * @returns {Promise<Object>} Batch processing results
   */
  async batchProcessCandidateRecommendations(jobIds, filters = {}) {
    try {
      const results = await Promise.allSettled(
        jobIds.map(jobId => 
          this.getRecommendedCandidates(jobId, filters)
        )
      );

      const successful = results.filter(result => result.status === 'fulfilled' && result.value.success);
      const failed = results.filter(result => result.status === 'rejected' || !result.value.success);

      return {
        success: true,
        data: {
          total: jobIds.length,
          successful: successful.length,
          failed: failed.length,
          results: results.map((result, index) => ({
            jobId: jobIds[index],
            success: result.status === 'fulfilled' && result.value.success,
            data: result.status === 'fulfilled' ? result.value.data : null,
            error: result.status === 'rejected' ? result.reason.message : result.value.error
          }))
        },
        message: `Batch processed ${jobIds.length} jobs: ${successful.length} successful, ${failed.length} failed`
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error.message,
        message: 'Failed to batch process candidate recommendations'
      };
    }
  }
}

// Export singleton instance
export const jobMatchingAgentService = new JobMatchingAgentService();
export default JobMatchingAgentService;

import { useEffect } from 'react';
import useApplicationsStore from '../../store/applicationsStore';

/**
 * Hook to access AI-matched jobs from the Zustand store
 * @param {string} applicantId - The user's profile ID
 * @param {Object} profile - The user's job seeker profile with preferences
 */
export const useAIMatchedJobs = (applicantId, profile = null) => {
  const {
    matchedJobs,
    loading,
    error,
    fetchMatchedJobs
  } = useApplicationsStore(state => ({
    matchedJobs: state.matchedJobs,
    loading: state.loading.matchedJobs,
    error: state.error.matchedJobs,
    fetchMatchedJobs: state.fetchMatchedJobs
  }));

  useEffect(() => {
    if (applicantId) {
      fetchMatchedJobs(applicantId, profile);
    }
  }, [applicantId, profile, fetchMatchedJobs]);

  return { matchedJobs, loading, error };
}; 
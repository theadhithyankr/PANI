import { useEffect } from 'react';
import useApplicationsStore from '../../store/applicationsStore';

/**
 * Hook to access job applications from the Zustand store
 * @param {string} applicantId - The user's profile ID
 * @param {Object} profile - The user's job seeker profile
 */
export const useJobApplications = (applicantId, profile = null) => {
  const {
    applications,
    loading,
    error,
    fetchApplications
  } = useApplicationsStore(state => ({
    applications: state.applications,
    loading: state.loading.applications,
    error: state.error.applications,
    fetchApplications: state.fetchApplications
  }));

  useEffect(() => {
    if (applicantId) {
      fetchApplications(applicantId, profile);
    }
  }, [applicantId, profile, fetchApplications]);

  return { applications, loading, error };
}; 
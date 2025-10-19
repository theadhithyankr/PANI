import { useEffect } from 'react';
import useApplicationsStore from '../../store/applicationsStore';

/**
 * Hook to access offers from the Zustand store
 * @param {string} applicantId - The user's profile ID
 */
export const useOffers = (applicantId) => {
  const {
    offers,
    loading,
    error,
    fetchOffers
  } = useApplicationsStore(state => ({
    offers: state.offers,
    loading: state.loading.offers,
    error: state.error.offers,
    fetchOffers: state.fetchOffers
  }));

  useEffect(() => {
    if (applicantId) {
      fetchOffers(applicantId);
    }
  }, [applicantId, fetchOffers]);

  return { offers, loading, error };
}; 
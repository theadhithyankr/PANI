import { useState, useEffect, useCallback } from 'react';
import { useCompanyStore } from '../../stores/companyStore';

export const useCompanyData = (companyId) => {
  const [localLoading, setLocalLoading] = useState(false);
  
  // Get state and actions from the company store using Zustand selectors
  const companies = useCompanyStore((state) => state.companies);
  const storeLoading = useCompanyStore((state) => state.loading);
  const storeError = useCompanyStore((state) => state.error);
  const fetchCompany = useCompanyStore((state) => state.fetchCompany);
  const getCompany = useCompanyStore((state) => state.getCompany);
  const clearError = useCompanyStore((state) => state.clearError);

  // Get company from cache using the store's state
  const company = companyId ? companies[companyId] : null;

  const fetchCompanyData = useCallback(async (id) => {
    if (!id) return;

    setLocalLoading(true);
    try {
      // Use the store's fetchCompany action
      await fetchCompany(id);
    } finally {
      setLocalLoading(false);
    }
  }, [fetchCompany]);

  // Fetch company data when companyId changes
  useEffect(() => {
    if (companyId && !company) {
      console.log('useCompanyData - Fetching company data for ID:', companyId);
      fetchCompanyData(companyId);
    }
  }, [companyId, company, fetchCompanyData]);

  // Log when company data changes
  useEffect(() => {
    if (company) {
      console.log('useCompanyData - Company data updated:', company);
    }
  }, [company]);

  return {
    company,
    loading: localLoading || storeLoading,
    error: storeError,
    refetch: () => fetchCompanyData(companyId),
    clearError,
    // Add store state for debugging
    storeState: {
      companies,
      loading: storeLoading,
      error: storeError
    }
  };
}; 
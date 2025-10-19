import { create } from 'zustand';
import { supabase } from '../clients/supabaseClient';

export const useCompanyStore = create((set, get) => ({
  // State
  companies: {}, // Cache companies by ID
  loading: false,
  error: null,

  // Actions
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  // Fetch company by ID with caching
  fetchCompany: async (companyId) => {
    if (!companyId) {
      return null;
    }

    const { companies } = get();
    
    // Return cached company if available
    if (companies[companyId]) {
      console.log('CompanyStore - Returning cached company:', companies[companyId]);
      return companies[companyId];
    }

    console.log('CompanyStore - Fetching company:', companyId);
    set({ loading: true, error: null });

    try {
      const { data, error: fetchError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          // No company found
          console.log('CompanyStore - No company found for ID:', companyId);
          set({ loading: false });
          return null;
        }
        throw fetchError;
      }

      console.log('CompanyStore - Fetched company data:', data);

      // Cache the company data
      set((state) => ({
        companies: {
          ...state.companies,
          [companyId]: data
        },
        loading: false
      }));

      return data;
    } catch (err) {
      console.error('Error fetching company data:', err);
      set({ error: err.message, loading: false });
      return null;
    }
  },

  // Get company from cache or fetch if not available
  getCompany: async (companyId) => {
    if (!companyId) {
      return null;
    }

    const { companies } = get();
    
    // Return cached company if available
    if (companies[companyId]) {
      return companies[companyId];
    }

    // Fetch company if not in cache
    return await get().fetchCompany(companyId);
  },

  // Update company in cache
  updateCompany: (companyId, updates) => {
    set((state) => ({
      companies: {
        ...state.companies,
        [companyId]: {
          ...state.companies[companyId],
          ...updates
        }
      }
    }));
  },

  // Clear company cache
  clearCompanyCache: (companyId = null) => {
    if (companyId) {
      set((state) => {
        const newCompanies = { ...state.companies };
        delete newCompanies[companyId];
        return { companies: newCompanies };
      });
    } else {
      set({ companies: {} });
    }
  },

  // Clear error
  clearError: () => set({ error: null }),

  // Get all cached companies (for debugging)
  getCachedCompanies: () => {
    const { companies } = get();
    console.log('CompanyStore - All cached companies:', companies);
    return companies;
  },

  // Get company count (for debugging)
  getCompanyCount: () => {
    const { companies } = get();
    return Object.keys(companies).length;
  },
})); 
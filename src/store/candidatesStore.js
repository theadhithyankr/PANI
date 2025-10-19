import { create } from 'zustand';
import { supabase } from '../clients/supabaseClient';
import useShortlistStore from './shortlistStore';

const useCandidatesStore = create((set, get) => ({
  // State
  candidates: [],
  selectedCandidate: null,
  loading: false,
  error: null,
  candidateMatchScores: {},
  filters: {
    searchTerm: '',
    debouncedSearchTerm: '',
    statusFilter: 'all',
    activeJobTab: 'all'
  },
  selectedCandidates: [],
  showBulkActions: false,
  showDetailPanel: false,
  showSchedulingModal: false,
  showJobSelectionModal: false,
  schedulingCandidate: null,
  shortlistingCandidate: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    hasMore: false
  },

  // Actions
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setCandidates: (candidates) => set({ candidates }),
  
  // Filter actions
  setSearchTerm: (searchTerm) => 
    set(state => ({
      filters: { ...state.filters, searchTerm }
    })),
  
  setDebouncedSearchTerm: (debouncedSearchTerm) => 
    set(state => ({
      filters: { ...state.filters, debouncedSearchTerm }
    })),
  
  setStatusFilter: (statusFilter) => 
    set(state => ({
      filters: { ...state.filters, statusFilter }
    })),
  
  setActiveJobTab: (activeJobTab) => 
    set(state => ({
      filters: { ...state.filters, activeJobTab }
    })),
  
  clearFilters: () => 
    set(state => ({
      filters: {
        searchTerm: '',
        debouncedSearchTerm: '',
        statusFilter: 'all',
        activeJobTab: 'all'
      }
    })),

  // Selection actions
  toggleCandidateSelection: (candidateId) => 
    set(state => {
      const isSelected = state.selectedCandidates.includes(candidateId);
      const newSelected = isSelected
        ? state.selectedCandidates.filter(id => id !== candidateId)
        : [...state.selectedCandidates, candidateId];
      
      return {
        selectedCandidates: newSelected,
        showBulkActions: newSelected.length > 0
      };
    }),
  
  clearSelection: () => 
    set({ 
      selectedCandidates: [],
      showBulkActions: false
    }),

  // UI state actions
  setShowBulkActions: (show) => set({ showBulkActions: show }),
  setShowDetailPanel: (show) => set({ showDetailPanel: show }),
  setSelectedCandidate: (candidate) => set({ selectedCandidate: candidate }),
  setShowSchedulingModal: (show) => set({ showSchedulingModal: show }),
  setShowJobSelectionModal: (show) => set({ showJobSelectionModal: show }),
  setSchedulingCandidate: (candidate) => set({ schedulingCandidate: candidate }),
  setShortlistingCandidate: (candidate) => set({ shortlistingCandidate: candidate }),

  setCandidateMatchScores: (scores) => set({ candidateMatchScores: scores }),

  setPagination: (pagination) => 
    set(state => ({
      pagination: { ...state.pagination, ...pagination }
    })),

  // Fetch candidates using new structure
  fetchCandidates: async (filters = {}) => {
    const currentFilters = { ...get().filters, ...filters };
    
    get().setLoading(true);
    get().setError(null);

    try {
      let query = supabase
        .from('job_seeker_profiles')
        .select(`
          id,
          full_name,
          email,
          phone,
          avatar_url,
          current_location,
          experience_years,
          skills,
          preferred_job_types,
          preferred_locations,
          target_salary_range,
          availability_status,
          created_at,
          updated_at,
          profiles:id (
            id,
            user_type,
            full_name,
            avatar_url
          )
        `)
        .eq('profiles.user_type', 'job_seeker')
        .order('created_at', { ascending: false });

      // Apply filters
      if (currentFilters.searchTerm) {
        query = query.or(`full_name.ilike.%${currentFilters.searchTerm}%,skills.cs.{${currentFilters.searchTerm}}`);
      }

      if (currentFilters.experience && currentFilters.experience !== 'all') {
        const experienceRanges = {
          'entry': { min: 0, max: 2 },
          'mid': { min: 2, max: 5 },
          'senior': { min: 5, max: 8 },
          'lead': { min: 8, max: 12 },
          'executive': { min: 12, max: 50 }
        };
        
        const range = experienceRanges[currentFilters.experience];
        if (range) {
          query = query
            .gte('experience_years', range.min)
            .lte('experience_years', range.max);
        }
      }

      if (currentFilters.location && currentFilters.location !== 'all') {
        query = query.ilike('current_location', `%${currentFilters.location}%`);
      }

      // Apply pagination
      const { page, limit } = get().pagination;
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      // Transform data to match expected format
      const transformedCandidates = (data || []).map(candidate => ({
        id: candidate.id,
        name: candidate.full_name,
        email: candidate.email,
        phone: candidate.phone,
        avatar: candidate.avatar_url,
        location: candidate.current_location,
        experience: candidate.experience_years,
        skills: candidate.skills || [],
        preferredJobTypes: candidate.preferred_job_types || [],
        preferredLocations: candidate.preferred_locations || [],
        targetSalary: candidate.target_salary_range,
        availability: candidate.availability_status,
        createdAt: candidate.created_at,
        updatedAt: candidate.updated_at,
        profile: candidate.profiles ? {
          id: candidate.profiles.id,
          userType: candidate.profiles.user_type,
          fullName: candidate.profiles.full_name,
          avatarUrl: candidate.profiles.avatar_url
        } : null
      }));

      set({ 
        candidates: transformedCandidates,
        pagination: {
          ...get().pagination,
          total: count || 0,
          hasMore: (count || 0) > page * limit
        }
      });

    } catch (err) {
      console.error('Error fetching candidates:', err);
      get().setError(err.message || 'Failed to fetch candidates');
      set({ candidates: [] });
    } finally {
      get().setLoading(false);
    }
  },

  // Fetch single candidate by ID
  fetchCandidateById: async (candidateId) => {
    if (!candidateId) return;

    get().setLoading(true);
    get().setError(null);

    try {
      const { data, error } = await supabase
        .from('job_seeker_profiles')
        .select(`
          id,
          full_name,
          email,
          phone,
          avatar_url,
          current_location,
          experience_years,
          skills,
          preferred_job_types,
          preferred_locations,
          target_salary_range,
          availability_status,
          created_at,
          updated_at,
          profiles:id (
            id,
            user_type,
            full_name,
            avatar_url
          )
        `)
        .eq('id', candidateId)
        .single();

      if (error) throw error;

      // Transform data to match expected format
      const transformedCandidate = {
        id: data.id,
        name: data.full_name,
        email: data.email,
        phone: data.phone,
        avatar: data.avatar_url,
        location: data.current_location,
        experience: data.experience_years,
        skills: data.skills || [],
        preferredJobTypes: data.preferred_job_types || [],
        preferredLocations: data.preferred_locations || [],
        targetSalary: data.target_salary_range,
        availability: data.availability_status,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        profile: data.profiles ? {
          id: data.profiles.id,
          userType: data.profiles.user_type,
          fullName: data.profiles.full_name,
          avatarUrl: data.profiles.avatar_url
        } : null
      };

      set({ selectedCandidate: transformedCandidate });
      return transformedCandidate;
    } catch (err) {
      console.error('Error fetching candidate:', err);
      get().setError(err.message || 'Failed to fetch candidate');
      set({ selectedCandidate: null });
      return null;
    } finally {
      get().setLoading(false);
    }
  },

  // Clear all data
  clearData: () => {
    set({
      candidates: [],
      selectedCandidate: null,
      loading: false,
      error: null,
      filters: {
        searchTerm: '',
        debouncedSearchTerm: '',
        statusFilter: 'all',
        activeJobTab: 'all'
      },
      selectedCandidates: [],
      showBulkActions: false,
      showDetailPanel: false,
      showSchedulingModal: false,
      showJobSelectionModal: false,
      schedulingCandidate: null,
      shortlistingCandidate: null,
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        hasMore: false
      }
    });
  },

  // Computed values
  getFilteredCandidates: () => {
    const state = get();
    const { candidates, filters } = state;
    
    if (!candidates || candidates.length === 0) return [];
    
    let filtered = [...candidates];
    
    // Filter by selected job tab
    if (filters.activeJobTab && filters.activeJobTab !== 'all') {
      const selectedJobId = String(filters.activeJobTab);
      filtered = filtered.filter(candidate => {
        // Check if candidate has a bestJobMatch with matching ID
        return candidate.bestJobMatch && String(candidate.bestJobMatch.id) === selectedJobId;
      });
    }
    
    // Filter by search term
    if (filters.debouncedSearchTerm) {
      const searchTerm = filters.debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(candidate => {
        // Search in name, headline, skills, and location
        const nameMatch = candidate.name?.toLowerCase().includes(searchTerm);
        const headlineMatch = candidate.headline?.toLowerCase().includes(searchTerm);
        const locationMatch = candidate.current_location?.toLowerCase().includes(searchTerm);
        
        // Search in skills array
        const skillsMatch = candidate.skills && Array.isArray(candidate.skills) 
          ? candidate.skills.some(skill => 
              typeof skill === 'string' && skill.toLowerCase().includes(searchTerm)
            )
          : false;
        
        // Search in summary
        const summaryMatch = candidate.summary?.toLowerCase().includes(searchTerm);
        
        return nameMatch || headlineMatch || locationMatch || skillsMatch || summaryMatch;
      });
    }
    
    // Filter by status using shortlist store
    if (filters.statusFilter && filters.statusFilter !== 'all') {
      const {
        isApplicationShortlisted,
        isApplicationRejected,
        getCandidateStatus
      } = useShortlistStore.getState();

      const matchesStatus = (candidateId) => {
        switch (filters.statusFilter) {
          case 'shortlisted':
            return !!isApplicationShortlisted?.(candidateId);
          case 'rejected':
            return !!isApplicationRejected?.(candidateId);
          case 'new': {
            const status = getCandidateStatus?.(candidateId);
            return status === 'new';
          }
          case 'interviewing': {
            // TODO: If interviewing status is tracked elsewhere, integrate here.
            // For now, return false as this status is not implemented
            return false;
          }
          default:
            return true;
        }
      };

      filtered = filtered.filter(c => matchesStatus(c.id));
    }
    
    return filtered;
  },
  
  getPinnedCandidates: () => {
    const state = get();
    const filteredCandidates = state.getFilteredCandidates();
    
    // Return candidates with high match scores or specific criteria
    // For now, return candidates with matchScore >= 80 or specific pinned status
    return filteredCandidates.filter(candidate => 
      (candidate.matchScore && candidate.matchScore >= 80) || candidate.isPinned === true
    );
  },
  
  getRegularCandidates: () => {
    const state = get();
    const filteredCandidates = state.getFilteredCandidates();
    const pinnedCandidates = state.getPinnedCandidates();
    
    // Return filtered candidates excluding pinned ones
    const pinnedIds = new Set(pinnedCandidates.map(c => c.id));
    return filteredCandidates.filter(candidate => !pinnedIds.has(candidate.id));
  },

  // Reset store to initial state
  reset: () => {
    set({
      candidates: [],
      selectedCandidate: null,
      loading: false,
      error: null,
      filters: {
        searchTerm: '',
        debouncedSearchTerm: '',
        statusFilter: 'all',
        activeJobTab: 'all'
      },
      selectedCandidates: [],
      showBulkActions: false,
      showDetailPanel: false,
      showSchedulingModal: false,
      showJobSelectionModal: false,
      schedulingCandidate: null,
      shortlistingCandidate: null,
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        hasMore: false
      }
    });
  }
}));

export default useCandidatesStore;
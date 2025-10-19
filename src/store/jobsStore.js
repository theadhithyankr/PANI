import { create } from 'zustand';
import { createClient } from '@supabase/supabase-js';
import { useCompanyStore } from '../stores/companyStore';
import { computeUnifiedMatchScore } from '../utils/unifiedMatchScore';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const useJobsStore = create((set, get) => ({
  // State
  jobs: [],
  filteredJobs: [],
  savedJobs: [],
  appliedJobs: [],
  loading: false,
  error: null,
  userSkills: [], // Add user skills state
  userProfile: null, // Add user profile state for comprehensive matching
  filterOptions: {
    locations: [],
    jobTypes: [],
    salaryRanges: [
      { value: 'all', label: 'All Salaries' },
      { value: '0-40k', label: '€0 - €40,000' },
      { value: '40k-60k', label: '€40,000 - €60,000' },
      { value: '60k-80k', label: '€60,000 - €80,000' },
      { value: '80k+', label: '€80,000+' },
    ],
    experienceLevels: [
      { value: 'all', label: 'All Experience Levels' },
      { value: 'entry', label: 'Entry Level (0-2 years)' },
      { value: 'mid', label: 'Mid Level (2-5 years)' },
      { value: 'senior', label: 'Senior Level (5-8 years)' },
      { value: 'lead', label: 'Lead/Principal (8+ years)' },
      { value: 'executive', label: 'Executive Level' }
    ],
    languages: [
      { value: 'all', label: 'All Languages' },
      { value: 'german', label: 'German' },
      { value: 'english', label: 'English' },
      { value: 'french', label: 'French' },
      { value: 'spanish', label: 'Spanish' },
      { value: 'italian', label: 'Italian' },
      { value: 'dutch', label: 'Dutch' }
    ]
  },
  filterOptionsLoading: false,
  filters: {
    searchTerm: '',
    location: 'all',
    jobType: 'all',
    salary: 'all',
    experience: 'all',
    language: 'all',
    date: null,
    company: null
  },
  sortBy: 'match-score', // Add sortBy state
  viewMode: 'grid', // 'grid' or 'list'
  selectedJob: null,
  showJobDetail: false,
  showApplicationModal: false,
  applicationJob: null,

  // Actions
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setViewMode: (viewMode) => set({ viewMode }),
  setSelectedJob: (job) => set({ selectedJob: job }),
  setShowJobDetail: (show) => set({ showJobDetail: show }),
  setShowApplicationModal: (show) => set({ showApplicationModal: show }),
  setApplicationJob: (job) => set({ applicationJob: job }),

  // Fetch user profile data for comprehensive matching
  fetchUserProfile: async (userId) => {
    if (!userId) return null;
    
    try {
      const { data, error } = await supabase
        .from('job_seeker_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      set({ userProfile: data });
      return data;
    } catch (err) {
      console.error('Error fetching user profile:', err);
      return null;
    }
  },

  // Fetch user skills from job_seeker_profiles
  fetchUserSkills: async (userId) => {
    if (!userId) return [];
    
    try {
      const { data, error } = await supabase
        .from('job_seeker_profiles')
        .select('skills')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user skills:', error);
        return [];
      }

      const skills = data?.skills || [];
      set({ userSkills: skills });
      return skills;
    } catch (err) {
      console.error('Error fetching user skills:', err);
      return [];
    }
  },

  // Calculate comprehensive match score for a job (0-100) using unified utility
  calculateMatchScore: (job, userProfile, userSkills) => {
    const candidate = {
      ...userProfile,
      skills: userSkills && userSkills.length ? userSkills : (userProfile?.skills || [])
    };
    const score = computeUnifiedMatchScore({ candidate, job });
    return Math.max(0, Math.min(100, Math.round(score)));
  },

  // Filter actions
  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters }
    }));
    get().applyFilters();
  },

  // Sort actions
  setSortBy: (sortBy) => {
    set({ sortBy });
    get().applyFilters();
  },

  // Fetch jobs from API
  fetchJobs: async (filters = {}, userId = null) => {
    set({ loading: true, error: null });
    try {
      // First, fetch user profile and skills if userId is provided
      let userSkills = [];
      let userProfile = null;
      if (userId) {
        userSkills = await get().fetchUserSkills(userId);
        userProfile = await get().fetchUserProfile(userId);
      }

      let query = supabase
        .from('jobs')
        .select(`*, companies(*)`)
        .eq('status', 'active');

      // Apply filters
      if (filters.date) {
        const today = new Date();
        let fromDate = new Date();
        
        switch (filters.date) {
          case 'today':
            fromDate.setDate(today.getDate() - 1);
            break;
          case 'week':
            fromDate.setDate(today.getDate() - 7);
            break;
          case 'month':
            fromDate.setMonth(today.getMonth() - 1);
            break;
          default:
            break;
        }
        
        query = query.gte('created_at', fromDate.toISOString());
      }

      if (filters.jobType && filters.jobType !== 'all') {
        query = query.eq('job_type', filters.jobType);
      }

      if (filters.company) {
        query = query.ilike('companies.name', `%${filters.company}%`);
      }

      if (filters.experience && filters.experience !== 'all') {
        query = query.eq('experience_level', filters.experience);
      }

      if (filters.language && filters.language !== 'all') {
        query = query.eq('preferred_language', filters.language);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Cache company data in the company store
      const companyStore = useCompanyStore.getState();
      if (data) {
        console.log('JobsStore - Caching company data for jobs:', data.length);
        data.forEach(job => {
          if (job.companies && job.company_id) {
            console.log('JobsStore - Caching company:', job.company_id, job.companies);
            companyStore.updateCompany(job.company_id, job.companies);
          }
        });
        console.log('JobsStore - Total cached companies after update:', companyStore.getCompanyCount());
      }

      // Calculate match scores for all jobs
      const jobsWithScores = (data || []).map(job => ({
        ...job,
        matchScore: get().calculateMatchScore(job, userProfile, userSkills)
      }));

      set({ jobs: jobsWithScores, loading: false });
      get().applyFilters();
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  // Apply filters to jobs
  applyFilters: () => {
    const { jobs, filters, sortBy } = get();
    
    const filtered = jobs.filter(job => {
      const matchesSearch = !filters.searchTerm || 
        job.title.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        job.companies?.name?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        job.company?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        job.skills_required?.some(skill => 
          skill.toLowerCase().includes(filters.searchTerm.toLowerCase())
        );
      
      const matchesLocation = filters.location === 'all' || 
        job.location?.toLowerCase().includes(filters.location.toLowerCase());
      
      const matchesJobType = filters.jobType === 'all' || 
        job.job_type?.toLowerCase().includes(filters.jobType.toLowerCase());
      
      const matchesExperience = filters.experience === 'all' || 
        job.experience_level === filters.experience;
      
      const matchesLanguage = filters.language === 'all' || 
        job.preferred_language === filters.language;
      
      // Salary filtering
      let matchesSalary = true;
      if (filters.salary && filters.salary !== 'all') {
        // Map selected filter to numeric range
        const mapFilterToRange = (filterValue) => {
          switch (filterValue) {
            case '0-40k':
              return { min: 0, max: 40000 };
            case '40k-60k':
              return { min: 40000, max: 60000 };
            case '60k-80k':
              return { min: 60000, max: 80000 };
            case '80k+':
              return { min: 80000, max: Number.POSITIVE_INFINITY };
            default:
              return null;
          }
        };

        const selectedRange = mapFilterToRange(filters.salary);

        if (selectedRange) {
          const jobMin = get().getSalaryValue(job.salary_range, 'min');
          const jobMax = get().getSalaryValue(job.salary_range, 'max');

          if (jobMin === 0 && jobMax === 0) {
            // If job has no salary info, treat as not matching a specific salary filter
            matchesSalary = false;
          } else {
            const overlapMin = Math.max(jobMin || 0, selectedRange.min);
            const overlapMax = Math.min(
              jobMax || jobMin || 0,
              selectedRange.max
            );
            matchesSalary = overlapMax >= overlapMin;
          }
        }
      }
      
      return matchesSearch && matchesLocation && matchesJobType && matchesExperience && matchesLanguage && matchesSalary;
    });

    // Sort based on sortBy criteria
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'match-score':
          return (b.matchScore || 0) - (a.matchScore || 0);
        
        case 'relevance':
          // Sort by relevance (combination of match score and recency)
          const aRelevance = (a.matchScore || 0) * 0.7 + (a.created_at ? new Date(a.created_at).getTime() : 0) * 0.3;
          const bRelevance = (b.matchScore || 0) * 0.7 + (b.created_at ? new Date(b.created_at).getTime() : 0) * 0.3;
          return bRelevance - aRelevance;
        
        case 'newest':
          return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        
        case 'salary-high':
          const aSalary = get().getSalaryValue(a.salary_range, 'max');
          const bSalary = get().getSalaryValue(b.salary_range, 'max');
          return bSalary - aSalary;
        
        case 'salary-low':
          const aSalaryMin = get().getSalaryValue(a.salary_range, 'min');
          const bSalaryMin = get().getSalaryValue(b.salary_range, 'min');
          return aSalaryMin - bSalaryMin;
        
        default:
          return (b.matchScore || 0) - (a.matchScore || 0);
      }
    });

    set({ filteredJobs: filtered });
  },

  // Helper function to extract salary value for sorting
  getSalaryValue: (salaryRange, type = 'max') => {
    if (!salaryRange) return 0;
    
    if (typeof salaryRange === 'string') {
      // Try to extract numbers from string like "€65,000 - €85,000"
      const numbers = salaryRange.match(/\d+/g);
      if (numbers && numbers.length >= 2) {
        return type === 'max' ? parseInt(numbers[1]) : parseInt(numbers[0]);
      }
      return 0;
    }
    
    if (typeof salaryRange === 'object') {
      if (type === 'max' && salaryRange.max) {
        return typeof salaryRange.max === 'string' ? parseInt(salaryRange.max.replace(/[^\d]/g, '')) : salaryRange.max;
      }
      if (type === 'min' && salaryRange.min) {
        return typeof salaryRange.min === 'string' ? parseInt(salaryRange.min.replace(/[^\d]/g, '')) : salaryRange.min;
      }
      if (salaryRange.fixed) {
        return typeof salaryRange.fixed === 'string' ? parseInt(salaryRange.fixed.replace(/[^\d]/g, '')) : salaryRange.fixed;
      }
    }
    
    return 0;
  },

  // Saved jobs actions
  toggleSaveJob: (jobId) => {
    set((state) => {
      const isSaved = state.savedJobs.includes(jobId);
      const newSavedJobs = isSaved
        ? state.savedJobs.filter(id => id !== jobId)
        : [...state.savedJobs, jobId];
      
      return { savedJobs: newSavedJobs };
    });
  },

  // Applied jobs actions
  addAppliedJob: (jobId) => {
    set((state) => ({
      appliedJobs: [...state.appliedJobs, jobId]
    }));
  },

  // Job application actions
  submitApplication: async (applicationData) => {
    try {
      const { error } = await supabase
        .from('job_applications_v2')
        .insert([applicationData]);

      if (error) {
        // Handle specific error cases
        if (error.code === '23505') {
          throw new Error('You have already applied for this job');
        } else if (error.code === '23503') {
          throw new Error('Invalid job or candidate reference');
        }
        throw error;
      }

      get().addAppliedJob(applicationData.jobId);
      set({ showApplicationModal: false, applicationJob: null });
      
      return { success: true };
    } catch (err) {
      set({ error: err.message });
      return { success: false, error: err.message };
    }
  },

  // Clear all filters
  clearFilters: () => {
    set({
      filters: {
        searchTerm: '',
        location: 'all',
        jobType: 'all',
        salary: 'all',
        experience: 'all',
        language: 'all',
        date: null,
        company: null
      }
    });
    get().applyFilters();
  },

  // Helper functions for match score calculations
  getExperienceMatchScore: (jobExperienceLevel, userExperienceYears) => {
    if (!jobExperienceLevel || userExperienceYears === null) return 0;
    
    const experienceRanges = {
      'entry': { min: 0, max: 2 },
      'mid': { min: 2, max: 5 },
      'senior': { min: 5, max: 8 },
      'lead': { min: 8, max: 12 },
      'executive': { min: 12, max: 50 }
    };
    
    const range = experienceRanges[jobExperienceLevel];
    if (!range) return 50; // Default score for unknown levels
    
    if (userExperienceYears >= range.min && userExperienceYears <= range.max) {
      return 100; // Perfect match
    } else if (userExperienceYears >= range.min - 1 && userExperienceYears <= range.max + 1) {
      return 80; // Close match
    } else if (userExperienceYears >= range.min - 2 && userExperienceYears <= range.max + 2) {
      return 60; // Acceptable match
    } else {
      return 20; // Poor match
    }
  },

  getLanguageMatchScore: (jobPreferredLanguage, userLanguages) => {
    if (!jobPreferredLanguage || !userLanguages || userLanguages.length === 0) return 0;
    
    const userLanguage = userLanguages.find(lang => 
      lang.language?.toLowerCase() === jobPreferredLanguage.toLowerCase()
    );
    
    if (!userLanguage) return 0;
    
    // Score based on proficiency level
    const proficiencyScores = {
      'native': 100,
      'fluent': 95,
      'advanced': 85,
      'intermediate': 70,
      'basic': 50,
      'beginner': 30
    };
    
    return proficiencyScores[userLanguage.proficiency?.toLowerCase()] || 50;
  },

  getLocationMatchScore: (jobLocation, userCurrentLocation, userPreferredLocations) => {
    if (!jobLocation) return 0;
    
    const jobLocationLower = jobLocation.toLowerCase();
    
    // Check if job location matches user's current location
    if (userCurrentLocation && userCurrentLocation.toLowerCase().includes(jobLocationLower)) {
      return 100;
    }
    
    // Check if job location matches user's preferred locations
    if (userPreferredLocations && userPreferredLocations.length > 0) {
      const preferredMatch = userPreferredLocations.some(location => 
        location.toLowerCase().includes(jobLocationLower) || 
        jobLocationLower.includes(location.toLowerCase())
      );
      if (preferredMatch) return 80;
    }
    
    // Check for remote/hybrid work
    if (jobLocation.toLowerCase().includes('remote') || jobLocation.toLowerCase().includes('hybrid')) {
      return 60;
    }
    
    return 20; // Default low score for location mismatch
  },

  getSalaryMatchScore: (jobSalaryRange, userTargetSalary) => {
    if (!jobSalaryRange || !userTargetSalary) return 50;
    
    const jobMin = jobSalaryRange.min || 0;
    const jobMax = jobSalaryRange.max || 0;
    const userMin = userTargetSalary.min || 0;
    const userMax = userTargetSalary.max || 0;
    
    // If user hasn't specified salary range, return neutral score
    if (userMin === 0 && userMax === 0) return 50;
    
    // Calculate overlap
    const overlapMin = Math.max(jobMin, userMin);
    const overlapMax = Math.min(jobMax, userMax);
    
    if (overlapMax < overlapMin) {
      // No overlap - calculate how far apart they are
      const gap = Math.abs(overlapMin - overlapMax);
      const avgJobSalary = (jobMin + jobMax) / 2;
      const avgUserSalary = (userMin + userMax) / 2;
      const salaryDifference = Math.abs(avgJobSalary - avgUserSalary);
      
      if (salaryDifference <= avgJobSalary * 0.1) return 70; // Within 10%
      if (salaryDifference <= avgJobSalary * 0.2) return 50; // Within 20%
      return 30; // More than 20% difference
    }
    
    // Calculate overlap percentage
    const overlap = overlapMax - overlapMin;
    const jobRange = jobMax - jobMin;
    const userRange = userMax - userMin;
    
    if (jobRange === 0 || userRange === 0) return 50;
    
    const overlapPercentage = Math.min(overlap / jobRange, overlap / userRange);
    return Math.round(overlapPercentage * 100);
  },

  // Get job by ID
  getJobById: (jobId) => {
    return get().jobs.find(job => job.id === jobId);
  },

  // Get saved jobs
  getSavedJobs: () => {
    return get().jobs.filter(job => get().savedJobs.includes(job.id));
  },

  // Get applied jobs
  getAppliedJobs: () => {
    return get().jobs.filter(job => get().appliedJobs.includes(job.id));
  },

  // Get job statistics
  getJobStats: () => {
    const { jobs, savedJobs, appliedJobs } = get();
    return {
      totalJobs: jobs.length,
      remoteJobs: jobs.filter(job => job.remote === 'Remote').length,
      savedJobs: savedJobs.length,
      appliedJobs: appliedJobs.length
    };
  },

  // Fetch unique locations from jobs table
  fetchLocations: async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('location')
        .eq('status', 'active')
        .not('location', 'is', null)
        .not('location', 'eq', '');

      if (error) {
        console.error('Error fetching locations:', error);
        return [];
      }

      // Extract unique locations and format them
      const normalizedLocations = data.map(job => job.location.trim().toLowerCase());
      const uniqueLocations = [...new Set(normalizedLocations)].sort();
      
      console.log('Raw locations:', data.map(job => job.location));
      console.log('Normalized locations:', normalizedLocations);
      console.log('Unique locations:', uniqueLocations);
      
      const locationOptions = [
        { value: 'all', label: 'All Locations' },
        ...uniqueLocations.map(location => ({
          value: location,
          label: location.charAt(0).toUpperCase() + location.slice(1)
        }))
      ];

      set(state => ({
        filterOptions: {
          ...state.filterOptions,
          locations: locationOptions
        }
      }));

      return locationOptions;
    } catch (err) {
      console.error('Error fetching locations:', err);
      return [];
    }
  },

  // Fetch unique job types from jobs table
  fetchJobTypes: async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('job_type')
        .eq('status', 'active')
        .not('job_type', 'is', null)
        .not('job_type', 'eq', '');

      if (error) {
        console.error('Error fetching job types:', error);
        return [];
      }

      // Extract unique job types and format them
      const normalizedJobTypes = data.map(job => job.job_type.trim().toLowerCase());
      const uniqueJobTypes = [...new Set(normalizedJobTypes)].sort();
      
      console.log('Raw job types:', data.map(job => job.job_type));
      console.log('Normalized job types:', normalizedJobTypes);
      console.log('Unique job types:', uniqueJobTypes);
      
      const jobTypeOptions = [
        { value: 'all', label: 'All Types' },
        ...uniqueJobTypes.map(jobType => ({
          value: jobType,
          label: jobType.charAt(0).toUpperCase() + jobType.slice(1).replace('_', ' ')
        }))
      ];

      set(state => ({
        filterOptions: {
          ...state.filterOptions,
          jobTypes: jobTypeOptions
        }
      }));

      return jobTypeOptions;
    } catch (err) {
      console.error('Error fetching job types:', err);
      return [];
    }
  },

  // Fetch all filter options
  fetchFilterOptions: async () => {
    set({ filterOptionsLoading: true });
    try {
      await Promise.all([
        get().fetchLocations(),
        get().fetchJobTypes()
      ]);
    } catch (err) {
      console.error('Error fetching filter options:', err);
    } finally {
      set({ filterOptionsLoading: false });
    }
  }
}));

export default useJobsStore; 
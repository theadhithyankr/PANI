import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useShortlistStore = create(
  persist(
    (set, get) => ({
      // State
      shortlistedApplications: [], // Array of shortlisted application objects
      shortlistsByJob: {}, // Organized by job ID for quick access
      rejectedApplications: [], // Array of rejected application objects
      rejectedByJob: {}, // Organized by job ID for quick access
      loading: {
        add: false,
        remove: false,
        bulk: false
      },
      error: {
        add: null,
        remove: null,
        bulk: null
      },
      filters: {
        searchTerm: '',
        jobId: 'all',
        dateRange: 'all',
        skillsFilter: [],
        experienceLevel: 'all'
      },
      selectedApplications: [], // For bulk operations
      showShortlistModal: false,
      showBulkActions: false,

      // Loading actions
      setLoading: (key, loading) => 
        set(state => ({
          loading: { ...state.loading, [key]: loading }
        })),

      setError: (key, error) => 
        set(state => ({
          error: { ...state.error, [key]: error }
        })),

      // Filter actions
      setFilters: (filters) => 
        set(state => ({
          filters: { ...state.filters, ...filters }
        })),

      // Selection actions
      setSelectedApplications: (applications) => 
        set({ selectedApplications: applications }),

      toggleApplicationSelection: (applicationId) => 
        set(state => ({
          selectedApplications: state.selectedApplications.includes(applicationId)
            ? state.selectedApplications.filter(id => id !== applicationId)
            : [...state.selectedApplications, applicationId]
        })),

      selectAllApplications: (applicationIds) => 
        set({ selectedApplications: applicationIds }),

      clearSelection: () => 
        set({ selectedApplications: [] }),

      // Modal actions
      setShowShortlistModal: (show) => 
        set({ showShortlistModal: show }),

      setShowBulkActions: (show) => 
        set({ showBulkActions: show }),

      // Add application to shortlist
      addToShortlist: (applicationData) => {
        if (!applicationData || !applicationData.id) {
          console.warn('Invalid application data provided for addToShortlist');
          return false;
        }

        set(state => {
          // Check if already shortlisted
          const isAlreadyShortlisted = state.shortlistedApplications.some(
            app => app.id === applicationData.id
          );

          if (isAlreadyShortlisted) {
            console.warn('Application already in shortlist');
            return state;
          }

          // Create shortlisted application object
          const shortlistedApplication = {
            ...applicationData,
            shortlistedAt: new Date().toISOString(),
            shortlistedBy: applicationData.shortlistedBy || null
          };

          // Update main array
          const updatedApplications = [...state.shortlistedApplications, shortlistedApplication];

          // Update job-organized object
          const jobId = applicationData.jobId || applicationData.job_id;
          const updatedShortlistsByJob = { ...state.shortlistsByJob };
          
          if (!updatedShortlistsByJob[jobId]) {
            updatedShortlistsByJob[jobId] = [];
          }
          updatedShortlistsByJob[jobId].push(shortlistedApplication);

          return {
            shortlistedApplications: updatedApplications,
            shortlistsByJob: updatedShortlistsByJob
          };
        });

        return true;
      },

      // Remove application from shortlist
      removeFromShortlist: (applicationId) => {
        if (!applicationId) {
          console.warn('No applicationId provided for removeFromShortlist');
          return false;
        }

        set(state => {
          // Remove from main array
          const updatedApplications = state.shortlistedApplications.filter(
            app => app.id !== applicationId
          );
          
          // Update job-organized object
          const updatedShortlistsByJob = { ...state.shortlistsByJob };
          Object.keys(updatedShortlistsByJob).forEach(jobId => {
            updatedShortlistsByJob[jobId] = updatedShortlistsByJob[jobId].filter(
              app => app.id !== applicationId
            );
            // Remove empty job arrays
            if (updatedShortlistsByJob[jobId].length === 0) {
              delete updatedShortlistsByJob[jobId];
            }
          });

          return {
            shortlistedApplications: updatedApplications,
            shortlistsByJob: updatedShortlistsByJob
          };
        });

        return true;
      },

      // Bulk add to shortlist
      bulkAddToShortlist: (applicationsData) => {
        if (!Array.isArray(applicationsData) || !applicationsData.length) {
          console.warn('Invalid applications data provided for bulkAddToShortlist');
          return false;
        }

        set(state => {
          const currentIds = state.shortlistedApplications.map(app => app.id);
          const newApplications = applicationsData.filter(
            app => !currentIds.includes(app.id)
          );

          if (!newApplications.length) {
            console.warn('All applications are already shortlisted');
            return state;
          }

          // Add shortlisted metadata
          const shortlistedApplications = newApplications.map(app => ({
            ...app,
            shortlistedAt: new Date().toISOString(),
            shortlistedBy: app.shortlistedBy || null
          }));

          // Update main array
          const updatedApplications = [...state.shortlistedApplications, ...shortlistedApplications];

          // Update job-organized object
          const updatedShortlistsByJob = { ...state.shortlistsByJob };
          
          shortlistedApplications.forEach(app => {
            const jobId = app.jobId || app.job_id;
            if (!updatedShortlistsByJob[jobId]) {
              updatedShortlistsByJob[jobId] = [];
            }
            updatedShortlistsByJob[jobId].push(app);
          });

          return {
            shortlistedApplications: updatedApplications,
            shortlistsByJob: updatedShortlistsByJob,
            selectedApplications: [] // Clear selection after bulk operation
          };
        });

        return true;
      },

      // Bulk remove from shortlist
      bulkRemoveFromShortlist: (applicationIds) => {
        if (!Array.isArray(applicationIds) || !applicationIds.length) {
          console.warn('No applicationIds provided for bulkRemoveFromShortlist');
          return false;
        }

        set(state => {
          // Remove from main array
          const updatedApplications = state.shortlistedApplications.filter(
            app => !applicationIds.includes(app.id)
          );
          
          // Update job-organized object
          const updatedShortlistsByJob = { ...state.shortlistsByJob };
          Object.keys(updatedShortlistsByJob).forEach(jobId => {
            updatedShortlistsByJob[jobId] = updatedShortlistsByJob[jobId].filter(
              app => !applicationIds.includes(app.id)
            );
            // Remove empty job arrays
            if (updatedShortlistsByJob[jobId].length === 0) {
              delete updatedShortlistsByJob[jobId];
            }
          });

          return {
            shortlistedApplications: updatedApplications,
            shortlistsByJob: updatedShortlistsByJob,
            selectedApplications: [] // Clear selection after bulk operation
          };
        });

        return true;
      },

      // Utility functions
      getShortlistedApplicationsForJob: (jobId) => {
        const state = get();
        return state.shortlistsByJob[jobId] || [];
      },

      isApplicationShortlisted: (applicationId) => {
        const state = get();
        return state.shortlistedApplications.some(app => app.id === applicationId);
      },

      getShortlistCount: (jobId = null) => {
        const state = get();
        if (jobId) {
          return state.shortlistsByJob[jobId]?.length || 0;
        }
        return state.shortlistedApplications.length;
      },

      getShortlistedApplication: (applicationId) => {
        const state = get();
        return state.shortlistedApplications.find(app => app.id === applicationId) || null;
      },

      // Get all unique job IDs that have shortlisted applications
      getJobsWithShortlists: () => {
        const state = get();
        return Object.keys(state.shortlistsByJob);
      },

      // Filter and search functions
      getFilteredApplications: () => {
        const { shortlistedApplications, filters } = get();
        
        return shortlistedApplications.filter(application => {
          const matchesSearch = !filters.searchTerm || 
            application.candidate?.name?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
            application.job?.title?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
            application.candidate?.profile?.skills?.some(skill => 
              skill.toLowerCase().includes(filters.searchTerm.toLowerCase())
            );
          
          const matchesJob = filters.jobId === 'all' || 
            application.jobId === filters.jobId || 
            application.job_id === filters.jobId;
          
          const matchesExperience = filters.experienceLevel === 'all' || 
            (application.candidate?.profile?.experienceYears && 
             application.candidate.profile.experienceYears >= parseInt(filters.experienceLevel));
          
          const matchesSkills = !filters.skillsFilter.length || 
            filters.skillsFilter.some(skill => 
              application.candidate?.profile?.skills?.includes(skill)
            );

          // Date range filter
          const matchesDateRange = filters.dateRange === 'all' || (() => {
            if (!application.shortlistedAt) return true;
            
            const shortlistedDate = new Date(application.shortlistedAt);
            const now = new Date();
            
            switch (filters.dateRange) {
              case 'today':
                return shortlistedDate.toDateString() === now.toDateString();
              case 'week':
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                return shortlistedDate >= weekAgo;
              case 'month':
                const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                return shortlistedDate >= monthAgo;
              default:
                return true;
            }
          })();

          return matchesSearch && matchesJob && matchesExperience && matchesSkills && matchesDateRange;
        });
      },

      // Get statistics
      getShortlistStats: () => {
        const state = get();
        const totalCount = state.shortlistedApplications.length;
        const jobsCount = Object.keys(state.shortlistsByJob).length;
        
        // Get recent shortlists (last 7 days)
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const recentCount = state.shortlistedApplications.filter(app => 
          app.shortlistedAt && new Date(app.shortlistedAt) >= weekAgo
        ).length;

        return {
          total: totalCount,
          jobs: jobsCount,
          recent: recentCount
        };
      },

      // Clear all shortlisted applications
      clearAllShortlists: () => set({
        shortlistedApplications: [],
        shortlistsByJob: {},
        selectedApplications: []
      }),

      // Clear shortlists for a specific job
      clearJobShortlist: (jobId) => {
        if (!jobId) return false;

        set(state => {
          const updatedApplications = state.shortlistedApplications.filter(
            app => (app.jobId || app.job_id) !== jobId
          );
          
          const updatedShortlistsByJob = { ...state.shortlistsByJob };
          delete updatedShortlistsByJob[jobId];

          return {
            shortlistedApplications: updatedApplications,
            shortlistsByJob: updatedShortlistsByJob
          };
        });

        return true;
      },

      // REJECTED CANDIDATES METHODS
      
      // Add application to rejected list
      addToRejected: (applicationData) => {
        if (!applicationData || !applicationData.id) {
          console.warn('Invalid application data provided for addToRejected');
          return false;
        }

        set(state => {
          // Check if already rejected
          const isAlreadyRejected = state.rejectedApplications.some(
            app => app.id === applicationData.id
          );

          if (isAlreadyRejected) {
            console.warn('Application already in rejected list');
            return state;
          }

          // Remove from shortlist if exists
          const updatedShortlistedApplications = state.shortlistedApplications.filter(
            app => app.id !== applicationData.id
          );
          const updatedShortlistsByJob = { ...state.shortlistsByJob };
          Object.keys(updatedShortlistsByJob).forEach(jobId => {
            updatedShortlistsByJob[jobId] = updatedShortlistsByJob[jobId].filter(
              app => app.id !== applicationData.id
            );
            if (updatedShortlistsByJob[jobId].length === 0) {
              delete updatedShortlistsByJob[jobId];
            }
          });

          // Create rejected application object
          const rejectedApplication = {
            ...applicationData,
            rejectedAt: new Date().toISOString(),
            rejectedBy: applicationData.rejectedBy || null
          };

          // Update main array
          const updatedRejectedApplications = [...state.rejectedApplications, rejectedApplication];

          // Update job-organized object
          const jobId = applicationData.jobId || applicationData.job_id;
          const updatedRejectedByJob = { ...state.rejectedByJob };
          
          if (!updatedRejectedByJob[jobId]) {
            updatedRejectedByJob[jobId] = [];
          }
          updatedRejectedByJob[jobId].push(rejectedApplication);

          return {
            shortlistedApplications: updatedShortlistedApplications,
            shortlistsByJob: updatedShortlistsByJob,
            rejectedApplications: updatedRejectedApplications,
            rejectedByJob: updatedRejectedByJob
          };
        });

        return true;
      },

      // Remove application from rejected list
      removeFromRejected: (applicationId) => {
        if (!applicationId) {
          console.warn('No applicationId provided for removeFromRejected');
          return false;
        }

        set(state => {
          // Remove from main array
          const updatedApplications = state.rejectedApplications.filter(
            app => app.id !== applicationId
          );
          
          // Update job-organized object
          const updatedRejectedByJob = { ...state.rejectedByJob };
          Object.keys(updatedRejectedByJob).forEach(jobId => {
            updatedRejectedByJob[jobId] = updatedRejectedByJob[jobId].filter(
              app => app.id !== applicationId
            );
            // Remove empty job arrays
            if (updatedRejectedByJob[jobId].length === 0) {
              delete updatedRejectedByJob[jobId];
            }
          });

          return {
            rejectedApplications: updatedApplications,
            rejectedByJob: updatedRejectedByJob
          };
        });

        return true;
      },

      // Utility functions for rejected candidates
      isApplicationRejected: (applicationId) => {
        const state = get();
        return state.rejectedApplications.some(app => app.id === applicationId);
      },

      getRejectedApplicationsForJob: (jobId) => {
        const state = get();
        return state.rejectedByJob[jobId] || [];
      },

      getRejectedCount: (jobId = null) => {
        const state = get();
        if (jobId) {
          return state.rejectedByJob[jobId]?.length || 0;
        }
        return state.rejectedApplications.length;
      },

      getRejectedApplication: (applicationId) => {
        const state = get();
        return state.rejectedApplications.find(app => app.id === applicationId) || null;
      },

      // Get candidate status (shortlisted, rejected, or new)
      getCandidateStatus: (applicationId) => {
        const state = get();
        if (state.shortlistedApplications.some(app => app.id === applicationId)) {
          return 'shortlisted';
        }
        if (state.rejectedApplications.some(app => app.id === applicationId)) {
          return 'rejected';
        }
        return 'new';
      },

      // Clear all rejected applications
      clearAllRejected: () => set({
        rejectedApplications: [],
        rejectedByJob: {}
      }),

      // Reset store to initial state
      resetStore: () => set({
        shortlistedApplications: [],
        shortlistsByJob: {},
        rejectedApplications: [],
        rejectedByJob: {},
        loading: {
          add: false,
          remove: false,
          bulk: false
        },
        error: {
          add: null,
          remove: null,
          bulk: null
        },
        filters: {
          searchTerm: '',
          jobId: 'all',
          dateRange: 'all',
          skillsFilter: [],
          experienceLevel: 'all'
        },
        selectedApplications: [],
        showShortlistModal: false,
        showBulkActions: false
      })
    }),
    {
      name: 'shortlist-store', // Name for localStorage key
      partialize: (state) => ({
        shortlistedApplications: state.shortlistedApplications,
        shortlistsByJob: state.shortlistsByJob,
        rejectedApplications: state.rejectedApplications,
        rejectedByJob: state.rejectedByJob
      }) // Only persist the core data, not UI state
    }
  )
);

export default useShortlistStore; 
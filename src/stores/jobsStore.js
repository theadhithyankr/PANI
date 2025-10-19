import { create } from 'zustand';

export const useJobsStore = create((set) => ({
  jobs: [],
  isLoading: false,
  error: null,
  initialized: false,

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setInitialized: (initialized) => set({ initialized }),
  
  setJobs: (jobs) => set({ 
    jobs,
    initialized: true,
    isLoading: false,
    error: null
  }),
  
  addJob: (job) => set((state) => ({ 
    jobs: [job, ...state.jobs] 
  })),
  
  updateJob: (jobId, updatedJob) => set((state) => ({
    jobs: state.jobs.map(job => 
      job.id === jobId ? { ...job, ...updatedJob } : job
    )
  })),
  
  removeJob: (jobId) => set((state) => ({
    jobs: state.jobs.filter(job => job.id !== jobId)
  })),

  // Filter jobs by status
  getJobsByStatus: (state) => (status) => {
    return state.jobs.filter(job => job.status === status);
  },

  // Get job by id
  getJobById: (state) => (jobId) => {
    return state.jobs.find(job => job.id === jobId);
  },

  // Reset store state
  reset: () => set({ 
    jobs: [], 
    isLoading: false, 
    error: null,
    initialized: false 
  })
})); 
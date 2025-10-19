/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useJobSeekerProfile } from './useJobSeekerProfile';
import { useAuth } from '../common/useAuth';
import { useCompanyStore } from '../../stores/companyStore';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const useJobs = (filters = {}) => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Use refs to track if this is the first render and previous filters
  const isInitialMount = useRef(true);
  const prevFiltersRef = useRef({});

  // Get the current user and their profile
  const { user } = useAuth();
  const { profile: jobSeekerProfile } = useJobSeekerProfile(user?.id);

  // Check if filters have actually changed
  const haveFiltersChanged = () => {
    const prevFilters = prevFiltersRef.current;
    
    // Compare each filter property
    for (const key in filters) {
      if (filters[key] !== prevFilters[key]) {
        return true;
      }
    }
    
    // Check if any previous filters were removed
    for (const key in prevFilters) {
      if (!(key in filters)) {
        return true;
      }
    }
    
    return false;
  };

  const fetchJobs = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('jobs')
        .select(`*, companies(*)`)
        .eq('status', 'active'); // Only get active jobs

      // Apply filters if they exist
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

      if (filters.jobType) {
        query = query.eq('job_type', filters.jobType);
      }

      if (filters.company) {
        query = query.ilike('companies.name', `%${filters.company}%`);
      }

      if (filters.experience) {
        query = query.eq('experience_level', filters.experience);
      }

      // Always filter by matching skills if job seeker profile exists
      if (jobSeekerProfile?.skills?.length > 0) {
        // Use the GIN index on skills_required
        query = query.contains('skills_required', jobSeekerProfile.skills);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Cache company data in the company store
      const companyStore = useCompanyStore.getState();
      if (data) {
        console.log('Candidate useJobs - Caching company data for jobs:', data.length);
        data.forEach(job => {
          if (job.companies && job.company_id) {
            console.log('Candidate useJobs - Caching company:', job.company_id, job.companies);
            companyStore.updateCompany(job.company_id, job.companies);
          }
        });
        console.log('Candidate useJobs - Total cached companies after update:', companyStore.getCompanyCount());
      }

      // If GIN index is not available, filter the results in memory
      let filteredJobs = data || [];
      if (jobSeekerProfile?.skills?.length > 0) {
        filteredJobs = filteredJobs.filter(job => {
          // Skip jobs with no required skills
          if (!job.skills_required || !job.skills_required.length) return false;
          
          // Check if job requires any of the job seeker's skills
          return job.skills_required.some(skill => 
            jobSeekerProfile.skills.includes(skill)
          );
        });
      }

      // Additional filtering to ensure data quality
      filteredJobs = filteredJobs.filter(job => {
        // Skip jobs with empty or invalid data
        if (!job.title || !job.description || !job.requirements) return false;
        
        // Skip jobs with empty skills array
        if (!job.skills_required || job.skills_required.length === 0) return false;
        
        // Skip jobs with invalid salary range
        if (!job.salary_range || typeof job.salary_range !== 'object') return false;
        
        return true;
      });

      setJobs(filteredJobs);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch on initial mount or when filters actually change
    if (isInitialMount.current) {
      isInitialMount.current = false;
      fetchJobs();
    } else if (haveFiltersChanged()) {
      fetchJobs();
    }
    
    // Update previous filters reference
    prevFiltersRef.current = { ...filters };
  }, [filters, jobSeekerProfile?.skills]); // Add jobSeekerProfile.skills as dependency

  return { jobs, loading, error, refetch: fetchJobs };
};

export default useJobs; 
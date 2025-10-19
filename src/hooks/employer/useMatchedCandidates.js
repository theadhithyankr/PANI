import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '../../clients/supabaseClient';
import useGlobalStore from '../../stores/globalStore';
import useCandidatesStore from '../../store/candidatesStore';
import { computeUnifiedMatchScore } from '../../utils/unifiedMatchScore';

export const useMatchedCandidates = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Get user and profile from global store
  const user = useGlobalStore((state) => state.user);
  const profile = useGlobalStore((state) => state.profile);
  
  // Extract company from profile (support both embedded company object and company_id)
  const companyId = profile?.company?.id || profile?.company_id;
  
  // Get candidates store actions
  const {
    candidates,
    setCandidates,
    setLoading: setStoreLoading,
    setError: setStoreError,
    setCandidateMatchScores
  } = useCandidatesStore();
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      // Cleanup any pending operations
    };
  }, []);

  const fetchMatchedCandidates = useCallback(async (filters = {}) => {
    console.log('useMatchedCandidates - fetchMatchedCandidates called:', {
      userId: user?.id,
      companyId,
      loading
    });

    if (!user?.id) {
      const errorMsg = 'User information is missing';
      console.error('useMatchedCandidates - Missing user:', { user: user?.id });
      setError(errorMsg);
      setStoreError(errorMsg);
      return [];
    }
    if (!companyId) {
      console.warn('useMatchedCandidates - Company not loaded yet; returning empty candidates');
      setCandidates([]);
      return [];
    }

    // Prevent duplicate requests
    if (loading) {
      console.log('useMatchedCandidates - Request already in progress, skipping...');
      return candidates;
    }

    console.log('useMatchedCandidates - Starting fresh fetch...');
    setLoading(true);
    setStoreLoading(true);
    setError(null);
    setStoreError(null);

    try {
      console.log('useMatchedCandidates - Fetching matched candidates for company:', companyId);

      // First, get all jobs for this company
      const { data: companyJobs, error: jobsError } = await supabase
        .from('jobs')
        .select('id, title, skills_required, location, job_type, experience_level')
        .eq('company_id', companyId)
        .eq('status', 'active');

      if (jobsError) throw jobsError;

      console.log('useMatchedCandidates - Company jobs found:', companyJobs?.length || 0);

      if (!companyJobs || companyJobs.length === 0) {
        console.log('useMatchedCandidates - No active jobs found for company');
        setCandidates([]);
        return [];
      }

      // Get all unique skills from company jobs
      const allJobSkills = [...new Set(
        companyJobs.flatMap(job => job.skills_required || [])
      )];

      console.log('useMatchedCandidates - All job skills:', allJobSkills);

      if (allJobSkills.length === 0) {
        console.log('useMatchedCandidates - No skills found in company jobs');
        setCandidates([]);
        return [];
      }

      // Sanitize skills array to prevent PostgreSQL array literal issues
      // Remove any skills that might cause array parsing issues
      const sanitizedSkills = allJobSkills
        .filter(skill => skill != null && skill !== undefined && skill !== '') // Remove null, undefined, empty strings
        .map(skill => String(skill).trim()) // Convert to string and trim
        .filter(skill => skill.length > 0) // Remove empty strings after trimming
        .filter(skill => {
          // Remove skills with problematic characters for PostgreSQL arrays
          const hasProblematicChars = skill.includes('"') || 
                                     skill.includes("'") || 
                                     skill.includes('\\') || 
                                     skill.includes('{') || 
                                     skill.includes('}') ||
                                     skill.includes(',') ||
                                     skill.includes('\n') ||
                                     skill.includes('\r');
          return !hasProblematicChars && skill.length < 100 && skill.length > 0;
        })
        .filter((skill, index, array) => array.indexOf(skill) === index); // Remove duplicates

      console.log('useMatchedCandidates - Sanitized skills:', sanitizedSkills);

      if (sanitizedSkills.length === 0) {
        console.log('useMatchedCandidates - No valid skills after sanitization');
        setCandidates([]);
        return [];
      }

      // Fetch hired seekers for this company's jobs to exclude them from candidates list
      const { data: hiredRows, error: hiredError } = await supabase
        .from('interviews_v2')
        .select('seeker_id')
        .in('job_id', companyJobs.map(j => j.id))
        .eq('application_status', 'hired');

      if (hiredError) throw hiredError;

      const hiredSeekerIds = new Set((hiredRows || []).map(r => r.seeker_id));

      // Optimize the query to fetch only necessary data for potential candidates
      // Only fetch candidates who have skills that match the company's job requirements
      let query = supabase
        .from('job_seeker_profiles')
        .select(`
          id,
          headline,
          summary,
          experience_years,
          current_location,
          preferred_locations,
          willing_to_relocate,
          preferred_job_types,
          target_salary_range,
          skills,
          languages,
          cultural_preferences,
          relocation_timeline,
          ai_generated_summary,
          ai_career_insights,
          created_at,
          updated_at,
          profiles!inner(
            id,
            full_name,
            avatar_url,
            phone
          )
        `)
        .overlaps('skills', sanitizedSkills) // Only get candidates with matching skills
        .limit(100);

      // Apply filters more efficiently
      if (filters.searchTerm) {
        query = query.or(`profiles.full_name.ilike.%${filters.searchTerm}%,headline.ilike.%${filters.searchTerm}%`);
      }

      if (filters.location && filters.location !== 'all') {
        query = query.ilike('current_location', `%${filters.location}%`);
      }

      if (filters.skillFilter && filters.skillFilter !== 'all') {
        query = query.contains('skills', [filters.skillFilter]);
      }

      const { data: jobSeekerProfiles, error: profilesError } = await query;

      if (profilesError) throw profilesError;

      console.log('useMatchedCandidates - Job seeker profiles found:', jobSeekerProfiles?.length || 0);

      if (!jobSeekerProfiles || jobSeekerProfiles.length === 0) {
        console.log('useMatchedCandidates - No job seeker profiles found');
        setCandidates([]);
        return [];
      }

      // Calculate match scores and create candidate objects (excluding hired seekers)
      const candidatesWithScores = jobSeekerProfiles
        .filter(profile => !hiredSeekerIds.has(profile.id))
        .map(profile => {
        // Compute best job match and score using unified utility
        let bestJobMatch = null;
        let bestJobScore = 0;

        companyJobs.forEach(job => {
          const score = computeUnifiedMatchScore({ candidate: profile, job });
          if (score > bestJobScore) {
            bestJobScore = score;
            bestJobMatch = job;
          }
        });

        // Average score across all company jobs (optional context)
        const averageMatchScore = companyJobs.length > 0
          ? Math.round(companyJobs.reduce((acc, job) => acc + computeUnifiedMatchScore({ candidate: profile, job }), 0) / companyJobs.length)
          : 0;

        const finalScore = Math.min(100, Math.round(bestJobScore));

        return {
          id: profile.id,
          name: profile.profiles.full_name,
          avatar: profile.profiles.avatar_url,
          phone: profile.profiles.phone,
          headline: profile.headline,
          summary: profile.summary,
          experience_years: profile.experience_years,
          current_location: profile.current_location,
          preferred_locations: profile.preferred_locations || [],
          willing_to_relocate: profile.willing_to_relocate,
          preferred_job_types: profile.preferred_job_types || [],
          target_salary_range: profile.target_salary_range,
          skills: profile.skills || [],
          languages: profile.languages || [],
          cultural_preferences: profile.cultural_preferences,
          relocation_timeline: profile.relocation_timeline,
          ai_generated_summary: profile.ai_generated_summary,
          ai_career_insights: profile.ai_career_insights,
          matchScore: finalScore,
          bestJobMatch: bestJobMatch ? {
            id: bestJobMatch.id,
            title: bestJobMatch.title,
            location: bestJobMatch.location,
            job_type: bestJobMatch.job_type,
            experience_level: bestJobMatch.experience_level,
            matchScore: Math.round(bestJobScore)
          } : null,
          createdAt: profile.created_at,
          updatedAt: profile.updated_at
        };
      });

      // Sort by match score (highest first) and limit results
      const sortedCandidates = candidatesWithScores
        .filter(candidate => candidate.matchScore >= 20) // Only show candidates with meaningful match (20%+)
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 50); // Limit to top 50 candidates for better performance

      console.log('useMatchedCandidates - Final candidates with scores:', sortedCandidates.length);
      console.log('useMatchedCandidates - Top candidate score:', sortedCandidates[0]?.matchScore || 0);

      // Update both local state and store
      setCandidates(sortedCandidates);

      const newCandidateMatchScores = sortedCandidates.reduce((acc, candidate) => {
        acc[candidate.id] = candidate.matchScore;
        return acc;
      }, {});
      setCandidateMatchScores(newCandidateMatchScores);

      console.log('useMatchedCandidates - Candidates set in store:', sortedCandidates.length);
      return sortedCandidates;
    } catch (err) {
      console.error('useMatchedCandidates - Error fetching matched candidates:', err);
      const errorMsg = err.message || 'Failed to fetch candidates';
      setError(errorMsg);
      setStoreError(errorMsg);
      return [];
    } finally {
      setLoading(false);
      setStoreLoading(false);
      console.log('useMatchedCandidates - Fetch completed');
    }
  }, [user?.id, companyId, loading, candidates, setCandidates, setStoreLoading, setStoreError]);

  const getCandidateById = useCallback(async (candidateId) => {
    if (!candidateId) return null;

    try {
      const { data: profile, error } = await supabase
        .from('job_seeker_profiles')
        .select(`
          *,
          profiles!inner(
            id,
            full_name,
            avatar_url,
            phone
          )
        `)
        .eq('id', candidateId)
        .single();

      if (error) throw error;

      if (!profile) return null;

      return {
        id: profile.id,
        name: profile.profiles.full_name,
        avatar: profile.profiles.avatar_url,
        phone: profile.profiles.phone,
        headline: profile.headline,
        summary: profile.summary,
        experience_years: profile.experience_years,
        current_location: profile.current_location,
        preferred_locations: profile.preferred_locations || [],
        willing_to_relocate: profile.willing_to_relocate,
        preferred_job_types: profile.preferred_job_types || [],
        target_salary_range: profile.target_salary_range,
        skills: profile.skills || [],
        languages: profile.languages || [],
        cultural_preferences: profile.cultural_preferences,
        relocation_timeline: profile.relocation_timeline,
        ai_generated_summary: profile.ai_generated_summary,
        ai_career_insights: profile.ai_career_insights,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at
      };
    } catch (err) {
      console.error('Error fetching candidate by ID:', err);
      return null;
    }
  }, []);

  return {
    candidates,
    loading,
    error,
    fetchMatchedCandidates,
    getCandidateById,
    clearCandidates: () => setCandidates([])
  };
};
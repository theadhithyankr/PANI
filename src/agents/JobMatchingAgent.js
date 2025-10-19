import { supabase } from '../clients/supabaseClient';
import { computeUnifiedMatchScore } from '../utils/unifiedMatchScore';

/**
 * Job Matching Agent - Handles all job and candidate matching operations
 * 
 * Features:
 * 1. Fetch matching jobs for a candidate
 * 2. Fetch recommended candidates for a job
 * 3. Create job posts
 * 4. Schedule candidate interviews
 */

class JobMatchingAgent {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * 1. Fetch matching jobs for a candidate
   * @param {string} candidateId - The candidate's user ID
   * @param {Object} filters - Optional filters for job search
   * @returns {Promise<Array>} Array of matching jobs with match scores
   */
  async fetchMatchingJobs(candidateId, filters = {}) {
    try {
      console.log('JobMatchingAgent: Fetching matching jobs for candidate:', candidateId);

      // Get candidate profile with skills
      const { data: candidateProfile, error: profileError } = await supabase
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
          profiles!inner(
            id,
            full_name,
            avatar_url,
            phone
          )
        `)
        .eq('id', candidateId)
        .single();

      if (profileError) throw profileError;
      if (!candidateProfile) throw new Error('Candidate profile not found');

      // Build job query with filters
      let query = supabase
        .from('jobs')
        .select(`
          *,
          companies(
            id,
            name,
            logo_url,
            industry,
            size,
            website,
            description
          )
        `)
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

      if (filters.location) {
        query = query.ilike('location', `%${filters.location}%`);
      }

      // Filter by matching skills if candidate has skills
      if (candidateProfile.skills && candidateProfile.skills.length > 0) {
        query = query.contains('skills_required', candidateProfile.skills);
      }

      const { data: jobs, error: jobsError } = await query;

      if (jobsError) throw jobsError;

      // Calculate match scores for each job
      const jobsWithScores = jobs.map(job => {
        const percentage = computeUnifiedMatchScore({ candidate: candidateProfile, job });
        const matchScore = percentage / 100; // keep legacy field for any consumers
        return {
          ...job,
          matchScore: percentage, // normalize to 0-100 across app
          matchPercentage: percentage,
          matchReasons: this.getMatchReasons(candidateProfile, job, matchScore)
        };
      });

      // Sort by match score (highest first)
      const sortedJobs = jobsWithScores.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

      console.log(`JobMatchingAgent: Found ${sortedJobs.length} matching jobs`);
      return sortedJobs;

    } catch (error) {
      console.error('JobMatchingAgent: Error fetching matching jobs:', error);
      throw error;
    }
  }

  /**
   * 2. Fetch recommended candidates for a job
   * @param {string} jobId - The job ID
   * @param {Object} filters - Optional filters for candidate search
   * @returns {Promise<Array>} Array of recommended candidates with match scores
   */
  async fetchRecommendedCandidates(jobId, filters = {}) {
    try {
      console.log('JobMatchingAgent: Fetching recommended candidates for job:', jobId);

      // Get job details
      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .select(`
          *,
          companies(
            id,
            name,
            logo_url,
            industry,
            size
          )
        `)
        .eq('id', jobId)
        .single();

      if (jobError) throw jobError;
      if (!job) throw new Error('Job not found');

      // Build candidate query
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
        .not('skills', 'is', null)
        .not('skills', 'eq', '{}');

      // Apply filters
      if (filters.experience && filters.experience !== 'all') {
        const experienceRanges = {
          'entry': { min: 0, max: 2 },
          'mid': { min: 2, max: 5 },
          'senior': { min: 5, max: 8 },
          'lead': { min: 8, max: 12 },
          'executive': { min: 12, max: 50 }
        };
        
        const range = experienceRanges[filters.experience];
        if (range) {
          query = query
            .gte('experience_years', range.min)
            .lte('experience_years', range.max);
        }
      }

      if (filters.location && filters.location !== 'all') {
        query = query.ilike('current_location', `%${filters.location}%`);
      }

      if (filters.searchTerm) {
        query = query.or(`headline.ilike.%${filters.searchTerm}%,summary.ilike.%${filters.searchTerm}%`);
      }

      // Limit results for performance
      query = query.limit(100);

      const { data: candidates, error: candidatesError } = await query;

      if (candidatesError) throw candidatesError;

      // Calculate match scores for each candidate
      const candidatesWithScores = candidates.map(candidate => {
        const percentage = computeUnifiedMatchScore({ candidate, job });
        const normalized = percentage / 100;
        return {
          ...candidate,
          matchScore: percentage,
          matchPercentage: percentage,
          matchReasons: this.getCandidateMatchReasons(candidate, job, normalized),
          bestJobMatch: {
            id: job.id,
            title: job.title,
            company: job.companies?.name,
            matchScore: percentage
          }
        };
      });

      // Sort by match score (highest first)
      const sortedCandidates = candidatesWithScores.sort((a, b) => b.matchScore - a.matchScore);

      console.log(`JobMatchingAgent: Found ${sortedCandidates.length} recommended candidates`);
      return sortedCandidates;

    } catch (error) {
      console.error('JobMatchingAgent: Error fetching recommended candidates:', error);
      throw error;
    }
  }

  /**
   * 3. Create job post
   * @param {Object} jobData - Job data to create
   * @param {string} employerId - The employer's user ID
   * @param {string} companyId - The company ID
   * @returns {Promise<Object>} Created job object
   */
  async createJobPost(jobData, employerId, companyId) {
    try {
      console.log('JobMatchingAgent: Creating job post:', jobData.title);

      // Validate required fields
      const requiredFields = ['title', 'description', 'location', 'job_type', 'experience_level'];
      for (const field of requiredFields) {
        if (!jobData[field]) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      // Prepare job payload
      const jobPayload = {
        company_id: companyId,
        created_by: employerId,
        title: jobData.title.trim(),
        description: jobData.description.trim(),
        requirements: jobData.requirements?.trim() || '',
        responsibilities: jobData.responsibilities?.trim() || '',
        location: jobData.location.trim(),
        is_remote: jobData.is_remote || false,
        is_hybrid: jobData.is_hybrid || false,
        job_type: jobData.job_type,
        experience_level: jobData.experience_level,
        skills_required: jobData.skills_required || [],
        benefits: jobData.benefits || [],
        application_deadline: jobData.application_deadline || null,
        start_date: jobData.start_date || null,
        drivers_license: jobData.drivers_license || false,
        additional_questions: jobData.additional_questions || [],
        preferred_language: jobData.preferred_language || 'english',
        priority: jobData.priority || 'normal',
        status: jobData.status || 'active',
        support_tier_id: jobData.support_tier_id || 1,
        // Handle salary data
        salary_type: jobData.salary_type || 'negotiable',
        salary_currency: jobData.salary_currency || 'USD',
        salary_period: jobData.salary_period || 'annually',
        ...(jobData.salary_min && { salary_min: parseFloat(jobData.salary_min) }),
        ...(jobData.salary_max && { salary_max: parseFloat(jobData.salary_max) }),
        ...(jobData.salary_fixed && { salary_fixed: parseFloat(jobData.salary_fixed) })
      };

      const { data: newJob, error: insertError } = await supabase
        .from('jobs')
        .insert(jobPayload)
        .select(`
          *,
          companies(
            id,
            name,
            logo_url,
            industry,
            size
          )
        `)
        .single();

      if (insertError) throw insertError;

      console.log('JobMatchingAgent: Job created successfully:', newJob.id);
      return newJob;

    } catch (error) {
      console.error('JobMatchingAgent: Error creating job post:', error);
      throw error;
    }
  }

  /**
   * 4. Schedule candidate interview
   * @param {Object} interviewData - Interview scheduling data
   * @param {string} employerId - The employer's user ID
   * @returns {Promise<Object>} Created interview object
   */
  async scheduleInterview(interviewData, employerId) {
    try {
      console.log('JobMatchingAgent: Scheduling interview for candidate:', interviewData.candidateId);

      // Validate required fields
      const requiredFields = ['jobId', 'candidateId', 'interviewDate'];
      for (const field of requiredFields) {
        if (!interviewData[field]) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      // Prepare interview record - match backend field names
      const interviewRecord = {
        job_id: interviewData.jobId,
        seeker_id: interviewData.candidateId,
        interviewer_id: employerId,
        interview_type: interviewData.interviewType || '1st_interview',
        interview_format: interviewData.interviewFormat || 'video',
        location: interviewData.location || null, // Backend expects location column
        interview_date: new Date(interviewData.interviewDate).toISOString(),
        duration_minutes: interviewData.durationMinutes || 60, // Backend expects duration_minutes
        meeting_link: interviewData.meetingLink || null,
        agenda: interviewData.agenda || null,
        interview_notes: interviewData.notes || null, // Backend expects interview_notes
        additional_interviewers: interviewData.additionalInterviewers || [],
        status: 'scheduled'
      };

      // Add application_id if provided (for traditional flow)
      if (interviewData.applicationId) {
        interviewRecord.application_id = interviewData.applicationId;
      }

      const { data: newInterview, error: insertError } = await supabase
        .from('interviews_v2')
        .insert(interviewRecord)
        .select(`
          *,
          job:jobs(
            id,
            title,
            companies(name)
          ),
          seeker:profiles!interviews_v2_seeker_id_fkey(
            id,
            full_name,
            avatar_url
          )
        `)
        .single();

      if (insertError) throw insertError;

      console.log('JobMatchingAgent: Interview scheduled successfully:', newInterview.id);
      return newInterview;

    } catch (error) {
      console.error('JobMatchingAgent: Error scheduling interview:', error);
      throw error;
    }
  }

  /**
   * Calculate job match score for a candidate
   * @param {Object} candidate - Candidate profile
   * @param {Object} job - Job details
   * @returns {number} Match score between 0 and 1
   */
  calculateJobMatchScore(candidate, job) {
    let score = 0;
    let totalWeight = 0;

    // Skills matching (40% weight)
    if (candidate.skills && job.skills_required && candidate.skills.length > 0) {
      const matchingSkills = candidate.skills.filter(skill => 
        job.skills_required.includes(skill)
      ).length;
      const skillScore = matchingSkills / job.skills_required.length;
      score += skillScore * 0.4;
      totalWeight += 0.4;
    }

    // Experience level matching (25% weight)
    if (candidate.experience_years !== null && job.experience_level) {
      const experienceScore = this.calculateExperienceMatch(candidate.experience_years, job.experience_level);
      score += experienceScore * 0.25;
      totalWeight += 0.25;
    }

    // Job type preference (15% weight)
    if (candidate.preferred_job_types && candidate.preferred_job_types.length > 0) {
      const jobTypeScore = candidate.preferred_job_types.includes(job.job_type) ? 1 : 0;
      score += jobTypeScore * 0.15;
      totalWeight += 0.15;
    }

    // Location matching (10% weight)
    if (candidate.current_location && job.location) {
      const locationScore = this.calculateLocationMatch(candidate, job);
      score += locationScore * 0.1;
      totalWeight += 0.1;
    }

    // Salary expectations (10% weight)
    if (candidate.target_salary_range && job.salary_range) {
      const salaryScore = this.calculateSalaryMatch(candidate.target_salary_range, job.salary_range);
      score += salaryScore * 0.1;
      totalWeight += 0.1;
    }

    return totalWeight > 0 ? score / totalWeight : 0;
  }

  /**
   * Calculate candidate match score for a job
   * @param {Object} candidate - Candidate profile
   * @param {Object} job - Job details
   * @returns {number} Match score between 0 and 1
   */
  calculateCandidateMatchScore(candidate, job) {
    // Use the same logic as job matching but from employer perspective
    return this.calculateJobMatchScore(candidate, job);
  }

  /**
   * Calculate experience level match
   * @param {number} candidateExperience - Candidate's years of experience
   * @param {string} jobExperienceLevel - Job's required experience level
   * @returns {number} Match score between 0 and 1
   */
  calculateExperienceMatch(candidateExperience, jobExperienceLevel) {
    const experienceRanges = {
      'entry': { min: 0, max: 2 },
      'mid': { min: 2, max: 5 },
      'senior': { min: 5, max: 8 },
      'lead': { min: 8, max: 12 },
      'executive': { min: 12, max: 50 }
    };

    const range = experienceRanges[jobExperienceLevel];
    if (!range) return 0.5; // Default score if level not recognized

    if (candidateExperience >= range.min && candidateExperience <= range.max) {
      return 1.0; // Perfect match
    } else if (candidateExperience < range.min) {
      // Underqualified - lower score based on how far below
      const gap = range.min - candidateExperience;
      return Math.max(0, 1 - (gap / range.min));
    } else {
      // Overqualified - still good but slightly lower score
      const excess = candidateExperience - range.max;
      return Math.max(0.7, 1 - (excess / 10)); // Cap at 0.7 for overqualified
    }
  }

  /**
   * Calculate location match
   * @param {Object} candidate - Candidate profile
   * @param {Object} job - Job details
   * @returns {number} Match score between 0 and 1
   */
  calculateLocationMatch(candidate, job) {
    if (!candidate.current_location || !job.location) return 0.5;

    const candidateLocation = candidate.current_location.toLowerCase();
    const jobLocation = job.location.toLowerCase();

    // Exact match
    if (candidateLocation === jobLocation) return 1.0;

    // Check if candidate is willing to relocate
    if (candidate.willing_to_relocate) {
      // Check preferred locations
      if (candidate.preferred_locations && candidate.preferred_locations.length > 0) {
        const preferredMatch = candidate.preferred_locations.some(loc => 
          loc.toLowerCase().includes(jobLocation) || jobLocation.includes(loc.toLowerCase())
        );
        if (preferredMatch) return 0.9;
      }
      return 0.7; // Willing to relocate but not preferred
    }

    // Check for partial location match (city, state, country)
    const candidateParts = candidateLocation.split(',').map(part => part.trim());
    const jobParts = jobLocation.split(',').map(part => part.trim());
    
    const hasCommonPart = candidateParts.some(part => 
      jobParts.some(jobPart => 
        part.includes(jobPart) || jobPart.includes(part)
      )
    );

    return hasCommonPart ? 0.6 : 0.3;
  }

  /**
   * Calculate salary match
   * @param {Object} candidateSalary - Candidate's salary expectations
   * @param {Object} jobSalary - Job's salary range
   * @returns {number} Match score between 0 and 1
   */
  calculateSalaryMatch(candidateSalary, jobSalary) {
    if (!candidateSalary || !jobSalary) return 0.5;

    // If job has negotiable salary, give good score
    if (jobSalary.type === 'negotiable') return 0.8;

    // If candidate doesn't have specific salary expectations, give neutral score
    if (!candidateSalary.min && !candidateSalary.max) return 0.6;

    const candidateMin = candidateSalary.min || 0;
    const candidateMax = candidateSalary.max || candidateSalary.min || 0;

    if (jobSalary.type === 'fixed') {
      const jobSalaryValue = jobSalary.fixed || 0;
      if (jobSalaryValue >= candidateMin && jobSalaryValue <= candidateMax) {
        return 1.0; // Perfect match
      } else if (jobSalaryValue < candidateMin) {
        return 0.3; // Below expectations
      } else {
        return 0.8; // Above expectations (good)
      }
    } else if (jobSalary.type === 'range') {
      const jobMin = jobSalary.min || 0;
      const jobMax = jobSalary.max || 0;
      
      // Check for overlap
      if (candidateMax >= jobMin && candidateMin <= jobMax) {
        return 1.0; // Overlapping ranges
      } else if (candidateMin > jobMax) {
        return 0.2; // Candidate expects more than job offers
      } else {
        return 0.6; // Job offers more than candidate expects
      }
    }

    return 0.5; // Default neutral score
  }

  /**
   * Get match reasons for job matching
   * @param {Object} candidate - Candidate profile
   * @param {Object} job - Job details
   * @param {number} matchScore - Overall match score
   * @returns {Array} Array of match reasons
   */
  getMatchReasons(candidate, job, matchScore) {
    const reasons = [];

    // Skills match
    if (candidate.skills && job.skills_required && candidate.skills.length > 0) {
      const matchingSkills = candidate.skills.filter(skill => 
        job.skills_required.includes(skill)
      );
      if (matchingSkills.length > 0) {
        reasons.push(`Skills match: ${matchingSkills.length}/${job.skills_required.length} required skills`);
      }
    }

    // Experience match
    if (candidate.experience_years !== null && job.experience_level) {
      const experienceScore = this.calculateExperienceMatch(candidate.experience_years, job.experience_level);
      if (experienceScore > 0.8) {
        reasons.push('Experience level matches perfectly');
      } else if (experienceScore > 0.6) {
        reasons.push('Experience level is a good fit');
      }
    }

    // Job type preference
    if (candidate.preferred_job_types && candidate.preferred_job_types.includes(job.job_type)) {
      reasons.push('Job type matches your preferences');
    }

    // Location match
    if (candidate.current_location && job.location) {
      const locationScore = this.calculateLocationMatch(candidate, job);
      if (locationScore > 0.8) {
        reasons.push('Location is a perfect match');
      } else if (locationScore > 0.6) {
        reasons.push('Location is a good fit');
      } else if (candidate.willing_to_relocate) {
        reasons.push('You are willing to relocate for this position');
      }
    }

    // Overall match quality
    if (matchScore > 0.9) {
      reasons.push('Excellent overall match');
    } else if (matchScore > 0.7) {
      reasons.push('Strong match for this position');
    } else if (matchScore > 0.5) {
      reasons.push('Good potential match');
    }

    return reasons;
  }

  /**
   * Get match reasons for candidate matching
   * @param {Object} candidate - Candidate profile
   * @param {Object} job - Job details
   * @param {number} matchScore - Overall match score
   * @returns {Array} Array of match reasons
   */
  getCandidateMatchReasons(candidate, job, matchScore) {
    const reasons = [];

    // Skills match
    if (candidate.skills && job.skills_required && candidate.skills.length > 0) {
      const matchingSkills = candidate.skills.filter(skill => 
        job.skills_required.includes(skill)
      );
      if (matchingSkills.length > 0) {
        reasons.push(`Has ${matchingSkills.length}/${job.skills_required.length} required skills`);
      }
    }

    // Experience match
    if (candidate.experience_years !== null && job.experience_level) {
      const experienceScore = this.calculateExperienceMatch(candidate.experience_years, job.experience_level);
      if (experienceScore > 0.8) {
        reasons.push('Experience level is perfect for this role');
      } else if (experienceScore > 0.6) {
        reasons.push('Experience level fits well');
      }
    }

    // Job type preference
    if (candidate.preferred_job_types && candidate.preferred_job_types.includes(job.job_type)) {
      reasons.push('Interested in this type of position');
    }

    // Location compatibility
    if (candidate.current_location && job.location) {
      const locationScore = this.calculateLocationMatch(candidate, job);
      if (locationScore > 0.8) {
        reasons.push('Location is ideal');
      } else if (locationScore > 0.6) {
        reasons.push('Location is compatible');
      } else if (candidate.willing_to_relocate) {
        reasons.push('Open to relocating for the right opportunity');
      }
    }

    // Overall match quality
    if (matchScore > 0.9) {
      reasons.push('Exceptional candidate for this role');
    } else if (matchScore > 0.7) {
      reasons.push('Strong candidate with great potential');
    } else if (matchScore > 0.5) {
      reasons.push('Good candidate worth considering');
    }

    return reasons;
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      timeout: this.cacheTimeout
    };
  }
}

// Export singleton instance
export const jobMatchingAgent = new JobMatchingAgent();
export default JobMatchingAgent;

import { supabase } from '../clients/supabaseClient';
import { computeUnifiedMatchScore } from '../utils/unifiedMatchScore.js';
import { groqClient } from '../clients/groqClient.js';

/**
 * AI Agent for Candidates
 * Provides AI-powered job matching, career advice, and application assistance
 */
export class CandidateAIAgent {
  constructor() {
    this.groqClient = groqClient;
    
    if (!this.groqClient.isConfigured()) {
      console.warn('Groq API key not found. AI features will be limited.');
    }
  }

  /**
   * 1. AI-Enhanced Job Matching for Candidates
   * @param {string} candidateId - The candidate's user ID
   * @param {Object} filters - Optional filters for job search
   * @param {string} aiPrompt - Optional AI prompt for personalized matching
   * @returns {Promise<Array>} Array of AI-recommended jobs with enhanced insights
   */
  async fetchAIMatchingJobs(candidateId, filters = {}, aiPrompt = null) {
    try {
      console.log('CandidateAIAgent: Fetching AI-enhanced matching jobs for candidate:', candidateId);

      // Get candidate profile with enhanced data
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

      // Get basic job matches first
      const basicJobs = await this.getBasicJobMatches(candidateProfile, filters);
      
      // Enhance with AI analysis
      const aiEnhancedJobs = await this.enhanceJobsWithAI(
        basicJobs, 
        candidateProfile, 
        aiPrompt
      );

      console.log(`CandidateAIAgent: Found ${aiEnhancedJobs.length} AI-enhanced job matches`);
      return aiEnhancedJobs;

    } catch (error) {
      console.error('CandidateAIAgent: Error fetching AI matching jobs:', error);
      throw error;
    }
  }

  /**
   * 2. AI Career Coaching and Job Search Optimization
   * @param {string} candidateId - The candidate's user ID
   * @param {string} query - Career question or request
   * @returns {Promise<Object>} AI career coaching response
   */
  async getCareerCoaching(candidateId, query) {
    try {
      console.log('CandidateAIAgent: Getting career coaching for candidate:', candidateId);

      // Get candidate profile for context
      const { data: candidateProfile, error: profileError } = await supabase
        .from('job_seeker_profiles')
        .select(`
          id,
          headline,
          summary,
          experience_years,
          current_location,
          skills,
          preferred_job_types,
          target_salary_range,
          ai_career_insights,
          profiles!inner(full_name)
        `)
        .eq('id', candidateId)
        .single();

      if (profileError) throw profileError;

      const systemPrompt = this.getCareerCoachingSystemPrompt(candidateProfile);
      
      const response = await this.callGroqAI([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: query }
      ]);

      return {
        response: response.content,
        suggestions: this.extractCareerSuggestions(response.content),
        actionItems: this.extractActionItems(response.content)
      };

    } catch (error) {
      console.error('CandidateAIAgent: Error getting career coaching:', error);
      throw error;
    }
  }

  /**
   * 3. AI Resume Analysis and Improvement
   * @param {string} candidateId - The candidate's user ID
   * @param {string} resumeText - Resume text to analyze
   * @returns {Promise<Object>} AI resume analysis and suggestions
   */
  async analyzeResume(candidateId, resumeText) {
    try {
      console.log('CandidateAIAgent: Analyzing resume for candidate:', candidateId);

      const systemPrompt = `You are an expert career coach and resume analyst. Analyze the provided resume and give specific, actionable feedback.

      Focus on:
      1. ATS optimization (keywords, formatting, structure)
      2. Skills presentation and relevance
      3. Experience descriptions and impact
      4. Overall strength and weaknesses
      5. Specific improvement suggestions

      Provide a detailed analysis with specific recommendations.`;

      const response = await this.callGroqAI([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Please analyze this resume:\n\n${resumeText}` }
      ]);

      return {
        analysis: response.content,
        strengths: this.extractStrengths(response.content),
        improvements: this.extractImprovements(response.content),
        atsScore: this.calculateATSScore(resumeText),
        suggestions: this.extractResumeSuggestions(response.content)
      };

    } catch (error) {
      console.error('CandidateAIAgent: Error analyzing resume:', error);
      throw error;
    }
  }

  /**
   * 4. AI Interview Preparation
   * @param {string} candidateId - The candidate's user ID
   * @param {string} jobId - The job ID for interview preparation
   * @param {string} interviewType - Type of interview (technical, behavioral, etc.)
   * @returns {Promise<Object>} AI interview preparation materials
   */
  async prepareForInterview(candidateId, jobId, interviewType = 'general') {
    try {
      console.log('CandidateAIAgent: Preparing interview for candidate:', candidateId);

      // Get job details
      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .select(`
          *,
          companies(name, industry)
        `)
        .eq('id', jobId)
        .single();

      if (jobError) throw jobError;

      // Get candidate profile
      const { data: candidateProfile, error: profileError } = await supabase
        .from('job_seeker_profiles')
        .select(`
          id,
          headline,
          summary,
          experience_years,
          skills,
          profiles!inner(full_name)
        `)
        .eq('id', candidateId)
        .single();

      if (profileError) throw profileError;

      const systemPrompt = this.getInterviewPreparationSystemPrompt(job, candidateProfile, interviewType);
      
      const response = await this.callGroqAI([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Prepare me for a ${interviewType} interview for the ${job.title} position at ${job.companies.name}.` }
      ]);

      return {
        preparation: response.content,
        questions: this.extractInterviewQuestions(response.content),
        tips: this.extractInterviewTips(response.content),
        research: this.extractCompanyResearch(response.content)
      };

    } catch (error) {
      console.error('CandidateAIAgent: Error preparing for interview:', error);
      throw error;
    }
  }

  /**
   * 5. AI Salary Negotiation Guidance
   * @param {string} candidateId - The candidate's user ID
   * @param {string} jobId - The job ID
   * @param {Object} offerDetails - Job offer details
   * @returns {Promise<Object>} AI salary negotiation guidance
   */
  async getSalaryNegotiationGuidance(candidateId, jobId, offerDetails) {
    try {
      console.log('CandidateAIAgent: Getting salary negotiation guidance for candidate:', candidateId);

      // Get job and candidate details
      const [jobData, candidateData] = await Promise.all([
        supabase.from('jobs').select('*').eq('id', jobId).single(),
        supabase.from('job_seeker_profiles').select('*').eq('id', candidateId).single()
      ]);

      if (jobData.error) throw jobData.error;
      if (candidateData.error) throw candidateData.error;

      const systemPrompt = `You are an expert salary negotiation coach. Provide specific, actionable guidance for salary negotiation.

      Consider:
      1. Market rates for the position and location
      2. Candidate's experience and skills
      3. Company size and industry
      4. Current offer details
      5. Negotiation strategies and scripts
      6. Alternative benefits to negotiate

      Provide specific talking points and strategies.`;

      const context = `
      Job: ${jobData.data.title}
      Location: ${jobData.data.location}
      Company: ${jobData.data.companies?.name || 'Unknown'}
      Candidate Experience: ${candidateData.data.experience_years} years
      Candidate Skills: ${candidateData.data.skills?.join(', ') || 'Not specified'}
      Current Offer: ${JSON.stringify(offerDetails)}
      `;

      const response = await this.callGroqAI([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Help me negotiate this offer: ${context}` }
      ]);

      return {
        guidance: response.content,
        strategies: this.extractNegotiationStrategies(response.content),
        talkingPoints: this.extractTalkingPoints(response.content),
        marketData: this.extractMarketData(response.content)
      };

    } catch (error) {
      console.error('CandidateAIAgent: Error getting salary negotiation guidance:', error);
      throw error;
    }
  }

  // Helper Methods

  /**
   * Get basic job matches using traditional algorithm
   */
  async getBasicJobMatches(candidateProfile, filters) {
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

    // Filter by matching skills
    if (candidateProfile.skills && candidateProfile.skills.length > 0) {
      query = query.contains('skills_required', candidateProfile.skills);
    }

    const { data: jobs, error } = await query;
    if (error) throw error;

    return jobs || [];
  }

  /**
   * Enhance jobs with AI analysis
   */
  async enhanceJobsWithAI(jobs, candidateProfile, aiPrompt) {
    if (!this.aiApiKey) {
      console.warn('Groq API key not found, returning basic matches');
      return jobs.map(job => {
        const percentage = computeUnifiedMatchScore({ candidate: candidateProfile, job });
        return {
          ...job,
          aiInsights: 'AI analysis not available',
          matchScore: percentage,
          aiRecommendation: 'Enable AI features for personalized recommendations'
        };
      });
    }

    const enhancedJobs = [];
    
    for (const job of jobs.slice(0, 10)) { // Limit to top 10 for AI processing
      try {
        const aiAnalysis = await this.analyzeJobMatch(candidateProfile, job, aiPrompt);
        const fallback = computeUnifiedMatchScore({ candidate: candidateProfile, job });
        enhancedJobs.push({
          ...job,
          ...aiAnalysis,
          matchScore: aiAnalysis.matchScore || fallback
        });
      } catch (error) {
        console.error('Error enhancing job with AI:', error);
        const fallback = computeUnifiedMatchScore({ candidate: candidateProfile, job });
        enhancedJobs.push({
          ...job,
          matchScore: fallback,
          aiInsights: 'AI analysis failed',
          aiRecommendation: 'Basic match based on skills and experience'
        });
      }
    }

    return enhancedJobs.sort((a, b) => b.matchScore - a.matchScore);
  }

  /**
   * Analyze individual job match with AI
   */
  async analyzeJobMatch(candidateProfile, job, aiPrompt) {
    const systemPrompt = `You are an expert career advisor and job matching specialist. Analyze how well a job matches a candidate's profile and provide personalized insights.

    Focus on:
    1. Skills alignment and gaps
    2. Career growth potential
    3. Cultural fit
    4. Salary expectations
    5. Location and work preferences
    6. Specific recommendations for the candidate

    Provide a match score (0-100) and detailed reasoning.`;

    const context = `
    Candidate Profile:
    - Name: ${candidateProfile.profiles?.full_name || 'Unknown'}
    - Headline: ${candidateProfile.headline || 'Not specified'}
    - Experience: ${candidateProfile.experience_years || 0} years
    - Skills: ${candidateProfile.skills?.join(', ') || 'Not specified'}
    - Location: ${candidateProfile.current_location || 'Not specified'}
    - Preferred Job Types: ${candidateProfile.preferred_job_types?.join(', ') || 'Not specified'}
    - Target Salary: ${JSON.stringify(candidateProfile.target_salary_range) || 'Not specified'}

    Job Details:
    - Title: ${job.title}
    - Company: ${job.companies?.name || 'Unknown'}
    - Location: ${job.location}
    - Type: ${job.job_type}
    - Experience Required: ${job.experience_level}
    - Skills Required: ${job.skills_required?.join(', ') || 'Not specified'}
    - Description: ${job.description?.substring(0, 500)}...

    ${aiPrompt ? `Additional Context: ${aiPrompt}` : ''}
    `;

    const response = await this.callGroqAI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: context }
    ]);

    return this.parseAIJobAnalysis(response.content);
  }

  /**
   * Call Groq AI API
   */
  async callGroqAI(messages) {
    if (!this.groqClient.isConfigured()) {
      throw new Error('Groq API key not found');
    }

    const response = await this.groqClient.chatCompletion(messages, {
      model: 'llama-3.3-70b-versatile',
      maxTokens: 2000,
      temperature: 0.7
    });

    const data = await response.json();
    return data.choices[0].message;
  }

  /**
   * Get career coaching system prompt
   */
  getCareerCoachingSystemPrompt(candidateProfile) {
    return `You are an expert career coach and job search strategist. Help candidates with their career development and job search.

    Candidate Context:
    - Name: ${candidateProfile.profiles?.full_name || 'Unknown'}
    - Experience: ${candidateProfile.experience_years || 0} years
    - Current Role: ${candidateProfile.headline || 'Not specified'}
    - Skills: ${candidateProfile.skills?.join(', ') || 'Not specified'}
    - Location: ${candidateProfile.current_location || 'Not specified'}

    Provide:
    1. Specific, actionable advice
    2. Industry insights and trends
    3. Career development strategies
    4. Job search optimization tips
    5. Skill development recommendations
    6. Networking strategies

    Be encouraging, professional, and specific in your recommendations.`;
  }

  /**
   * Get interview preparation system prompt
   */
  getInterviewPreparationSystemPrompt(job, candidateProfile, interviewType) {
    return `You are an expert interview coach. Prepare candidates for job interviews with specific, actionable guidance.

    Job Context:
    - Position: ${job.title}
    - Company: ${job.companies?.name || 'Unknown'}
    - Industry: ${job.companies?.industry || 'Not specified'}
    - Requirements: ${job.requirements || 'Not specified'}
    - Skills Needed: ${job.skills_required?.join(', ') || 'Not specified'}

    Candidate Context:
    - Experience: ${candidateProfile.experience_years || 0} years
    - Skills: ${candidateProfile.skills?.join(', ') || 'Not specified'}
    - Background: ${candidateProfile.summary || 'Not specified'}

    Interview Type: ${interviewType}

    Provide:
    1. Specific questions they might ask
    2. How to answer using their experience
    3. Questions to ask the interviewer
    4. Company research points
    5. Technical preparation (if applicable)
    6. Behavioral examples to prepare
    7. Follow-up strategies

    Make it specific to their background and the job requirements.`;
  }

  /**
   * Parse AI job analysis response
   */
  parseAIJobAnalysis(content) {
    // Extract match score
    const scoreMatch = content.match(/(?:match score|score):?\s*(\d+)/i);
    const matchScore = scoreMatch ? parseInt(scoreMatch[1]) / 100 : 0.7;

    // Extract insights
    const insightsMatch = content.match(/(?:insights?|analysis):?\s*([^]*?)(?:\n\n|\n[A-Z]|$)/i);
    const aiInsights = insightsMatch ? insightsMatch[1].trim() : content;

    // Extract recommendation
    const recommendationMatch = content.match(/(?:recommendation|suggestion):?\s*([^]*?)(?:\n\n|\n[A-Z]|$)/i);
    const aiRecommendation = recommendationMatch ? recommendationMatch[1].trim() : 'Consider this opportunity based on your career goals.';

    return {
      matchScore,
      aiInsights,
      aiRecommendation,
      strengths: this.extractJobStrengths(content),
      concerns: this.extractJobConcerns(content),
      actionItems: this.extractJobActionItems(content)
    };
  }

  /**
   * Calculate basic match score without AI
   */
  calculateBasicMatchScore(candidateProfile, job) {
    let score = 0;
    let totalWeight = 0;

    // Skills matching (40% weight)
    if (candidateProfile.skills && job.skills_required && candidateProfile.skills.length > 0) {
      const matchingSkills = candidateProfile.skills.filter(skill => 
        job.skills_required.includes(skill)
      ).length;
      const skillScore = matchingSkills / job.skills_required.length;
      score += skillScore * 0.4;
      totalWeight += 0.4;
    }

    // Experience level matching (25% weight)
    if (candidateProfile.experience_years !== null && job.experience_level) {
      const experienceScore = this.calculateExperienceMatch(candidateProfile.experience_years, job.experience_level);
      score += experienceScore * 0.25;
      totalWeight += 0.25;
    }

    // Job type preference (15% weight)
    if (candidateProfile.preferred_job_types && candidateProfile.preferred_job_types.length > 0) {
      const jobTypeScore = candidateProfile.preferred_job_types.includes(job.job_type) ? 1 : 0;
      score += jobTypeScore * 0.15;
      totalWeight += 0.15;
    }

    // Location matching (10% weight)
    if (candidateProfile.current_location && job.location) {
      const locationScore = this.calculateLocationMatch(candidateProfile, job);
      score += locationScore * 0.1;
      totalWeight += 0.1;
    }

    // Salary expectations (10% weight)
    if (candidateProfile.target_salary_range && job.salary_range) {
      const salaryScore = this.calculateSalaryMatch(candidateProfile.target_salary_range, job.salary_range);
      score += salaryScore * 0.1;
      totalWeight += 0.1;
    }

    return totalWeight > 0 ? score / totalWeight : 0;
  }

  // Additional helper methods for parsing AI responses
  extractCareerSuggestions(content) {
    const suggestions = [];
    const lines = content.split('\n');
    for (const line of lines) {
      if (line.match(/^[-•]\s/) || line.match(/^\d+\.\s/)) {
        suggestions.push(line.trim());
      }
    }
    return suggestions.slice(0, 5);
  }

  extractActionItems(content) {
    const actionItems = [];
    const lines = content.split('\n');
    for (const line of lines) {
      if (line.toLowerCase().includes('action') || line.toLowerCase().includes('next step')) {
        actionItems.push(line.trim());
      }
    }
    return actionItems.slice(0, 3);
  }

  extractStrengths(content) {
    const strengths = [];
    const lines = content.split('\n');
    for (const line of lines) {
      if (line.toLowerCase().includes('strength') || line.toLowerCase().includes('strong')) {
        strengths.push(line.trim());
      }
    }
    return strengths.slice(0, 3);
  }

  extractImprovements(content) {
    const improvements = [];
    const lines = content.split('\n');
    for (const line of lines) {
      if (line.toLowerCase().includes('improve') || line.toLowerCase().includes('weakness')) {
        improvements.push(line.trim());
      }
    }
    return improvements.slice(0, 3);
  }

  calculateATSScore(resumeText) {
    // Simple ATS score calculation
    const keywords = ['experience', 'skills', 'education', 'achievements', 'responsibilities'];
    const foundKeywords = keywords.filter(keyword => 
      resumeText.toLowerCase().includes(keyword)
    ).length;
    return Math.round((foundKeywords / keywords.length) * 100);
  }

  extractResumeSuggestions(content) {
    const suggestions = [];
    const lines = content.split('\n');
    for (const line of lines) {
      if (line.match(/^[-•]\s/) || line.match(/^\d+\.\s/)) {
        suggestions.push(line.trim());
      }
    }
    return suggestions.slice(0, 5);
  }

  extractInterviewQuestions(content) {
    const questions = [];
    const lines = content.split('\n');
    for (const line of lines) {
      if (line.includes('?') && (line.includes('might ask') || line.includes('likely to ask'))) {
        questions.push(line.trim());
      }
    }
    return questions.slice(0, 5);
  }

  extractInterviewTips(content) {
    const tips = [];
    const lines = content.split('\n');
    for (const line of lines) {
      if (line.match(/^[-•]\s/) || line.match(/^\d+\.\s/)) {
        tips.push(line.trim());
      }
    }
    return tips.slice(0, 5);
  }

  extractCompanyResearch(content) {
    const research = [];
    const lines = content.split('\n');
    for (const line of lines) {
      if (line.toLowerCase().includes('research') || line.toLowerCase().includes('company')) {
        research.push(line.trim());
      }
    }
    return research.slice(0, 3);
  }

  extractNegotiationStrategies(content) {
    const strategies = [];
    const lines = content.split('\n');
    for (const line of lines) {
      if (line.match(/^[-•]\s/) || line.match(/^\d+\.\s/)) {
        strategies.push(line.trim());
      }
    }
    return strategies.slice(0, 5);
  }

  extractTalkingPoints(content) {
    const talkingPoints = [];
    const lines = content.split('\n');
    for (const line of lines) {
      if (line.toLowerCase().includes('say') || line.toLowerCase().includes('mention')) {
        talkingPoints.push(line.trim());
      }
    }
    return talkingPoints.slice(0, 3);
  }

  extractMarketData(content) {
    const marketData = [];
    const lines = content.split('\n');
    for (const line of lines) {
      if (line.toLowerCase().includes('market') || line.toLowerCase().includes('salary')) {
        marketData.push(line.trim());
      }
    }
    return marketData.slice(0, 3);
  }

  extractJobStrengths(content) {
    const strengths = [];
    const lines = content.split('\n');
    for (const line of lines) {
      if (line.toLowerCase().includes('strength') || line.toLowerCase().includes('good fit')) {
        strengths.push(line.trim());
      }
    }
    return strengths.slice(0, 3);
  }

  extractJobConcerns(content) {
    const concerns = [];
    const lines = content.split('\n');
    for (const line of lines) {
      if (line.toLowerCase().includes('concern') || line.toLowerCase().includes('consider')) {
        concerns.push(line.trim());
      }
    }
    return concerns.slice(0, 3);
  }

  extractJobActionItems(content) {
    const actionItems = [];
    const lines = content.split('\n');
    for (const line of lines) {
      if (line.match(/^[-•]\s/) || line.match(/^\d+\.\s/)) {
        actionItems.push(line.trim());
      }
    }
    return actionItems.slice(0, 3);
  }

  // Experience and location matching helpers
  calculateExperienceMatch(candidateExperience, jobExperienceLevel) {
    const experienceRanges = {
      'entry': { min: 0, max: 2 },
      'mid': { min: 2, max: 5 },
      'senior': { min: 5, max: 8 },
      'lead': { min: 8, max: 12 },
      'executive': { min: 12, max: 50 }
    };

    const range = experienceRanges[jobExperienceLevel];
    if (!range) return 0.5;

    if (candidateExperience >= range.min && candidateExperience <= range.max) {
      return 1.0;
    } else if (candidateExperience < range.min) {
      const gap = range.min - candidateExperience;
      return Math.max(0, 1 - (gap / range.min));
    } else {
      const excess = candidateExperience - range.max;
      return Math.max(0.7, 1 - (excess / 10));
    }
  }

  calculateLocationMatch(candidateProfile, job) {
    if (!candidateProfile.current_location || !job.location) return 0.5;

    const candidateLocation = candidateProfile.current_location.toLowerCase();
    const jobLocation = job.location.toLowerCase();

    if (candidateLocation === jobLocation) return 1.0;

    if (candidateProfile.willing_to_relocate) {
      if (candidateProfile.preferred_locations && candidateProfile.preferred_locations.length > 0) {
        const preferredMatch = candidateProfile.preferred_locations.some(loc => 
          loc.toLowerCase().includes(jobLocation) || jobLocation.includes(loc.toLowerCase())
        );
        if (preferredMatch) return 0.9;
      }
      return 0.7;
    }

    const candidateParts = candidateLocation.split(',').map(part => part.trim());
    const jobParts = jobLocation.split(',').map(part => part.trim());
    
    const hasCommonPart = candidateParts.some(part => 
      jobParts.some(jobPart => 
        part.includes(jobPart) || jobPart.includes(part)
      )
    );

    return hasCommonPart ? 0.6 : 0.3;
  }

  calculateSalaryMatch(candidateSalary, jobSalary) {
    if (!candidateSalary || !jobSalary) return 0.5;

    if (jobSalary.type === 'negotiable') return 0.8;
    if (!candidateSalary.min && !candidateSalary.max) return 0.6;

    const candidateMin = candidateSalary.min || 0;
    const candidateMax = candidateSalary.max || candidateSalary.min || 0;

    if (jobSalary.type === 'fixed') {
      const jobSalaryValue = jobSalary.fixed || 0;
      if (jobSalaryValue >= candidateMin && jobSalaryValue <= candidateMax) {
        return 1.0;
      } else if (jobSalaryValue < candidateMin) {
        return 0.3;
      } else {
        return 0.8;
      }
    } else if (jobSalary.type === 'range') {
      const jobMin = jobSalary.min || 0;
      const jobMax = jobSalary.max || 0;
      
      if (candidateMax >= jobMin && candidateMin <= jobMax) {
        return 1.0;
      } else if (candidateMin > jobMax) {
        return 0.2;
      } else {
        return 0.6;
      }
    }

    return 0.5;
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      timeout: this.cacheTimeout
    };
  }
}

// Export singleton instance
export const candidateAIAgent = new CandidateAIAgent();
export default CandidateAIAgent;

import { supabase } from '../clients/supabaseClient';
import { computeUnifiedMatchScore } from '../utils/unifiedMatchScore';
import { groqClient } from '../clients/groqClient';

/**
 * Employer AI Agent - AI-powered candidate matching and job creation for employers
 * 
 * Features:
 * 1. AI-enhanced candidate recommendations with intelligent insights
 * 2. AI-powered job post creation and optimization
 * 3. Candidate evaluation and interview preparation
 * 4. Market insights and compensation analysis
 * 5. Resume analysis and hiring recommendations
 */

class EmployerAIAgent {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    this.groqClient = groqClient;
    
    if (!this.groqClient.isConfigured()) {
      console.warn('Groq API key not found. AI features will be disabled.');
    }
  }

  /**
   * 1. AI-Enhanced Candidate Recommendations
   * @param {string} jobId - The job ID
   * @param {Object} filters - Optional filters for candidate search
   * @param {string} aiPrompt - Optional AI prompt for personalized matching
   * @returns {Promise<Array>} Array of AI-recommended candidates with enhanced insights
   */
  async fetchAICandidateRecommendations(jobId, filters = {}, aiPrompt = null) {
    try {
      console.log('EmployerAIAgent: Fetching AI-enhanced candidate recommendations for job:', jobId);

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

      // Get basic candidate matches first
      const basicCandidates = await this.getBasicCandidateMatches(job, filters);
      
      // Enhance with AI analysis
      const aiEnhancedCandidates = await this.enhanceCandidatesWithAI(
        basicCandidates, 
        job, 
        aiPrompt
      );

      console.log(`EmployerAIAgent: Found ${aiEnhancedCandidates.length} AI-enhanced candidate recommendations`);
      return aiEnhancedCandidates;

    } catch (error) {
      console.error('EmployerAIAgent: Error fetching AI candidate recommendations:', error);
      throw error;
    }
  }

  /**
   * 2. AI-Powered Job Post Creation and Optimization
   * @param {Object} jobData - Basic job data
   * @param {string} companyId - Company ID
   * @param {string} employerId - Employer ID
   * @param {string} aiPrompt - AI prompt for job creation
   * @returns {Promise<Object>} AI-optimized job post
   */
  async createAIJobPost(jobData, companyId, employerId, aiPrompt = null) {
    try {
      console.log('EmployerAIAgent: Creating AI-optimized job post');

      // Get company details for context
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();

      if (companyError) throw companyError;

      // Enhance job data with AI
      const aiEnhancedJobData = await this.enhanceJobDataWithAI(jobData, company, aiPrompt);

      // Create the job post
      const jobPayload = {
        company_id: companyId,
        created_by: employerId,
        title: aiEnhancedJobData.title,
        description: aiEnhancedJobData.description,
        requirements: aiEnhancedJobData.requirements,
        responsibilities: aiEnhancedJobData.responsibilities,
        location: aiEnhancedJobData.location,
        is_remote: aiEnhancedJobData.is_remote || false,
        is_hybrid: aiEnhancedJobData.is_hybrid || false,
        job_type: aiEnhancedJobData.job_type,
        experience_level: aiEnhancedJobData.experience_level,
        skills_required: aiEnhancedJobData.skills_required || [],
        benefits: aiEnhancedJobData.benefits || [],
        application_deadline: aiEnhancedJobData.application_deadline || null,
        start_date: aiEnhancedJobData.start_date || null,
        drivers_license: aiEnhancedJobData.drivers_license || false,
        additional_questions: aiEnhancedJobData.additional_questions || [],
        preferred_language: aiEnhancedJobData.preferred_language || 'english',
        priority: aiEnhancedJobData.priority || 'normal',
        status: aiEnhancedJobData.status || 'active',
        support_tier_id: aiEnhancedJobData.support_tier_id || 1,
        // Handle salary data
        salary_type: aiEnhancedJobData.salary_type || 'negotiable',
        salary_currency: aiEnhancedJobData.salary_currency || 'USD',
        salary_period: aiEnhancedJobData.salary_period || 'annually',
        ...(aiEnhancedJobData.salary_min && { salary_min: parseFloat(aiEnhancedJobData.salary_min) }),
        ...(aiEnhancedJobData.salary_max && { salary_max: parseFloat(aiEnhancedJobData.salary_max) }),
        ...(aiEnhancedJobData.salary_fixed && { salary_fixed: parseFloat(aiEnhancedJobData.salary_fixed) })
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

      console.log('EmployerAIAgent: AI-optimized job created successfully:', newJob.id);
      return {
        job: newJob,
        aiInsights: aiEnhancedJobData.aiInsights,
        optimizationTips: aiEnhancedJobData.optimizationTips
      };

    } catch (error) {
      console.error('EmployerAIAgent: Error creating AI job post:', error);
      throw error;
    }
  }

  /**
   * 3. AI Candidate Evaluation and Analysis
   * @param {string} candidateId - The candidate's user ID
   * @param {string} jobId - The job ID
   * @param {string} evaluationType - Type of evaluation (resume, interview, overall)
   * @returns {Promise<Object>} AI candidate evaluation
   */
  async evaluateCandidate(candidateId, jobId, evaluationType = 'overall') {
    try {
      console.log('EmployerAIAgent: Evaluating candidate:', candidateId);

      // Get candidate and job details
      const [candidateData, jobData] = await Promise.all([
        supabase
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
          .single(),
        supabase
          .from('jobs')
          .select(`
            *,
            companies(name, industry)
          `)
          .eq('id', jobId)
          .single()
      ]);

      if (candidateData.error) throw candidateData.error;
      if (jobData.error) throw jobData.error;

      const systemPrompt = this.getCandidateEvaluationSystemPrompt(jobData.data, evaluationType);
      
      const context = `
      Candidate Profile:
      - Name: ${candidateData.data.profiles?.full_name || 'Unknown'}
      - Headline: ${candidateData.data.headline || 'Not specified'}
      - Experience: ${candidateData.data.experience_years || 0} years
      - Skills: ${candidateData.data.skills?.join(', ') || 'Not specified'}
      - Summary: ${candidateData.data.summary || 'Not specified'}
      - Location: ${candidateData.data.current_location || 'Not specified'}

      Job Requirements:
      - Title: ${jobData.data.title}
      - Company: ${jobData.data.companies?.name || 'Unknown'}
      - Experience Required: ${jobData.data.experience_level}
      - Skills Required: ${jobData.data.skills_required?.join(', ') || 'Not specified'}
      - Description: ${jobData.data.description?.substring(0, 500)}...
      `;

      const response = await this.callGroqAI([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: context }
      ]);

      return {
        evaluation: response.content,
        strengths: this.extractCandidateStrengths(response.content),
        concerns: this.extractCandidateConcerns(response.content),
        recommendations: this.extractHiringRecommendations(response.content),
        interviewQuestions: this.extractInterviewQuestions(response.content),
        overallScore: this.calculateOverallScore(response.content)
      };

    } catch (error) {
      console.error('EmployerAIAgent: Error evaluating candidate:', error);
      throw error;
    }
  }

  /**
   * 4. AI Market Insights and Compensation Analysis
   * @param {string} jobTitle - Job title to analyze
   * @param {string} location - Location to analyze
   * @param {string} industry - Industry context
   * @returns {Promise<Object>} AI market insights
   */
  async getMarketInsights(jobTitle, location, industry = null) {
    try {
      console.log('EmployerAIAgent: Getting market insights for:', jobTitle);

      const systemPrompt = `You are an expert talent acquisition and market research specialist. Provide comprehensive market insights for hiring.

      Focus on:
      1. Current market demand and trends
      2. Salary ranges and compensation benchmarks
      3. Required skills and qualifications
      4. Candidate availability and competition
      5. Hiring timeline expectations
      6. Best practices for attracting top talent
      7. Industry-specific insights

      Provide specific, actionable data and recommendations.`;

      const context = `
      Job Title: ${jobTitle}
      Location: ${location}
      Industry: ${industry || 'Not specified'}
      `;

      const response = await this.callGroqAI([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: context }
      ]);

      return {
        insights: response.content,
        salaryRange: this.extractSalaryRange(response.content),
        skillsInDemand: this.extractSkillsInDemand(response.content),
        marketTrends: this.extractMarketTrends(response.content),
        hiringTips: this.extractHiringTips(response.content),
        competitionLevel: this.extractCompetitionLevel(response.content)
      };

    } catch (error) {
      console.error('EmployerAIAgent: Error getting market insights:', error);
      throw error;
    }
  }

  /**
   * 5. AI Resume Analysis and Hiring Recommendations
   * @param {string} resumeText - Resume text to analyze
   * @param {string} jobId - Job ID for context
   * @returns {Promise<Object>} AI resume analysis
   */
  async analyzeResumeForHiring(resumeText, jobId) {
    try {
      console.log('EmployerAIAgent: Analyzing resume for hiring decision');

      // Get job details for context
      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .select(`
          *,
          companies(name, industry)
        `)
        .eq('id', jobId)
        .single();

      if (jobError) throw jobError;

      const systemPrompt = `You are an expert recruiter and hiring manager. Analyze this resume for a specific job position and provide hiring recommendations.

      Job Context:
      - Title: ${job.title}
      - Company: ${job.companies?.name || 'Unknown'}
      - Requirements: ${job.requirements || 'Not specified'}
      - Skills Required: ${job.skills_required?.join(', ') || 'Not specified'}

      Analyze:
      1. Skills alignment with job requirements
      2. Experience relevance and depth
      3. Career progression and growth potential
      4. Cultural fit indicators
      5. Red flags or concerns
      6. Interview focus areas
      7. Overall hiring recommendation

      Provide specific, actionable insights for the hiring decision.`;

      const response = await this.callGroqAI([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Please analyze this resume for the ${job.title} position:\n\n${resumeText}` }
      ]);

      return {
        analysis: response.content,
        skillsMatch: this.extractSkillsMatch(response.content),
        experienceRelevance: this.extractExperienceRelevance(response.content),
        hiringRecommendation: this.extractHiringRecommendation(response.content),
        interviewFocus: this.extractInterviewFocus(response.content),
        redFlags: this.extractRedFlags(response.content),
        strengths: this.extractResumeStrengths(response.content),
        overallScore: this.calculateResumeScore(response.content)
      };

    } catch (error) {
      console.error('EmployerAIAgent: Error analyzing resume:', error);
      throw error;
    }
  }

  /**
   * 6. AI Interview Preparation for Employers
   * @param {string} candidateId - The candidate's user ID
   * @param {string} jobId - The job ID
   * @param {string} interviewType - Type of interview
   * @returns {Promise<Object>} AI interview preparation
   */
  async prepareInterviewForEmployer(candidateId, jobId, interviewType = 'general') {
    try {
      console.log('EmployerAIAgent: Preparing interview for employer');

      // Get candidate and job details
      const [candidateData, jobData] = await Promise.all([
        supabase
          .from('job_seeker_profiles')
          .select(`
            *,
            profiles!inner(full_name)
          `)
          .eq('id', candidateId)
          .single(),
        supabase
          .from('jobs')
          .select(`
            *,
            companies(name, industry)
          `)
          .eq('id', jobId)
          .single()
      ]);

      if (candidateData.error) throw candidateData.error;
      if (jobData.error) throw jobData.error;

      const systemPrompt = `You are an expert interviewer and hiring manager. Prepare comprehensive interview guidance for evaluating a candidate.

      Focus on:
      1. Specific questions to ask based on their background
      2. Skills assessment techniques
      3. Behavioral interview questions
      4. Technical evaluation methods
      5. Cultural fit assessment
      6. Red flags to watch for
      7. Follow-up questions and probing techniques

      Make it specific to the candidate's profile and job requirements.`;

      const context = `
      Candidate: ${candidateData.data.profiles?.full_name || 'Unknown'}
      Experience: ${candidateData.data.experience_years || 0} years
      Skills: ${candidateData.data.skills?.join(', ') || 'Not specified'}
      Background: ${candidateData.data.summary || 'Not specified'}

      Job: ${jobData.data.title}
      Company: ${jobData.data.companies?.name || 'Unknown'}
      Requirements: ${jobData.data.requirements || 'Not specified'}
      Skills Needed: ${jobData.data.skills_required?.join(', ') || 'Not specified'}

      Interview Type: ${interviewType}
      `;

      const response = await this.callGroqAI([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: context }
      ]);

      return {
        preparation: response.content,
        questions: this.extractInterviewQuestions(response.content),
        assessmentMethods: this.extractAssessmentMethods(response.content),
        redFlags: this.extractInterviewRedFlags(response.content),
        followUpQuestions: this.extractFollowUpQuestions(response.content),
        evaluationCriteria: this.extractEvaluationCriteria(response.content)
      };

    } catch (error) {
      console.error('EmployerAIAgent: Error preparing interview:', error);
      throw error;
    }
  }

  // Helper Methods

  /**
   * Get basic candidate matches using traditional algorithm
   */
  async getBasicCandidateMatches(job, filters) {
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

    query = query.limit(100);

    const { data: candidates, error } = await query;
    if (error) throw error;

    return candidates || [];
  }

  /**
   * Enhance candidates with AI analysis
   */
  async enhanceCandidatesWithAI(candidates, job, aiPrompt) {
    if (!this.aiApiKey) {
      console.warn('Groq API key not found, returning basic matches');
      return candidates.map(candidate => {
        const percentage = computeUnifiedMatchScore({ candidate, job });
        return {
          ...candidate,
          aiInsights: 'AI analysis not available',
          matchScore: percentage,
          aiRecommendation: 'Enable AI features for personalized recommendations'
        };
      });
    }

    const enhancedCandidates = [];
    
    for (const candidate of candidates.slice(0, 10)) { // Limit to top 10 for AI processing
      try {
        const aiAnalysis = await this.analyzeCandidateMatch(candidate, job, aiPrompt);
        const fallback = computeUnifiedMatchScore({ candidate, job });
        enhancedCandidates.push({
          ...candidate,
          ...aiAnalysis,
          matchScore: aiAnalysis.matchScore || fallback
        });
      } catch (error) {
        console.error('Error enhancing candidate with AI:', error);
        const fallback = computeUnifiedMatchScore({ candidate, job });
        enhancedCandidates.push({
          ...candidate,
          matchScore: fallback,
          aiInsights: 'AI analysis failed',
          aiRecommendation: 'Basic match based on skills and experience'
        });
      }
    }

    return enhancedCandidates.sort((a, b) => b.matchScore - a.matchScore);
  }

  /**
   * Analyze individual candidate match with AI
   */
  async analyzeCandidateMatch(candidate, job, aiPrompt) {
    const systemPrompt = `You are an expert recruiter and talent acquisition specialist. Analyze how well a candidate matches a job position and provide hiring insights.

    Focus on:
    1. Skills alignment and gaps
    2. Experience relevance and depth
    3. Cultural fit and team compatibility
    4. Growth potential and career trajectory
    5. Salary expectations alignment
    6. Location and work preferences
    7. Specific hiring recommendations

    Provide a match score (0-100) and detailed reasoning.`;

    const context = `
    Candidate Profile:
    - Name: ${candidate.profiles?.full_name || 'Unknown'}
    - Headline: ${candidate.headline || 'Not specified'}
    - Experience: ${candidate.experience_years || 0} years
    - Skills: ${candidate.skills?.join(', ') || 'Not specified'}
    - Location: ${candidate.current_location || 'Not specified'}
    - Summary: ${candidate.summary || 'Not specified'}
    - Target Salary: ${JSON.stringify(candidate.target_salary_range) || 'Not specified'}

    Job Requirements:
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

    return this.parseAICandidateAnalysis(response.content);
  }

  /**
   * Enhance job data with AI
   */
  async enhanceJobDataWithAI(jobData, company, aiPrompt) {
    if (!this.aiApiKey) {
      console.warn('Groq API key not found, returning basic job data');
      return jobData;
    }

    const systemPrompt = `You are an expert job description writer and talent acquisition specialist. Optimize job postings to attract the best candidates.

    Focus on:
    1. Compelling and clear job titles
    2. Engaging job descriptions that highlight company culture
    3. Comprehensive but concise requirements
    4. Clear responsibilities and expectations
    5. Attractive benefits and perks
    6. Inclusive and diverse language
    7. SEO optimization for job boards

    Provide optimized content that will attract top talent.`;

    const context = `
    Company: ${company.name}
    Industry: ${company.industry || 'Not specified'}
    Size: ${company.size || 'Not specified'}
    
    Job Data:
    ${JSON.stringify(jobData, null, 2)}

    ${aiPrompt ? `Additional Requirements: ${aiPrompt}` : ''}
    `;

    const response = await this.callGroqAI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: context }
    ]);

    return this.parseAIJobEnhancement(response.content, jobData);
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
   * Get candidate evaluation system prompt
   */
  getCandidateEvaluationSystemPrompt(job, evaluationType) {
    return `You are an expert recruiter and hiring manager. Evaluate candidates for specific job positions with detailed analysis.

    Job Context:
    - Position: ${job.title}
    - Company: ${job.companies?.name || 'Unknown'}
    - Industry: ${job.companies?.industry || 'Not specified'}
    - Requirements: ${job.requirements || 'Not specified'}
    - Skills Needed: ${job.skills_required?.join(', ') || 'Not specified'}

    Evaluation Type: ${evaluationType}

    Provide:
    1. Detailed skills and experience analysis
    2. Cultural fit assessment
    3. Growth potential evaluation
    4. Specific strengths and concerns
    5. Interview recommendations
    6. Overall hiring recommendation
    7. Salary negotiation insights

    Be specific, objective, and actionable in your analysis.`;
  }

  /**
   * Parse AI candidate analysis response
   */
  parseAICandidateAnalysis(content) {
    // Extract match score
    const scoreMatch = content.match(/(?:match score|score):?\s*(\d+)/i);
    const matchScore = scoreMatch ? parseInt(scoreMatch[1]) / 100 : 0.7;

    // Extract insights
    const insightsMatch = content.match(/(?:insights?|analysis):?\s*([^]*?)(?:\n\n|\n[A-Z]|$)/i);
    const aiInsights = insightsMatch ? insightsMatch[1].trim() : content;

    // Extract recommendation
    const recommendationMatch = content.match(/(?:recommendation|suggestion):?\s*([^]*?)(?:\n\n|\n[A-Z]|$)/i);
    const aiRecommendation = recommendationMatch ? recommendationMatch[1].trim() : 'Consider this candidate based on their qualifications.';

    return {
      matchScore,
      aiInsights,
      aiRecommendation,
      strengths: this.extractCandidateStrengths(content),
      concerns: this.extractCandidateConcerns(content),
      actionItems: this.extractCandidateActionItems(content)
    };
  }

  /**
   * Parse AI job enhancement response
   */
  parseAIJobEnhancement(content, originalJobData) {
    // Extract enhanced fields
    const titleMatch = content.match(/(?:title|position):?\s*([^\n]+)/i);
    const descriptionMatch = content.match(/(?:description|job description):?\s*([^]*?)(?:\n\n|\n[A-Z]|$)/i);
    const requirementsMatch = content.match(/(?:requirements|qualifications):?\s*([^]*?)(?:\n\n|\n[A-Z]|$)/i);
    const responsibilitiesMatch = content.match(/(?:responsibilities|duties):?\s*([^]*?)(?:\n\n|\n[A-Z]|$)/i);

    return {
      ...originalJobData,
      title: titleMatch ? titleMatch[1].trim() : originalJobData.title,
      description: descriptionMatch ? descriptionMatch[1].trim() : originalJobData.description,
      requirements: requirementsMatch ? requirementsMatch[1].trim() : originalJobData.requirements,
      responsibilities: responsibilitiesMatch ? responsibilitiesMatch[1].trim() : originalJobData.responsibilities,
      aiInsights: this.extractJobInsights(content),
      optimizationTips: this.extractOptimizationTips(content)
    };
  }

  // Additional helper methods for parsing AI responses
  extractCandidateStrengths(content) {
    const strengths = [];
    const lines = content.split('\n');
    for (const line of lines) {
      if (line.toLowerCase().includes('strength') || line.toLowerCase().includes('strong')) {
        strengths.push(line.trim());
      }
    }
    return strengths.slice(0, 5);
  }

  extractCandidateConcerns(content) {
    const concerns = [];
    const lines = content.split('\n');
    for (const line of lines) {
      if (line.toLowerCase().includes('concern') || line.toLowerCase().includes('weakness')) {
        concerns.push(line.trim());
      }
    }
    return concerns.slice(0, 3);
  }

  extractHiringRecommendations(content) {
    const recommendations = [];
    const lines = content.split('\n');
    for (const line of lines) {
      if (line.toLowerCase().includes('recommend') || line.toLowerCase().includes('suggest')) {
        recommendations.push(line.trim());
      }
    }
    return recommendations.slice(0, 3);
  }

  extractInterviewQuestions(content) {
    const questions = [];
    const lines = content.split('\n');
    for (const line of lines) {
      if (line.includes('?') && (line.includes('ask') || line.includes('question'))) {
        questions.push(line.trim());
      }
    }
    return questions.slice(0, 5);
  }

  calculateOverallScore(content) {
    const scoreMatch = content.match(/(?:score|rating):?\s*(\d+)/i);
    return scoreMatch ? parseInt(scoreMatch[1]) : 75;
  }

  extractSalaryRange(content) {
    const salaryMatch = content.match(/(?:salary|compensation).*?(\$[\d,]+(?:-\$[\d,]+)?)/i);
    return salaryMatch ? salaryMatch[1] : 'Not specified';
  }

  extractSkillsInDemand(content) {
    const skills = [];
    const lines = content.split('\n');
    for (const line of lines) {
      if (line.toLowerCase().includes('skill') && line.includes(',')) {
        skills.push(line.trim());
      }
    }
    return skills.slice(0, 3);
  }

  extractMarketTrends(content) {
    const trends = [];
    const lines = content.split('\n');
    for (const line of lines) {
      if (line.toLowerCase().includes('trend') || line.toLowerCase().includes('market')) {
        trends.push(line.trim());
      }
    }
    return trends.slice(0, 3);
  }

  extractHiringTips(content) {
    const tips = [];
    const lines = content.split('\n');
    for (const line of lines) {
      if (line.match(/^[-•]\s/) || line.match(/^\d+\.\s/)) {
        tips.push(line.trim());
      }
    }
    return tips.slice(0, 5);
  }

  extractCompetitionLevel(content) {
    const competitionMatch = content.match(/(?:competition|competitive).*?(high|medium|low)/i);
    return competitionMatch ? competitionMatch[1] : 'medium';
  }

  extractSkillsMatch(content) {
    const matchMatch = content.match(/(?:skills match|match).*?(\d+%)/i);
    return matchMatch ? matchMatch[1] : '75%';
  }

  extractExperienceRelevance(content) {
    const relevanceMatch = content.match(/(?:experience|relevant).*?(high|medium|low)/i);
    return relevanceMatch ? relevanceMatch[1] : 'medium';
  }

  extractHiringRecommendation(content) {
    const recommendationMatch = content.match(/(?:recommend|suggest).*?(hire|consider|pass)/i);
    return recommendationMatch ? recommendationMatch[1] : 'consider';
  }

  extractInterviewFocus(content) {
    const focus = [];
    const lines = content.split('\n');
    for (const line of lines) {
      if (line.toLowerCase().includes('focus') || line.toLowerCase().includes('interview')) {
        focus.push(line.trim());
      }
    }
    return focus.slice(0, 3);
  }

  extractRedFlags(content) {
    const redFlags = [];
    const lines = content.split('\n');
    for (const line of lines) {
      if (line.toLowerCase().includes('red flag') || line.toLowerCase().includes('concern')) {
        redFlags.push(line.trim());
      }
    }
    return redFlags.slice(0, 3);
  }

  extractResumeStrengths(content) {
    const strengths = [];
    const lines = content.split('\n');
    for (const line of lines) {
      if (line.toLowerCase().includes('strength') || line.toLowerCase().includes('strong')) {
        strengths.push(line.trim());
      }
    }
    return strengths.slice(0, 3);
  }

  calculateResumeScore(content) {
    const scoreMatch = content.match(/(?:score|rating):?\s*(\d+)/i);
    return scoreMatch ? parseInt(scoreMatch[1]) : 75;
  }

  extractAssessmentMethods(content) {
    const methods = [];
    const lines = content.split('\n');
    for (const line of lines) {
      if (line.match(/^[-•]\s/) || line.match(/^\d+\.\s/)) {
        methods.push(line.trim());
      }
    }
    return methods.slice(0, 5);
  }

  extractInterviewRedFlags(content) {
    const redFlags = [];
    const lines = content.split('\n');
    for (const line of lines) {
      if (line.toLowerCase().includes('red flag') || line.toLowerCase().includes('watch')) {
        redFlags.push(line.trim());
      }
    }
    return redFlags.slice(0, 3);
  }

  extractFollowUpQuestions(content) {
    const questions = [];
    const lines = content.split('\n');
    for (const line of lines) {
      if (line.includes('?') && line.toLowerCase().includes('follow')) {
        questions.push(line.trim());
      }
    }
    return questions.slice(0, 3);
  }

  extractEvaluationCriteria(content) {
    const criteria = [];
    const lines = content.split('\n');
    for (const line of lines) {
      if (line.match(/^[-•]\s/) || line.match(/^\d+\.\s/)) {
        criteria.push(line.trim());
      }
    }
    return criteria.slice(0, 5);
  }

  extractJobInsights(content) {
    const insights = [];
    const lines = content.split('\n');
    for (const line of lines) {
      if (line.toLowerCase().includes('insight') || line.toLowerCase().includes('tip')) {
        insights.push(line.trim());
      }
    }
    return insights.slice(0, 3);
  }

  extractOptimizationTips(content) {
    const tips = [];
    const lines = content.split('\n');
    for (const line of lines) {
      if (line.match(/^[-•]\s/) || line.match(/^\d+\.\s/)) {
        tips.push(line.trim());
      }
    }
    return tips.slice(0, 5);
  }

  extractCandidateActionItems(content) {
    const actionItems = [];
    const lines = content.split('\n');
    for (const line of lines) {
      if (line.match(/^[-•]\s/) || line.match(/^\d+\.\s/)) {
        actionItems.push(line.trim());
      }
    }
    return actionItems.slice(0, 3);
  }

  // Basic matching algorithm (fallback when AI is not available)
  calculateBasicMatchScore(candidate, job) {
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

  calculateLocationMatch(candidate, job) {
    if (!candidate.current_location || !job.location) return 0.5;

    const candidateLocation = candidate.current_location.toLowerCase();
    const jobLocation = job.location.toLowerCase();

    if (candidateLocation === jobLocation) return 1.0;

    if (candidate.willing_to_relocate) {
      if (candidate.preferred_locations && candidate.preferred_locations.length > 0) {
        const preferredMatch = candidate.preferred_locations.some(loc => 
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
export const employerAIAgent = new EmployerAIAgent();
export default EmployerAIAgent;

# AI Candidate Ranking System - MVP Implementation Guide

## Table of Contents
1. [Database Schema](#database-schema)
2. [Supabase Edge Functions](#supabase-edge-functions)
3. [Frontend Implementation](#frontend-implementation)
4. [Deployment Guide](#deployment-guide)

## 1. Database Schema

### Required Tables

```sql
-- Store AI insights for all candidates (applied or not)
CREATE TABLE public.candidate_ai_insights (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  candidate_id uuid NOT NULL,
  job_id uuid NOT NULL,
  
  -- Overall scores
  overall_match_score numeric NOT NULL,
  cultural_fit_score numeric NOT NULL,
  technical_alignment_score numeric NOT NULL,
  relocation_readiness_score numeric NOT NULL,
  
  -- Detailed insights (JSON structure)
  cultural_insights jsonb NOT NULL,
  technical_insights jsonb NOT NULL,
  relocation_insights jsonb NOT NULL,
  risk_assessment jsonb NOT NULL,
  ai_recommendation jsonb NOT NULL,
  
  -- Profile insights
  onboarding_profile jsonb,
  career_goals jsonb,
  work_style_preferences jsonb,
  personality_insights jsonb,
  
  -- Resume highlights
  resume_highlights jsonb,
  key_achievements jsonb,
  technical_expertise jsonb,
  educational_insights jsonb,
  
  -- Germany-specific insights
  germany_integration jsonb,
  
  -- Metadata
  insights_version text DEFAULT '1.0',
  generated_at timestamp with time zone DEFAULT now(),
  last_updated timestamp with time zone DEFAULT now(),
  
  CONSTRAINT candidate_ai_insights_pkey PRIMARY KEY (id),
  CONSTRAINT candidate_ai_insights_unique UNIQUE (candidate_id, job_id),
  CONSTRAINT candidate_ai_insights_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES public.profiles(id),
  CONSTRAINT candidate_ai_insights_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id)
);

-- Index for fast queries
CREATE INDEX idx_candidate_insights_job_score ON candidate_ai_insights(job_id, overall_match_score DESC);
CREATE INDEX idx_candidate_insights_candidate ON candidate_ai_insights(candidate_id);

-- Simple processing queue
CREATE TABLE public.ai_processing_queue (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  job_id uuid NOT NULL,
  candidate_id uuid NOT NULL,
  priority integer DEFAULT 5,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message text,
  attempts integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  processed_at timestamp with time zone,
  
  CONSTRAINT ai_processing_queue_pkey PRIMARY KEY (id)
);

-- Add RLS policies
ALTER TABLE candidate_ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_processing_queue ENABLE ROW LEVEL SECURITY;

-- Allow employers to view insights for their jobs
CREATE POLICY "Employers can view insights for their jobs" ON candidate_ai_insights
  FOR SELECT USING (
    job_id IN (
      SELECT id FROM jobs WHERE created_by = auth.uid()
    )
  );

-- Allow system to insert/update insights
CREATE POLICY "System can manage insights" ON candidate_ai_insights
  FOR ALL USING (auth.uid() = 'service_role');
```

## 2. Supabase Edge Functions

### Generate Rankings Function

Create a new edge function: `supabase/functions/generate-rankings/index.js`

```javascript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { jobId } = await req.json()
    
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get job details
    const { data: job, error: jobError } = await supabaseClient
      .from('jobs')
      .select(`
        *,
        company:companies(*)
      `)
      .eq('id', jobId)
      .single()

    if (jobError) throw jobError

    // Find matching candidates
    const candidates = await findMatchingCandidates(supabaseClient, job)
    
    // Queue candidates for processing
    const queueEntries = candidates.map(candidate => ({
      job_id: jobId,
      candidate_id: candidate.id,
      priority: candidate.matchScore || 50,
      status: 'pending'
    }))

    const { error: queueError } = await supabaseClient
      .from('ai_processing_queue')
      .insert(queueEntries)

    if (queueError) throw queueError

    // Process candidates in batches
    await processCandidatesInBatches(supabaseClient, jobId, candidates)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Ranking generation started',
        candidatesQueued: candidates.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function findMatchingCandidates(supabase, job) {
  // Get all job seekers with matching skills
  const { data: candidates, error } = await supabase
    .from('profiles')
    .select(`
      *,
      job_seeker_profiles!inner(*),
      resume_data(*)
    `)
    .eq('user_type', 'job_seeker')
    .contains('job_seeker_profiles.skills', job.skills_required)

  if (error) throw error

  // Calculate initial match scores
  return candidates.map(candidate => {
    const score = calculateInitialScore(candidate, job)
    return { ...candidate, matchScore: score }
  })
  .filter(c => c.matchScore >= 50)
  .sort((a, b) => b.matchScore - a.matchScore)
  .slice(0, 50) // Top 50 for MVP
}

function calculateInitialScore(candidate, job) {
  let score = 0
  const profile = candidate.job_seeker_profiles
  
  // Skill matching (40%)
  const matchingSkills = job.skills_required.filter(skill => 
    profile.skills?.includes(skill)
  )
  score += (matchingSkills.length / job.skills_required.length) * 40

  // Experience matching (30%)
  const experienceDiff = Math.abs(profile.experience_years - parseInt(job.experience_level))
  score += Math.max(0, 30 - (experienceDiff * 5))

  // Location/relocation (20%)
  if (profile.preferred_locations?.includes(job.location)) {
    score += 20
  } else if (profile.willing_to_relocate) {
    score += 10
  }

  // Language skills (10%)
  if (profile.languages?.includes('German') || profile.languages?.includes('English')) {
    score += 10
  }

  return Math.round(score)
}

async function processCandidatesInBatches(supabase, jobId, candidates) {
  const batchSize = 5
  
  for (let i = 0; i < candidates.length; i += batchSize) {
    const batch = candidates.slice(i, i + batchSize)
    
    await Promise.all(
      batch.map(candidate => 
        generateAndSaveInsights(supabase, candidate, jobId)
      )
    )
    
    // Small delay between batches
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
}

async function generateAndSaveInsights(supabase, candidate, jobId) {
  try {
    // Update status to processing
    await supabase
      .from('ai_processing_queue')
      .update({ status: 'processing' })
      .match({ candidate_id: candidate.id, job_id: jobId })

    // Generate insights using OpenRouter
    const insights = await generateInsightsWithOpenRouter(candidate, jobId)
    
    // Save insights
    const { error: saveError } = await supabase
      .from('candidate_ai_insights')
      .upsert({
        candidate_id: candidate.id,
        job_id: jobId,
        ...insights,
        generated_at: new Date().toISOString(),
        last_updated: new Date().toISOString()
      })

    if (saveError) throw saveError

    // Update queue status
    await supabase
      .from('ai_processing_queue')
      .update({ 
        status: 'completed',
        processed_at: new Date().toISOString()
      })
      .match({ candidate_id: candidate.id, job_id: jobId })

  } catch (error) {
    console.error(`Error processing candidate ${candidate.id}:`, error)
    
    // Update queue with error
    await supabase
      .from('ai_processing_queue')
      .update({ 
        status: 'failed',
        error_message: error.message,
        attempts: candidate.attempts + 1
      })
      .match({ candidate_id: candidate.id, job_id: jobId })
  }
}
```

### OpenRouter Integration Function

Create `supabase/functions/generate-insights/index.js`

```javascript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY')
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { candidate, job } = await req.json()
    
    const systemContext = getSystemContext()
    const userPrompt = buildPrompt(candidate, job)
    
    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://yourapp.com',
        'X-Title': 'AI Job Recruitment Platform'
      },
      body: JSON.stringify({
        model: 'openai/gpt-4',
        messages: [
          {
            role: "system",
            content: [
              {
                type: "text",
                text: "You are an expert recruiter specializing in matching Indian tech talent with German employers."
              },
              {
                type: "text",
                text: systemContext,
                cache_control: { type: "ephemeral" }
              }
            ]
          },
          {
            role: "user",
            content: userPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "candidate_insights",
            strict: true,
            schema: getInsightsSchema()
          }
        }
      })
    })

    const data = await response.json()
    const insights = JSON.parse(data.choices[0].message.content)
    
    // Transform insights to database format
    const dbInsights = {
      overall_match_score: insights.scores.overall,
      cultural_fit_score: insights.scores.cultural_fit,
      technical_alignment_score: insights.scores.technical_alignment,
      relocation_readiness_score: insights.scores.relocation_readiness,
      cultural_insights: insights.cultural_insights,
      technical_insights: insights.technical_insights,
      relocation_insights: insights.relocation_insights,
      risk_assessment: insights.risk_assessment,
      ai_recommendation: insights.recommendation,
      resume_highlights: extractResumeHighlights(candidate),
      key_achievements: extractKeyAchievements(candidate),
      germany_integration: analyzeGermanyIntegration(candidate),
      work_style_preferences: analyzeWorkStyle(candidate),
      personality_insights: extractPersonalityInsights(candidate)
    }
    
    return new Response(
      JSON.stringify(dbInsights),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

function getSystemContext() {
  return `
GERMAN WORK CULTURE CONTEXT:
- Punctuality and reliability are paramount
- Direct communication style preferred
- Strong emphasis on work-life balance
- Hierarchical structures with clear responsibilities
- Quality and precision valued over speed
- Professional certifications highly regarded
- Language skills important for integration
- Long-term employment relationships common

VISA AND RELOCATION FACTORS:
- EU Blue Card requirements
- Recognition of foreign qualifications
- Family reunification policies
- Cost of living considerations
- Healthcare system differences
- Tax implications

TECHNICAL STANDARDS:
- GDPR compliance awareness
- Industry 4.0 familiarity
- Clean code principles
- Documentation standards
- Testing practices

EVALUATION CRITERIA:
1. Technical skills match (40% weight)
2. Cultural fit (30% weight)
3. Relocation readiness (20% weight)
4. Risk factors (10% weight)
`
}

function buildPrompt(candidate, job) {
  const profile = candidate.job_seeker_profiles
  const resume = candidate.resume_data?.[0]
  
  return `
Analyze this candidate for a German tech position:

CANDIDATE PROFILE:
- Name: ${candidate.full_name}
- Location: ${profile.current_location}
- Experience: ${profile.experience_years} years
- Skills: ${profile.skills?.join(', ')}
- Languages: ${profile.languages?.join(', ')}
- Willing to Relocate: ${profile.willing_to_relocate}
- Preferred Locations: ${profile.preferred_locations?.join(', ')}

EDUCATION:
${resume?.education?.map(edu => 
  `- ${edu.degree} in ${edu.field} from ${edu.institution} (${edu.year})`
).join('\n')}

WORK EXPERIENCE:
${resume?.experience?.map(exp => 
  `- ${exp.title} at ${exp.company} (${exp.duration})
   ${exp.description}`
).join('\n\n')}

JOB REQUIREMENTS:
- Title: ${job.title}
- Company: ${job.company.name} (${job.company.industry})
- Location: ${job.location}
- Required Skills: ${job.skills_required.join(', ')}
- Experience Level: ${job.experience_level}
- Job Type: ${job.job_type}
- Benefits: ${job.benefits?.join(', ')}

Provide comprehensive insights including:
1. Overall match score (0-100)
2. Cultural fit assessment
3. Technical skills alignment
4. Relocation readiness
5. Risk assessment
6. Hiring recommendation
`
}

function getInsightsSchema() {
  return {
    type: "object",
    properties: {
      scores: {
        type: "object",
        properties: {
          overall: { type: "number", minimum: 0, maximum: 100 },
          cultural_fit: { type: "number", minimum: 0, maximum: 100 },
          technical_alignment: { type: "number", minimum: 0, maximum: 100 },
          relocation_readiness: { type: "number", minimum: 0, maximum: 100 }
        },
        required: ["overall", "cultural_fit", "technical_alignment", "relocation_readiness"]
      },
      cultural_insights: {
        type: "object",
        properties: {
          strengths: { type: "array", items: { type: "string" } },
          considerations: { type: "array", items: { type: "string" } },
          communication_assessment: { type: "string" }
        },
        required: ["strengths", "considerations", "communication_assessment"]
      },
      technical_insights: {
        type: "object",
        properties: {
          skill_matches: { type: "array", items: { type: "string" } },
          experience_relevance: { type: "string" },
          growth_potential: { type: "string" },
          technical_gaps: { type: "array", items: { type: "string" } }
        },
        required: ["skill_matches", "experience_relevance", "growth_potential"]
      },
      relocation_insights: {
        type: "object",
        properties: {
          readiness_indicators: { type: "array", items: { type: "string" } },
          potential_challenges: { type: "array", items: { type: "string" } },
          timeline_estimate: { type: "string" },
          visa_eligibility: { type: "string" }
        },
        required: ["readiness_indicators", "potential_challenges", "timeline_estimate"]
      },
      risk_assessment: {
        type: "object",
        properties: {
          flight_risk: { type: "string", enum: ["low", "medium", "high"] },
          integration_risk: { type: "string", enum: ["low", "medium", "high"] },
          performance_risk: { type: "string", enum: ["low", "medium", "high"] },
          key_concerns: { type: "array", items: { type: "string" } }
        },
        required: ["flight_risk", "integration_risk", "performance_risk"]
      },
      recommendation: {
        type: "object",
        properties: {
          decision: { type: "string", enum: ["highly_recommended", "recommended", "consider", "not_recommended"] },
          summary: { type: "string" },
          next_steps: { type: "array", items: { type: "string" } },
          interview_focus_areas: { type: "array", items: { type: "string" } }
        },
        required: ["decision", "summary", "next_steps"]
      }
    },
    required: ["scores", "cultural_insights", "technical_insights", "relocation_insights", "risk_assessment", "recommendation"]
  }
}

function extractResumeHighlights(candidate) {
  const highlights = []
  const resume = candidate.resume_data?.[0]
  
  if (!resume) return highlights
  
  // Extract leadership experience
  resume.experience?.forEach(exp => {
    const leadershipMatch = exp.description?.match(/led (\d+)|managed (\d+)|supervised (\d+)/i)
    if (leadershipMatch) {
      const teamSize = leadershipMatch[1] || leadershipMatch[2] || leadershipMatch[3]
      highlights.push(`Led ${teamSize}-person team`)
    }
    
    // Extract quantifiable achievements
    const percentMatch = exp.description?.match(/(\d+)%/g)
    if (percentMatch) {
      highlights.push(`${percentMatch[0]} improvement achieved`)
    }
  })
  
  return highlights.slice(0, 3)
}

function extractKeyAchievements(candidate) {
  const achievements = []
  const resume = candidate.resume_data?.[0]
  
  resume?.experience?.forEach(exp => {
    // Look for action verbs and results
    const achievementPatterns = [
      /delivered (.+?) ahead of schedule/i,
      /reduced (.+?) by (\d+)%/i,
      /increased (.+?) by (\d+)%/i,
      /implemented (.+?) resulting in/i,
      /built (.+?) handling (\d+)/i
    ]
    
    achievementPatterns.forEach(pattern => {
      const match = exp.description?.match(pattern)
      if (match) {
        achievements.push(match[0])
      }
    })
  })
  
  return achievements.slice(0, 5)
}

function analyzeGermanyIntegration(candidate) {
  const profile = candidate.job_seeker_profiles
  
  return {
    language_learning: profile.languages?.includes('German') 
      ? 'Already speaks German' 
      : 'Needs German language training',
    cultural_preparation: 'Should research German work culture',
    professional_network: 'Can leverage Indian diaspora in Germany',
    location_preference: profile.preferred_locations?.some(loc => 
      ['Berlin', 'Munich', 'Frankfurt', 'Hamburg'].includes(loc)
    ) ? 'Has researched German cities' : 'Open to various German locations'
  }
}

function analyzeWorkStyle(candidate) {
  const profile = candidate.job_seeker_profiles
  
  return {
    preferred_model: profile.preferred_job_types?.includes('remote') 
      ? 'Remote/Hybrid preference' 
      : 'Open to office work',
    leadership_style: candidate.resume_data?.[0]?.experience?.some(exp =>
      exp.description?.includes('mentor')
    ) ? 'Mentorship-oriented' : 'Individual contributor',
    work_life_balance: 'Values work-life balance (matches German culture)',
    collaboration: 'Team-oriented approach'
  }
}

function extractPersonalityInsights(candidate) {
  // Based on resume writing style and experience
  return {
    traits: ['Detail-oriented', 'Self-motivated', 'Adaptable'],
    work_approach: 'Systematic and methodical',
    communication_style: 'Clear and direct'
  }
}
```

## 3. Frontend Implementation

### Main AI Ranked Candidates Component

```javascript
// src/components/AIRankedCandidates.jsx

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../config/supabase';
import CandidateCard from './CandidateCard';
import CandidateDetailsPanel from './CandidateDetailsPanel';
import LoadingState from './LoadingState';
import './AIRankedCandidates.css';

const AIRankedCandidates = () => {
  const { jobId } = useParams();
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [processingStatus, setProcessingStatus] = useState(null);
  const [filters, setFilters] = useState({
    skills: 'All Skills',
    location: 'All Locations',
    minScore: 0
  });

  useEffect(() => {
    loadCandidates();
    checkProcessingStatus();
    subscribeToUpdates();
  }, [jobId]);

  const loadCandidates = async () => {
    try {
      const { data, error } = await supabase
        .from('candidate_ai_insights')
        .select(`
          *,
          candidate:profiles!candidate_id(
            *,
            job_seeker_profiles(*),
            resume_data(*)
          ),
          application:job_applications(*)
        `)
        .eq('job_id', jobId)
        .gte('overall_match_score', filters.minScore)
        .order('overall_match_score', { ascending: false });

      if (error) throw error;
      setCandidates(data || []);
    } catch (error) {
      console.error('Error loading candidates:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkProcessingStatus = async () => {
    const { data, error } = await supabase
      .from('ai_processing_queue')
      .select('status')
      .eq('job_id', jobId);

    if (data && data.length > 0) {
      const counts = data.reduce((acc, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      }, {});

      setProcessingStatus({
        total: data.length,
        completed: counts.completed || 0,
        processing: counts.processing || 0,
        pending: counts.pending || 0,
        failed: counts.failed || 0
      });
    }
  };

  const subscribeToUpdates = () => {
    const channel = supabase
      .channel(`job-${jobId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'candidate_ai_insights',
          filter: `job_id=eq.${jobId}`
        }, 
        (payload) => {
          console.log('Update received:', payload);
          loadCandidates();
          checkProcessingStatus();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const generateRankings = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-rankings', {
        body: { jobId }
      });

      if (error) throw error;

      alert(`Started generating rankings for ${data.candidatesQueued} candidates`);
      
      // Start polling for status
      const statusInterval = setInterval(() => {
        checkProcessingStatus();
      }, 2000);

      // Store interval ID to clear later
      setTimeout(() => clearInterval(statusInterval), 300000); // Stop after 5 mins
    } catch (error) {
      console.error('Error generating rankings:', error);
      alert('Failed to generate rankings');
    } finally {
      setGenerating(false);
    }
  };

  const filterCandidates = () => {
    return candidates.filter(item => {
      const profile = item.candidate.job_seeker_profiles;
      
      if (filters.skills !== 'All Skills' && 
          !profile?.skills?.includes(filters.skills)) {
        return false;
      }
      
      if (filters.location !== 'All Locations' && 
          profile?.current_location !== filters.location) {
        return false;
      }
      
      return true;
    });
  };

  if (loading) {
    return <LoadingState />;
  }

  const filteredCandidates = filterCandidates();
  const bestMatches = filteredCandidates.filter(c => c.overall_match_score >= 80);
  const otherCandidates = filteredCandidates.filter(c => c.overall_match_score < 80);

  return (
    <div className="ai-ranked-candidates">
      <div className="page-header">
        <div>
          <h1>AI-Ranked Candidates</h1>
          <p>Discover top talent matched to your requirements</p>
        </div>
        
        {candidates.length === 0 && (
          <button 
            className="generate-rankings-btn"
            onClick={generateRankings}
            disabled={generating}
          >
            {generating ? 'Generating...' : '🤖 Generate AI Rankings'}
          </button>
        )}
      </div>

      {processingStatus && processingStatus.total > processingStatus.completed && (
        <div className="processing-status">
          <div className="status-message">
            🔄 Processing candidates: {processingStatus.completed}/{processingStatus.total} completed
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ 
                width: `${(processingStatus.completed / processingStatus.total) * 100}%` 
              }}
            />
          </div>
        </div>
      )}

      <div className="filters-bar">
        <input
          type="text"
          placeholder="Search by name, position, or skills..."
          className="search-input"
        />
        
        <select 
          value={filters.skills}
          onChange={(e) => setFilters({...filters, skills: e.target.value})}
          className="filter-select"
        >
          <option>All Skills</option>
          <option>React</option>
          <option>Node.js</option>
          <option>Python</option>
          <option>Java</option>
        </select>
        
        <select
          value={filters.location}
          onChange={(e) => setFilters({...filters, location: e.target.value})}
          className="filter-select"
        >
          <option>All Locations</option>
          <option>Bangalore</option>
          <option>Mumbai</option>
          <option>Delhi</option>
          <option>Hyderabad</option>
        </select>
      </div>

      <div className="content-area">
        <div className="candidates-list">
          {bestMatches.length > 0 && (
            <>
              <h3 className="section-title">⭐ Best Matches</h3>
              {bestMatches.map(candidateData => (
                <CandidateCard
                  key={candidateData.id}
                  candidateData={candidateData}
                  isSelected={selectedCandidate?.id === candidateData.id}
                  onSelect={() => setSelectedCandidate(candidateData)}
                />
              ))}
            </>
          )}

          {otherCandidates.length > 0 && (
            <>
              <h3 className="section-title">Other Candidates</h3>
              {otherCandidates.map(candidateData => (
                <CandidateCard
                  key={candidateData.id}
                  candidateData={candidateData}
                  isSelected={selectedCandidate?.id === candidateData.id}
                  onSelect={() => setSelectedCandidate(candidateData)}
                />
              ))}
            </>
          )}

          {filteredCandidates.length === 0 && (
            <div className="empty-state">
              <p>No candidates found matching your criteria.</p>
              {candidates.length === 0 && (
                <button onClick={generateRankings} className="generate-btn">
                  Generate AI Rankings
                </button>
              )}
            </div>
          )}
        </div>

        {selectedCandidate && (
          <CandidateDetailsPanel
            candidateData={selectedCandidate}
            onClose={() => setSelectedCandidate(null)}
          />
        )}
      </div>
    </div>
  );
};

export default AIRankedCandidates;
```

### Candidate Card Component

```javascript
// src/components/CandidateCard.jsx

import './CandidateCard.css';

const CandidateCard = ({ candidateData, isSelected, onSelect }) => {
  const { candidate, overall_match_score, application } = candidateData;
  const profile = candidate.job_seeker_profiles;

  return (
    <div 
      className={`candidate-card ${isSelected ? 'selected' : ''}`}
      onClick={onSelect}
    >
      <div className="card-header">
        <img 
          src={candidate.avatar_url || `https://ui-avatars.com/api/?name=${candidate.full_name}`}
          alt={candidate.full_name}
          className="avatar"
        />
        <div className="candidate-info">
          <h4>{candidate.full_name}</h4>
          <p className="headline">{profile?.headline || 'Software Developer'}</p>
          <div className="location-info">
            <span>📍 {profile?.current_location}</span>
            {profile?.willing_to_relocate && (
              <span className="relocatable">Relocatable</span>
            )}
          </div>
        </div>
        <div className="match-badge">
          <span className="match-score">{Math.round(overall_match_score)}</span>
          <span className="match-label">% match</span>
        </div>
      </div>

      <div className="skills-section">
        {profile?.skills?.slice(0, 4).map((skill, idx) => (
          <span key={idx} className="skill-tag">{skill}</span>
        ))}
        {profile?.skills?.length > 4 && (
          <span className="more-skills">+{profile.skills.length - 4} more</span>
        )}
      </div>

      <div className="card-footer">
        <div className="experience-info">
          <span>{profile?.experience_years || 0} years experience</span>
          <span>•</span>
          <span>€{profile?.target_salary_range?.min || 60}k - €{profile?.target_salary_range?.max || 80}k</span>
        </div>
        <button className="view-profile-btn">View Profile</button>
      </div>

      <div className="status-indicator">
        {application ? (
          <span className="status-badge applied">Applied</span>
        ) : (
          <span className="status-badge available">Available</span>
        )}
      </div>
    </div>
  );
};

export default CandidateCard;
```

### Candidate Details Panel

```javascript
// src/components/CandidateDetailsPanel.jsx

import { useState } from 'react';
import './CandidateDetailsPanel.css';

const CandidateDetailsPanel = ({ candidateData, onClose }) => {
  const [activeTab, setActiveTab] = useState('insights');
  const { candidate, ...insights } = candidateData;
  const profile = candidate.job_seeker_profiles;

  const renderInsights = () => {
    return (
      <div className="insights-content">
        {/* Score Overview */}
        <div className="scores-grid">
          <div className="score-card">
            <h4>🌍 Cultural Fit</h4>
            <div className="score-value">{Math.round(insights.cultural_fit_score)}%</div>
            <div className="score-bar">
              <div 
                className="score-fill"
                style={{ width: `${insights.cultural_fit_score}%` }}
              />
            </div>
          </div>
          <div className="score-card">
            <h4>💻 Tech Alignment</h4>
            <div className="score-value">{Math.round(insights.technical_alignment_score)}%</div>
            <div className="score-bar">
              <div 
                className="score-fill"
                style={{ width: `${insights.technical_alignment_score}%` }}
              />
            </div>
          </div>
          <div className="score-card">
            <h4>✈️ Relocation</h4>
            <div className="score-value">{Math.round(insights.relocation_readiness_score)}%</div>
            <div className="score-bar">
              <div 
                className="score-fill"
                style={{ width: `${insights.relocation_readiness_score}%` }}
              />
            </div>
          </div>
        </div>

        {/* Cultural Insights */}
        <div className="insight-section">
          <h3>🌍 Cultural Compatibility</h3>
          {insights.cultural_insights?.strengths?.map((strength, idx) => (
            <div key={idx} className="insight-item">• {strength}</div>
          ))}
        </div>

        {/* Technical Insights */}
        <div className="insight-section">
          <h3>💻 Technical Assessment</h3>
          {insights.technical_insights?.skill_matches?.map((skill, idx) => (
            <div key={idx} className="insight-item">• {skill}</div>
          ))}
          <p className="sub-text">
            Growth Potential: {insights.technical_insights?.growth_potential}
          </p>
        </div>

        {/* Relocation Insights */}
        <div className="insight-section">
          <h3>✈️ Relocation Readiness</h3>
          {insights.relocation_insights?.readiness_indicators?.map((indicator, idx) => (
            <div key={idx} className="insight-item">• {indicator}</div>
          ))}
          <p className="sub-text">
            Timeline: {insights.relocation_insights?.timeline_estimate}
          </p>
        </div>

        {/* Risk Assessment */}
        <div className="insight-section risk-section">
          <h3>⚠️ Risk Assessment</h3>
          <div className="risk-grid">
            <div className="risk-item">
              <span>Flight Risk:</span>
              <span className={`risk-level ${insights.risk_assessment?.flight_risk}`}>
                {insights.risk_assessment?.flight_risk}
              </span>
            </div>
            <div className="risk-item">
              <span>Integration Risk:</span>
              <span className={`risk-level ${insights.risk_assessment?.integration_risk}`}>
                {insights.risk_assessment?.integration_risk}
              </span>
            </div>
          </div>
        </div>

        {/* AI Recommendation */}
        <div className="recommendation-section">
          <h3>🤖 AI Recommendation</h3>
          <div className={`recommendation-badge ${insights.ai_recommendation?.decision}`}>
            {insights.ai_recommendation?.decision?.replace(/_/g, ' ').toUpperCase()}
          </div>
          <p>{insights.ai_recommendation?.summary}</p>
          <div className="next-steps">
            <h4>Suggested Next Steps:</h4>
            {insights.ai_recommendation?.next_steps?.map((step, idx) => (
              <div key={idx} className="step-item">• {step}</div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="candidate-details-panel">
      <div className="panel-header">
        <div className="header-content">
          <img 
            src={candidate.avatar_url || `https://ui-avatars.com/api/?name=${candidate.full_name}`}
            alt={candidate.full_name}
            className="candidate-avatar"
          />
          <div>
            <h2>{candidate.full_name}</h2>
            <p>{profile?.headline}</p>
            <div className="quick-info">
              <span className="badge">{candidateData.application ? 'Applied' : 'Available'}</span>
              <span className="match-indicator">{Math.round(insights.overall_match_score)}% Match</span>
            </div>
          </div>
        </div>
        <button className="close-btn" onClick={onClose}>✕</button>
      </div>

      <div className="action-buttons">
        <button className="btn-primary">📅 Interview</button>
        <button className="btn-secondary">⭐ Shortlist</button>
        <button className="btn-secondary">💬 Message</button>
      </div>

      <div className="contact-section">
        <h4>Contact Information</h4>
        <p>✉️ {candidate.email || 'candidate@email.com'}</p>
        <p>📱 {candidate.phone || '+91 98765 43210'}</p>
        <p>📍 {profile?.current_location} {profile?.willing_to_relocate && '• Relocatable'}</p>
      </div>

      <div className="tabs">
        <button 
          className={activeTab === 'insights' ? 'active' : ''}
          onClick={() => setActiveTab('insights')}
        >
          AI Insights
        </button>
        <button 
          className={activeTab === 'profile' ? 'active' : ''}
          onClick={() => setActiveTab('profile')}
        >
          Profile
        </button>
        <button 
          className={activeTab === 'resume' ? 'active' : ''}
          onClick={() => setActiveTab('resume')}
        >
          Resume
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'insights' && renderInsights()}
        {activeTab === 'profile' && (
          <div className="profile-content">
            <h3>Professional Summary</h3>
            <p>{profile?.summary || 'No summary available'}</p>
            
            <h3>Skills</h3>
            <div className="skills-grid">
              {profile?.skills?.map((skill, idx) => (
                <span key={idx} className="skill-chip">{skill}</span>
              ))}
            </div>
            
            <h3>Languages</h3>
            <div className="languages">
              {profile?.languages?.map((lang, idx) => (
                <span key={idx} className="language-chip">{lang}</span>
              ))}
            </div>
          </div>
        )}
        {activeTab === 'resume' && (
          <div className="resume-content">
            <p>Resume viewer coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CandidateDetailsPanel;
```

### Supabase Configuration

```javascript
// src/config/supabase.js

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### CSS Styles

```css
/* src/components/AIRankedCandidates.css */

.ai-ranked-candidates {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.page-header h1 {
  font-size: 28px;
  font-weight: 600;
  margin: 0;
}

.page-header p {
  color: #666;
  margin: 4px 0 0 0;
}

.generate-rankings-btn {
  background: #6366f1;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.generate-rankings-btn:hover {
  background: #5558e3;
  transform: translateY(-1px);
}

.generate-rankings-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.processing-status {
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
}

.status-message {
  color: #0369a1;
  font-weight: 500;
  margin-bottom: 8px;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e0f2fe;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #0ea5e9;
  transition: width 0.3s ease;
}

.filters-bar {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.search-input {
  flex: 1;
  padding: 10px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
}

.filter-select {
  padding: 10px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  font-size: 14px;
  cursor: pointer;
}

.content-area {
  display: flex;
  gap: 24px;
}

.candidates-list {
  flex: 1;
  max-width: 600px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  margin: 24px 0 16px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.empty-state {
  text-align: center;
  padding: 48px;
  color: #666;
}

.generate-btn {
  margin-top: 16px;
  background: #6366f1;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .content-area {
    flex-direction: column;
  }
  
  .candidates-list {
    max-width: 100%;
  }
}
```

## 4. Deployment Guide

### Environment Setup

```bash
# .env.local
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Supabase Edge Function Secrets

```bash
# Set up secrets for edge functions
supabase secrets set OPENROUTER_API_KEY=your_openrouter_api_key
```

### Deploy Edge Functions

```bash
# Deploy the generate-rankings function
supabase functions deploy generate-rankings

# Deploy the generate-insights function  
supabase functions deploy generate-insights
```

### Database Setup

1. Run the SQL schema in Supabase SQL editor
2. Enable Row Level Security (RLS)
3. Set up the policies as defined

### Frontend Deployment

```bash
# Build the Vite app
npm run build

# Deploy to your hosting service (Vercel, Netlify, etc.)
```

### Testing the System

1. Create a test job in your platform
2. Click "Generate AI Rankings" button
3. Monitor the progress bar
4. View ranked candidates as they're processed

### Cost Optimization Tips

1. **Use Prompt Caching**: The system uses OpenRouter's caching for the system context
2. **Batch Processing**: Process candidates in batches of 5
3. **Smart Filtering**: Only process candidates with >50% initial match
4. **Cache Results**: Store insights for 24 hours before regenerating

### Monitoring

1. Check Supabase logs for edge function errors
2. Monitor OpenRouter usage dashboard
3. Set up alerts for failed processing jobs

## Summary

This MVP implementation:
- ✅ Uses only Supabase (database + edge functions)
- ✅ No separate backend needed
- ✅ Simple frontend integration
- ✅ Real-time updates
- ✅ Cost-effective with OpenRouter caching
- ✅ Scalable to hundreds of candidates

The system can be deployed quickly and scaled up as needed by adjusting the batch sizes and adding more sophisticated scoring algorithms.
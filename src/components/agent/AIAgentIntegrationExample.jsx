import React, { useState } from 'react';
import { useCandidateAIAgent } from '../../hooks/useCandidateAIAgent';
import { useEmployerAIAgent } from '../../hooks/useEmployerAIAgent';
import { Brain, Users, Briefcase, BarChart3, FileText, MessageCircle } from 'lucide-react';
import Button from '../common/Button';
import Card from '../common/Card';
import Badge from '../common/Badge';

/**
 * Example component showing how to integrate AI agents into other parts of the application
 * This demonstrates how to use the AI agents in dashboards, widgets, or other components
 */
const AIAgentIntegrationExample = () => {
  const [userType, setUserType] = useState('candidate'); // 'candidate' or 'employer'
  
  // Candidate AI Agent
  const {
    loading: candidateLoading,
    error: candidateError,
    fetchAIMatchingJobs,
    getCareerCoaching,
    analyzeResume
  } = useCandidateAIAgent();

  // Employer AI Agent
  const {
    loading: employerLoading,
    error: employerError,
    fetchAICandidateRecommendations,
    createAIJobPost,
    getMarketInsights
  } = useEmployerAIAgent();

  const [quickResults, setQuickResults] = useState({
    jobs: [],
    candidates: [],
    careerAdvice: null,
    marketInsights: null
  });

  // Example: Quick AI job search for candidates
  const handleQuickJobSearch = async () => {
    try {
      const jobs = await fetchAIMatchingJobs({
        date: 'week',
        jobType: 'full-time'
      }, 'Find me remote jobs with growth opportunities');
      
      setQuickResults(prev => ({
        ...prev,
        jobs: jobs.slice(0, 3) // Show top 3
      }));
    } catch (err) {
      console.error('Quick job search failed:', err);
    }
  };

  // Example: Quick AI candidate search for employers
  const handleQuickCandidateSearch = async () => {
    try {
      const candidates = await fetchAICandidateRecommendations('sample-job-id', {
        experience: 'mid'
      }, 'Find candidates with startup experience');
      
      setQuickResults(prev => ({
        ...prev,
        candidates: candidates.slice(0, 3) // Show top 3
      }));
    } catch (err) {
      console.error('Quick candidate search failed:', err);
    }
  };

  // Example: Quick career coaching
  const handleQuickCareerCoaching = async () => {
    try {
      const advice = await getCareerCoaching('How can I transition to a tech career?');
      setQuickResults(prev => ({
        ...prev,
        careerAdvice: advice
      }));
    } catch (err) {
      console.error('Career coaching failed:', err);
    }
  };

  // Example: Quick market insights
  const handleQuickMarketInsights = async () => {
    try {
      const insights = await getMarketInsights('Senior Frontend Developer', 'San Francisco, CA', 'Technology');
      setQuickResults(prev => ({
        ...prev,
        marketInsights: insights
      }));
    } catch (err) {
      console.error('Market insights failed:', err);
    }
  };

  const loading = candidateLoading || employerLoading;
  const error = candidateError || employerError;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">AI Agent Integration Example</h3>
        <p className="text-gray-600 mb-6">
          This component demonstrates how to integrate AI agents into other parts of your application.
        </p>

        {/* User Type Toggle */}
        <div className="flex space-x-4 mb-6">
          <Button
            variant={userType === 'candidate' ? 'primary' : 'secondary'}
            onClick={() => setUserType('candidate')}
          >
            Candidate View
          </Button>
          <Button
            variant={userType === 'employer' ? 'primary' : 'secondary'}
            onClick={() => setUserType('employer')}
          >
            Employer View
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Candidate AI Features */}
        {userType === 'candidate' && (
          <div className="space-y-4">
            <h4 className="text-md font-semibold">Candidate AI Features</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={handleQuickJobSearch}
                disabled={loading}
                className="flex items-center justify-center"
              >
                <Brain className="h-4 w-4 mr-2" />
                AI Job Search
              </Button>

              <Button
                onClick={handleQuickCareerCoaching}
                disabled={loading}
                variant="secondary"
                className="flex items-center justify-center"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Career Coaching
              </Button>
            </div>

            {/* Quick Results */}
            {quickResults.jobs.length > 0 && (
              <div className="mt-4">
                <h5 className="text-sm font-medium text-gray-700 mb-2">AI-Recommended Jobs</h5>
                <div className="space-y-2">
                  {quickResults.jobs.map((job) => (
                    <div key={job.id} className="p-3 bg-blue-50 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h6 className="font-medium text-blue-900">{job.title}</h6>
                          <p className="text-sm text-blue-700">{job.companies?.name}</p>
                        </div>
                        <Badge variant="success" className="text-xs">
                          {Math.round(job.matchScore * 100)}% Match
                        </Badge>
                      </div>
                      {job.aiInsights && (
                        <p className="text-xs text-blue-600 mt-1">{job.aiInsights}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {quickResults.careerAdvice && (
              <div className="mt-4">
                <h5 className="text-sm font-medium text-gray-700 mb-2">AI Career Advice</h5>
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-700">{quickResults.careerAdvice.response}</p>
                  {quickResults.careerAdvice.suggestions && quickResults.careerAdvice.suggestions.length > 0 && (
                    <ul className="text-xs text-green-600 mt-2 space-y-1">
                      {quickResults.careerAdvice.suggestions.slice(0, 3).map((suggestion, index) => (
                        <li key={index}>• {suggestion}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Employer AI Features */}
        {userType === 'employer' && (
          <div className="space-y-4">
            <h4 className="text-md font-semibold">Employer AI Features</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={handleQuickCandidateSearch}
                disabled={loading}
                className="flex items-center justify-center"
              >
                <Users className="h-4 w-4 mr-2" />
                AI Candidate Search
              </Button>

              <Button
                onClick={handleQuickMarketInsights}
                disabled={loading}
                variant="secondary"
                className="flex items-center justify-center"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Market Insights
              </Button>
            </div>

            {/* Quick Results */}
            {quickResults.candidates.length > 0 && (
              <div className="mt-4">
                <h5 className="text-sm font-medium text-gray-700 mb-2">AI-Recommended Candidates</h5>
                <div className="space-y-2">
                  {quickResults.candidates.map((candidate) => (
                    <div key={candidate.id} className="p-3 bg-purple-50 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h6 className="font-medium text-purple-900">{candidate.profiles?.full_name || 'Unknown'}</h6>
                          <p className="text-sm text-purple-700">{candidate.headline || 'Job Seeker'}</p>
                        </div>
                        <Badge variant="success" className="text-xs">
                          {Math.round(candidate.matchScore * 100)}% Match
                        </Badge>
                      </div>
                      {candidate.aiInsights && (
                        <p className="text-xs text-purple-600 mt-1">{candidate.aiInsights}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {quickResults.marketInsights && (
              <div className="mt-4">
                <h5 className="text-sm font-medium text-gray-700 mb-2">AI Market Insights</h5>
                <div className="p-3 bg-orange-50 rounded-lg">
                  <p className="text-sm text-orange-700">{quickResults.marketInsights.insights}</p>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="text-xs">
                      <span className="font-medium">Salary Range:</span> {quickResults.marketInsights.salaryRange}
                    </div>
                    <div className="text-xs">
                      <span className="font-medium">Competition:</span> {quickResults.marketInsights.competitionLevel}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Code Example */}
        <div className="mt-8">
          <h4 className="text-md font-semibold mb-3">Integration Code Example</h4>
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
            <pre className="text-sm">
{`// For Candidates
import { useCandidateAIAgent } from '../hooks/useCandidateAIAgent';

const MyComponent = () => {
  const { fetchAIMatchingJobs, getCareerCoaching } = useCandidateAIAgent();

  const handleAISearch = async () => {
    const jobs = await fetchAIMatchingJobs(
      { jobType: 'full-time' }, 
      'Find me remote jobs with growth opportunities'
    );
    console.log('AI jobs:', jobs);
  };

  return <button onClick={handleAISearch}>AI Job Search</button>;
};

// For Employers
import { useEmployerAIAgent } from '../hooks/useEmployerAIAgent';

const MyComponent = () => {
  const { fetchAICandidateRecommendations, getMarketInsights } = useEmployerAIAgent();

  const handleAISearch = async () => {
    const candidates = await fetchAICandidateRecommendations(
      'job-id', 
      { experience: 'mid' },
      'Find candidates with startup experience'
    );
    console.log('AI candidates:', candidates);
  };

  return <button onClick={handleAISearch}>AI Candidate Search</button>;
};`}
            </pre>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AIAgentIntegrationExample;

import React, { useState, useEffect } from 'react';
import { useJobMatchingAgent } from '../../hooks/useJobMatchingAgent';
import { Search, Users, Briefcase, Calendar, Star } from 'lucide-react';
import Button from '../common/Button';
import Card from '../common/Card';
import Badge from '../common/Badge';

/**
 * Example component showing how to integrate the Job Matching Agent
 * into other parts of the application
 */
const AgentIntegrationExample = () => {
  const {
    loading,
    error,
    fetchMatchingJobs,
    fetchRecommendedCandidates,
    createJobPost,
    scheduleInterview
  } = useJobMatchingAgent();

  const [quickStats, setQuickStats] = useState({
    matchingJobs: 0,
    recommendedCandidates: 0,
    recentActivity: []
  });

  // Example: Quick job search for current user
  const handleQuickJobSearch = async () => {
    try {
      const jobs = await fetchMatchingJobs({
        date: 'week',
        jobType: 'full-time'
      });
      
      setQuickStats(prev => ({
        ...prev,
        matchingJobs: jobs.length,
        recentActivity: [
          ...prev.recentActivity.slice(0, 4),
          {
            type: 'job_search',
            message: `Found ${jobs.length} matching jobs`,
            timestamp: new Date().toISOString()
          }
        ]
      }));
    } catch (err) {
      console.error('Quick job search failed:', err);
    }
  };

  // Example: Quick candidate search for a specific job
  const handleQuickCandidateSearch = async (jobId) => {
    try {
      const candidates = await fetchRecommendedCandidates(jobId, {
        experience: 'mid'
      });
      
      setQuickStats(prev => ({
        ...prev,
        recommendedCandidates: candidates.length,
        recentActivity: [
          ...prev.recentActivity.slice(0, 4),
          {
            type: 'candidate_search',
            message: `Found ${candidates.length} recommended candidates`,
            timestamp: new Date().toISOString()
          }
        ]
      }));
    } catch (err) {
      console.error('Quick candidate search failed:', err);
    }
  };

  // Example: Create a quick job post
  const handleQuickJobCreation = async () => {
    const sampleJobData = {
      title: 'Senior React Developer',
      description: 'We are looking for a senior React developer to join our team...',
      location: 'San Francisco, CA',
      job_type: 'full-time',
      experience_level: 'senior',
      skills_required: ['React', 'JavaScript', 'TypeScript', 'Node.js'],
      salary_type: 'range',
      salary_min: 120000,
      salary_max: 160000,
      is_remote: true
    };

    try {
      const job = await createJobPost(sampleJobData);
      
      setQuickStats(prev => ({
        ...prev,
        recentActivity: [
          ...prev.recentActivity.slice(0, 4),
          {
            type: 'job_created',
            message: `Created job: ${job.title}`,
            timestamp: new Date().toISOString()
          }
        ]
      }));
    } catch (err) {
      console.error('Quick job creation failed:', err);
    }
  };

  // Example: Schedule a quick interview
  const handleQuickInterviewScheduling = async () => {
    const sampleInterviewData = {
      jobId: 'sample-job-id',
      candidateId: 'sample-candidate-id',
      interviewDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
      interviewType: '1st_interview',
      interviewFormat: 'video',
      durationMinutes: 60,
      agenda: 'Technical interview covering React, JavaScript, and system design',
      notes: 'Candidate shows strong potential based on profile match'
    };

    try {
      const interview = await scheduleInterview(sampleInterviewData);
      
      setQuickStats(prev => ({
        ...prev,
        recentActivity: [
          ...prev.recentActivity.slice(0, 4),
          {
            type: 'interview_scheduled',
            message: `Scheduled interview for ${interview.interview_date}`,
            timestamp: new Date().toISOString()
          }
        ]
      }));
    } catch (err) {
      console.error('Quick interview scheduling failed:', err);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Agent Integration Example</h3>
        <p className="text-gray-600 mb-6">
          This component demonstrates how to integrate the Job Matching Agent into other parts of your application.
        </p>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <Search className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-blue-600">Matching Jobs</p>
                <p className="text-2xl font-bold text-blue-900">{quickStats.matchingJobs}</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-green-600">Recommended Candidates</p>
                <p className="text-2xl font-bold text-green-900">{quickStats.recommendedCandidates}</p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm text-purple-600">Recent Activity</p>
                <p className="text-2xl font-bold text-purple-900">{quickStats.recentActivity.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Button
            onClick={handleQuickJobSearch}
            disabled={loading}
            className="flex items-center justify-center"
          >
            <Search className="h-4 w-4 mr-2" />
            Find Jobs
          </Button>

          <Button
            onClick={() => handleQuickCandidateSearch('sample-job-id')}
            disabled={loading}
            variant="secondary"
            className="flex items-center justify-center"
          >
            <Users className="h-4 w-4 mr-2" />
            Find Candidates
          </Button>

          <Button
            onClick={handleQuickJobCreation}
            disabled={loading}
            variant="outline"
            className="flex items-center justify-center"
          >
            <Briefcase className="h-4 w-4 mr-2" />
            Create Job
          </Button>

          <Button
            onClick={handleQuickInterviewScheduling}
            disabled={loading}
            variant="outline"
            className="flex items-center justify-center"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Schedule Interview
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Recent Activity */}
        {quickStats.recentActivity.length > 0 && (
          <div>
            <h4 className="text-md font-semibold mb-3">Recent Activity</h4>
            <div className="space-y-2">
              {quickStats.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    {activity.type === 'job_search' && <Search className="h-4 w-4 text-blue-600 mr-2" />}
                    {activity.type === 'candidate_search' && <Users className="h-4 w-4 text-green-600 mr-2" />}
                    {activity.type === 'job_created' && <Briefcase className="h-4 w-4 text-purple-600 mr-2" />}
                    {activity.type === 'interview_scheduled' && <Calendar className="h-4 w-4 text-orange-600 mr-2" />}
                    <span className="text-sm text-gray-700">{activity.message}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {new Date(activity.timestamp).toLocaleTimeString()}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Code Example */}
        <div className="mt-8">
          <h4 className="text-md font-semibold mb-3">Integration Code Example</h4>
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
            <pre className="text-sm">
{`import { useJobMatchingAgent } from '../hooks/useJobMatchingAgent';

const MyComponent = () => {
  const {
    loading,
    error,
    fetchMatchingJobs,
    fetchRecommendedCandidates,
    createJobPost,
    scheduleInterview
  } = useJobMatchingAgent();

  const handleJobSearch = async () => {
    const jobs = await fetchMatchingJobs({
      date: 'week',
      jobType: 'full-time'
    });
    console.log('Found jobs:', jobs);
  };

  return (
    <button onClick={handleJobSearch}>
      Find Matching Jobs
    </button>
  );
};`}
            </pre>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AgentIntegrationExample;

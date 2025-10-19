import React, { useState } from 'react';
import { Search, Users, Briefcase, Calendar } from 'lucide-react';
import Button from '../common/Button';
import Card from '../common/Card';

const JobMatchingAgentComponentSimple = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const tabs = [
    { id: 'jobs', label: 'Find Matching Jobs', icon: Search },
    { id: 'candidates', label: 'Find Candidates', icon: Users },
    { id: 'create-job', label: 'Create Job Post', icon: Briefcase },
    { id: 'schedule', label: 'Schedule Interview', icon: Calendar }
  ];

  const [activeTab, setActiveTab] = useState('jobs');

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Job Matching Agent
        </h1>
        <p className="text-gray-600">
          AI-powered job matching, candidate recommendations, job creation, and interview scheduling
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Find Matching Jobs Tab */}
        {activeTab === 'jobs' && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Search for Matching Jobs</h3>
            <p className="text-gray-600 mb-4">
              This feature will help you find jobs that match your skills and preferences.
            </p>
            <Button disabled={loading}>
              {loading ? 'Searching...' : 'Search Jobs'}
            </Button>
          </Card>
        )}

        {/* Find Candidates Tab */}
        {activeTab === 'candidates' && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Find Recommended Candidates</h3>
            <p className="text-gray-600 mb-4">
              This feature will help you find candidates that match your job requirements.
            </p>
            <Button disabled={loading}>
              {loading ? 'Searching...' : 'Search Candidates'}
            </Button>
          </Card>
        )}

        {/* Create Job Post Tab */}
        {activeTab === 'create-job' && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Create New Job Post</h3>
            <p className="text-gray-600 mb-4">
              This feature will help you create and optimize job postings.
            </p>
            <Button disabled={loading}>
              {loading ? 'Creating...' : 'Create Job Post'}
            </Button>
          </Card>
        )}

        {/* Schedule Interview Tab */}
        {activeTab === 'schedule' && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Schedule Interview</h3>
            <p className="text-gray-600 mb-4">
              This feature will help you schedule interviews with candidates.
            </p>
            <Button disabled={loading}>
              {loading ? 'Scheduling...' : 'Schedule Interview'}
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
};

export default JobMatchingAgentComponentSimple;

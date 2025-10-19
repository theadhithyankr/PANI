import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Users, 
  Briefcase, 
  Calendar, 
  Filter, 
  RefreshCw, 
  Star,
  MapPin,
  Clock,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useJobMatchingAgent } from '../../hooks/useJobMatchingAgent';
import Button from '../common/Button';
import Card from '../common/Card';
import Input from '../common/Input';
import Select from '../common/Select';
import Badge from '../common/Badge';

const JobMatchingAgentComponent = () => {
  const {
    loading,
    error,
    fetchMatchingJobs,
    fetchRecommendedCandidates,
    createJobPost,
    scheduleInterview,
    getCacheStats,
    clearCache
  } = useJobMatchingAgent();

  // State for different agent functions
  const [activeTab, setActiveTab] = useState('jobs');
  const [matchingJobs, setMatchingJobs] = useState([]);
  const [recommendedCandidates, setRecommendedCandidates] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [availableJobs, setAvailableJobs] = useState([]);

  // Filters
  const [jobFilters, setJobFilters] = useState({
    date: 'all',
    jobType: 'all',
    company: '',
    experience: 'all',
    location: ''
  });

  const [candidateFilters, setCandidateFilters] = useState({
    experience: 'all',
    location: 'all',
    searchTerm: ''
  });

  // Job creation form
  const [jobFormData, setJobFormData] = useState({
    title: '',
    description: '',
    requirements: '',
    responsibilities: '',
    location: '',
    job_type: 'full-time',
    experience_level: 'mid',
    skills_required: [],
    salary_type: 'negotiable',
    salary_min: '',
    salary_max: '',
    is_remote: false,
    is_hybrid: false
  });

  // Interview scheduling form
  const [interviewFormData, setInterviewFormData] = useState({
    jobId: '',
    candidateId: '',
    interviewDate: '',
    interviewTime: '',
    interviewType: '1st_interview',
    interviewFormat: 'video',
    location: '',
    durationMinutes: 60,
    meetingLink: '',
    agenda: '',
    notes: ''
  });

  // Load available jobs for interview scheduling
  useEffect(() => {
    const loadAvailableJobs = async () => {
      try {
        // This would typically come from your jobs store
        // For now, we'll use a placeholder
        setAvailableJobs([
          { id: '1', title: 'Senior Frontend Developer', company: 'TechCorp' },
          { id: '2', title: 'Full Stack Engineer', company: 'StartupXYZ' },
          { id: '3', title: 'React Developer', company: 'BigTech Inc' }
        ]);
      } catch (err) {
        console.error('Error loading available jobs:', err);
      }
    };

    loadAvailableJobs();
  }, []);

  // Handle job search
  const handleJobSearch = async () => {
    try {
      const jobs = await fetchMatchingJobs(jobFilters);
      setMatchingJobs(jobs);
    } catch (err) {
      console.error('Error fetching matching jobs:', err);
    }
  };

  // Handle candidate search
  const handleCandidateSearch = async () => {
    if (!selectedJobId) {
      alert('Please select a job first');
      return;
    }

    try {
      const candidates = await fetchRecommendedCandidates(selectedJobId, candidateFilters);
      setRecommendedCandidates(candidates);
    } catch (err) {
      console.error('Error fetching recommended candidates:', err);
    }
  };

  // Handle job creation
  const handleJobCreation = async (e) => {
    e.preventDefault();
    try {
      const newJob = await createJobPost(jobFormData);
      alert('Job created successfully!');
      console.log('Created job:', newJob);
      // Reset form
      setJobFormData({
        title: '',
        description: '',
        requirements: '',
        responsibilities: '',
        location: '',
        job_type: 'full-time',
        experience_level: 'mid',
        skills_required: [],
        salary_type: 'negotiable',
        salary_min: '',
        salary_max: '',
        is_remote: false,
        is_hybrid: false
      });
    } catch (err) {
      console.error('Error creating job:', err);
    }
  };

  // Handle interview scheduling
  const handleInterviewScheduling = async (e) => {
    e.preventDefault();
    try {
      const interviewDateTime = new Date(`${interviewFormData.interviewDate}T${interviewFormData.interviewTime}`);
      const interviewData = {
        ...interviewFormData,
        interviewDate: interviewDateTime.toISOString()
      };
      
      const newInterview = await scheduleInterview(interviewData);
      alert('Interview scheduled successfully!');
      console.log('Scheduled interview:', newInterview);
      // Reset form
      setInterviewFormData({
        jobId: '',
        candidateId: '',
        interviewDate: '',
        interviewTime: '',
        interviewType: '1st_interview',
        interviewFormat: 'video',
        location: '',
        durationMinutes: 60,
        meetingLink: '',
        agenda: '',
        notes: ''
      });
    } catch (err) {
      console.error('Error scheduling interview:', err);
    }
  };

  const tabs = [
    { id: 'jobs', label: 'Find Matching Jobs', icon: Search },
    { id: 'candidates', label: 'Find Candidates', icon: Users },
    { id: 'create-job', label: 'Create Job Post', icon: Briefcase },
    { id: 'schedule', label: 'Schedule Interview', icon: Calendar }
  ];

  const jobTypeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'full-time', label: 'Full-time' },
    { value: 'part-time', label: 'Part-time' },
    { value: 'contract', label: 'Contract' },
    { value: 'internship', label: 'Internship' }
  ];

  const experienceOptions = [
    { value: 'all', label: 'All Levels' },
    { value: 'entry', label: 'Entry Level (0-2 years)' },
    { value: 'mid', label: 'Mid Level (2-5 years)' },
    { value: 'senior', label: 'Senior Level (5-8 years)' },
    { value: 'lead', label: 'Lead Level (8-12 years)' },
    { value: 'executive', label: 'Executive (12+ years)' }
  ];

  const dateOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' }
  ];

  const interviewTypeOptions = [
    { value: '1st_interview', label: 'First Interview' },
    { value: '2nd_interview', label: 'Second Interview' },
    { value: 'final_interview', label: 'Final Interview' },
    { value: 'technical', label: 'Technical Interview' },
    { value: 'hr', label: 'HR Interview' }
  ];

  const interviewFormatOptions = [
    { value: 'video', label: 'Video Call' },
    { value: 'phone', label: 'Phone Call' },
    { value: 'in-person', label: 'In-Person' },
    { value: 'hybrid', label: 'Hybrid' }
  ];

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
          <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
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
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Search for Matching Jobs</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Select
                  label="Date Posted"
                  value={jobFilters.date}
                  onChange={(value) => setJobFilters(prev => ({ ...prev, date: value }))}
                  options={dateOptions}
                />
                
                <Select
                  label="Job Type"
                  value={jobFilters.jobType}
                  onChange={(value) => setJobFilters(prev => ({ ...prev, jobType: value }))}
                  options={jobTypeOptions}
                />
                
                <Select
                  label="Experience Level"
                  value={jobFilters.experience}
                  onChange={(value) => setJobFilters(prev => ({ ...prev, experience: value }))}
                  options={experienceOptions}
                />
                
                <Input
                  label="Location"
                  value={jobFilters.location}
                  onChange={(e) => setJobFilters(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="e.g., New York, Remote"
                />
              </div>

              <div className="flex justify-between items-center">
                <Input
                  label="Company Name"
                  value={jobFilters.company}
                  onChange={(e) => setJobFilters(prev => ({ ...prev, company: e.target.value }))}
                  placeholder="Search by company name"
                  className="flex-1 mr-4"
                />
                
                <Button
                  onClick={handleJobSearch}
                  disabled={loading}
                  className="flex items-center"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4 mr-2" />
                  )}
                  Search Jobs
                </Button>
              </div>
            </Card>

            {/* Job Results */}
            {matchingJobs.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Matching Jobs ({matchingJobs.length})</h3>
                {matchingJobs.map((job) => (
                  <Card key={job.id} className="p-6 hover:shadow-lg transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-xl font-semibold text-gray-900">{job.title}</h4>
                        <p className="text-gray-600">{job.companies?.name}</p>
                        <div className="flex items-center mt-2 text-sm text-gray-500">
                          <MapPin className="h-4 w-4 mr-1" />
                          {job.location}
                          <Clock className="h-4 w-4 ml-4 mr-1" />
                          {job.job_type}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant={job.matchPercentage > 80 ? 'success' : job.matchPercentage > 60 ? 'warning' : 'default'}
                          className="text-sm"
                        >
                          {job.matchPercentage}% Match
                        </Badge>
                      </div>
                    </div>
                    
                    <p className="text-gray-700 mb-4 line-clamp-3">{job.description}</p>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {job.skills_required?.slice(0, 5).map((skill, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {job.skills_required?.length > 5 && (
                        <Badge variant="secondary" className="text-xs">
                          +{job.skills_required.length - 5} more
                        </Badge>
                      )}
                    </div>

                    {job.matchReasons && job.matchReasons.length > 0 && (
                      <div className="bg-green-50 p-3 rounded-lg">
                        <h5 className="text-sm font-medium text-green-800 mb-2">Why this job matches you:</h5>
                        <ul className="text-sm text-green-700 space-y-1">
                          {job.matchReasons.map((reason, index) => (
                            <li key={index} className="flex items-center">
                              <CheckCircle className="h-3 w-3 mr-2" />
                              {reason}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Find Candidates Tab */}
        {activeTab === 'candidates' && (
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Find Recommended Candidates</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <Select
                  label="Select Job"
                  value={selectedJobId}
                  onChange={(value) => setSelectedJobId(value)}
                  options={[
                    { value: '', label: 'Select a job...' },
                    ...availableJobs.map(job => ({
                      value: job.id,
                      label: `${job.title} - ${job.company}`
                    }))
                  ]}
                />
                
                <Select
                  label="Experience Level"
                  value={candidateFilters.experience}
                  onChange={(value) => setCandidateFilters(prev => ({ ...prev, experience: value }))}
                  options={experienceOptions}
                />
                
                <Input
                  label="Search Term"
                  value={candidateFilters.searchTerm}
                  onChange={(e) => setCandidateFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                  placeholder="Search by name or skills"
                />
              </div>

              <Button
                onClick={handleCandidateSearch}
                disabled={loading || !selectedJobId}
                className="flex items-center"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Users className="h-4 w-4 mr-2" />
                )}
                Find Candidates
              </Button>
            </Card>

            {/* Candidate Results */}
            {recommendedCandidates.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Recommended Candidates ({recommendedCandidates.length})</h3>
                {recommendedCandidates.map((candidate) => (
                  <Card key={candidate.id} className="p-6 hover:shadow-lg transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-lg font-semibold text-gray-600">
                            {candidate.profiles?.full_name?.charAt(0) || '?'}
                          </span>
                        </div>
                        <div>
                          <h4 className="text-xl font-semibold text-gray-900">
                            {candidate.profiles?.full_name || 'Unknown'}
                          </h4>
                          <p className="text-gray-600">{candidate.headline || 'Job Seeker'}</p>
                          <div className="flex items-center mt-2 text-sm text-gray-500">
                            <MapPin className="h-4 w-4 mr-1" />
                            {candidate.current_location || 'Location not specified'}
                            <Clock className="h-4 w-4 ml-4 mr-1" />
                            {candidate.experience_years || 0} years experience
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant={candidate.matchPercentage > 80 ? 'success' : candidate.matchPercentage > 60 ? 'warning' : 'default'}
                          className="text-sm"
                        >
                          {candidate.matchPercentage}% Match
                        </Badge>
                      </div>
                    </div>
                    
                    <p className="text-gray-700 mb-4 line-clamp-3">
                      {candidate.ai_generated_summary || candidate.summary || 'No summary available'}
                    </p>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {candidate.skills?.slice(0, 5).map((skill, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {candidate.skills?.length > 5 && (
                        <Badge variant="secondary" className="text-xs">
                          +{candidate.skills.length - 5} more
                        </Badge>
                      )}
                    </div>

                    {candidate.matchReasons && candidate.matchReasons.length > 0 && (
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <h5 className="text-sm font-medium text-blue-800 mb-2">Why this candidate is a good fit:</h5>
                        <ul className="text-sm text-blue-700 space-y-1">
                          {candidate.matchReasons.map((reason, index) => (
                            <li key={index} className="flex items-center">
                              <CheckCircle className="h-3 w-3 mr-2" />
                              {reason}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Create Job Post Tab */}
        {activeTab === 'create-job' && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Create New Job Post</h3>
            
            <form onSubmit={handleJobCreation} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Job Title"
                  value={jobFormData.title}
                  onChange={(e) => setJobFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Senior Frontend Developer"
                  required
                />
                
                <Input
                  label="Location"
                  value={jobFormData.location}
                  onChange={(e) => setJobFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="e.g., New York, NY or Remote"
                  required
                />
                
                <Select
                  label="Job Type"
                  value={jobFormData.job_type}
                  onChange={(value) => setJobFormData(prev => ({ ...prev, job_type: value }))}
                  options={jobTypeOptions.filter(opt => opt.value !== 'all')}
                />
                
                <Select
                  label="Experience Level"
                  value={jobFormData.experience_level}
                  onChange={(value) => setJobFormData(prev => ({ ...prev, experience_level: value }))}
                  options={experienceOptions.filter(opt => opt.value !== 'all')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Description
                </label>
                <textarea
                  value={jobFormData.description}
                  onChange={(e) => setJobFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  placeholder="Describe the role, responsibilities, and what makes this job exciting..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Requirements
                </label>
                <textarea
                  value={jobFormData.requirements}
                  onChange={(e) => setJobFormData(prev => ({ ...prev, requirements: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="List the key requirements for this position..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Responsibilities
                </label>
                <textarea
                  value={jobFormData.responsibilities}
                  onChange={(e) => setJobFormData(prev => ({ ...prev, responsibilities: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Describe the main responsibilities and duties..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Skills Required (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={jobFormData.skills_required.join(', ')}
                    onChange={(e) => setJobFormData(prev => ({ 
                      ...prev, 
                      skills_required: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., React, JavaScript, TypeScript, Node.js"
                  />
                </div>

                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={jobFormData.is_remote}
                      onChange={(e) => setJobFormData(prev => ({ ...prev, is_remote: e.target.checked }))}
                      className="mr-2"
                    />
                    Remote Work
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={jobFormData.is_hybrid}
                      onChange={(e) => setJobFormData(prev => ({ ...prev, is_hybrid: e.target.checked }))}
                      className="mr-2"
                    />
                    Hybrid Work
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setJobFormData({
                    title: '',
                    description: '',
                    requirements: '',
                    responsibilities: '',
                    location: '',
                    job_type: 'full-time',
                    experience_level: 'mid',
                    skills_required: [],
                    salary_type: 'negotiable',
                    salary_min: '',
                    salary_max: '',
                    is_remote: false,
                    is_hybrid: false
                  })}
                >
                  Reset
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex items-center"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Briefcase className="h-4 w-4 mr-2" />
                  )}
                  Create Job Post
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Schedule Interview Tab */}
        {activeTab === 'schedule' && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Schedule Interview</h3>
            
            <form onSubmit={handleInterviewScheduling} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Select
                  label="Select Job"
                  value={interviewFormData.jobId}
                  onChange={(value) => setInterviewFormData(prev => ({ ...prev, jobId: value }))}
                  options={[
                    { value: '', label: 'Select a job...' },
                    ...availableJobs.map(job => ({
                      value: job.id,
                      label: `${job.title} - ${job.company}`
                    }))
                  ]}
                  required
                />
                
                <Input
                  label="Candidate ID"
                  value={interviewFormData.candidateId}
                  onChange={(e) => setInterviewFormData(prev => ({ ...prev, candidateId: e.target.value }))}
                  placeholder="Enter candidate user ID"
                  required
                />
                
                <Input
                  label="Interview Date"
                  type="date"
                  value={interviewFormData.interviewDate}
                  onChange={(e) => setInterviewFormData(prev => ({ ...prev, interviewDate: e.target.value }))}
                  required
                />
                
                <Input
                  label="Interview Time"
                  type="time"
                  value={interviewFormData.interviewTime}
                  onChange={(e) => setInterviewFormData(prev => ({ ...prev, interviewTime: e.target.value }))}
                  required
                />
                
                <Select
                  label="Interview Type"
                  value={interviewFormData.interviewType}
                  onChange={(value) => setInterviewFormData(prev => ({ ...prev, interviewType: value }))}
                  options={interviewTypeOptions}
                />
                
                <Select
                  label="Interview Format"
                  value={interviewFormData.interviewFormat}
                  onChange={(value) => setInterviewFormData(prev => ({ ...prev, interviewFormat: value }))}
                  options={interviewFormatOptions}
                />
                
                <Input
                  label="Duration (minutes)"
                  type="number"
                  value={interviewFormData.durationMinutes}
                  onChange={(e) => setInterviewFormData(prev => ({ ...prev, durationMinutes: parseInt(e.target.value) }))}
                  min="15"
                  max="480"
                />
                
                <Input
                  label="Location/Meeting Link"
                  value={interviewFormData.location}
                  onChange={(e) => setInterviewFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Office address or video call link"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Agenda
                </label>
                <textarea
                  value={interviewFormData.agenda}
                  onChange={(e) => setInterviewFormData(prev => ({ ...prev, agenda: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Outline the interview agenda and topics to discuss..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes
                </label>
                <textarea
                  value={interviewFormData.notes}
                  onChange={(e) => setInterviewFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="Any additional notes or special instructions..."
                />
              </div>

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setInterviewFormData({
                    jobId: '',
                    candidateId: '',
                    interviewDate: '',
                    interviewTime: '',
                    interviewType: '1st_interview',
                    interviewFormat: 'video',
                    location: '',
                    durationMinutes: 60,
                    meetingLink: '',
                    agenda: '',
                    notes: ''
                  })}
                >
                  Reset
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex items-center"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Calendar className="h-4 w-4 mr-2" />
                  )}
                  Schedule Interview
                </Button>
              </div>
            </form>
          </Card>
        )}
      </div>

      {/* Agent Stats */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Agent Cache: {getCacheStats().size} items
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={clearCache}
            className="flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Clear Cache
          </Button>
        </div>
      </div>
    </div>
  );
};

export default JobMatchingAgentComponent;

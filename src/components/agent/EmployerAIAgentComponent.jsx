import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  Briefcase, 
  Brain, 
  BarChart3, 
  FileText, 
  MessageCircle,
  Star,
  MapPin,
  Clock,
  TrendingUp,
  Target,
  CheckCircle,
  AlertCircle,
  Loader2,
  Sparkles,
  DollarSign,
  Search,
  Plus
} from 'lucide-react';
import { useEmployerAIAgent } from '../../hooks/useEmployerAIAgent';
import { useJobPost } from '../../hooks/employer/useJobPost';
import { useMatchedCandidates } from '../../hooks/employer/useMatchedCandidates';
import useInterviews from '../../hooks/employer/useInterviews';
import useJobCreationAI from '../../hooks/employer/useJobCreationAI';
import Button from '../common/Button';
import Card from '../common/Card';
import Input from '../common/Input';
import Select from '../common/Select';
import Badge from '../common/Badge';
import useGlobalStore from '../../stores/globalStore';

const EmployerAIAgentComponent = () => {
  const {
    loading: aiLoading,
    error: aiError,
    fetchAICandidateRecommendations,
    createAIJobPost,
    evaluateCandidate,
    getMarketInsights,
    analyzeResumeForHiring,
    prepareInterviewForEmployer,
    getCacheStats,
    clearCache
  } = useEmployerAIAgent();

  // Real data hooks
  const { jobs, loading: jobsLoading, error: jobsError, listJobs, createJob } = useJobPost();
  const { candidates, loading: candidatesLoading, error: candidatesError, fetchMatchedCandidates } = useMatchedCandidates();
  const { interviews, loading: interviewsLoading, fetchInterviews } = useInterviews();
  const { createJobWithAI, loading: aiJobLoading } = useJobCreationAI();
  const user = useGlobalStore((state) => state.user);
  const profile = useGlobalStore((state) => state.profile);

  // State for different AI functions
  const [activeTab, setActiveTab] = useState('candidates');
  const [aiCandidates, setAiCandidates] = useState([]);
  const [jobCreation, setJobCreation] = useState(null);
  const [candidateEvaluation, setCandidateEvaluation] = useState(null);
  const [marketInsights, setMarketInsights] = useState(null);
  const [resumeAnalysis, setResumeAnalysis] = useState(null);
  const [interviewPrep, setInterviewPrep] = useState(null);

  // Ref to track if data has been fetched
  const hasFetchedData = useRef(false);

  // Combined loading and error states
  const loading = aiLoading || jobsLoading || candidatesLoading || interviewsLoading || aiJobLoading;
  const error = aiError || jobsError || candidatesError;

  // Load real data on component mount
  useEffect(() => {
    if (profile?.company?.id && !hasFetchedData.current) {
      hasFetchedData.current = true;
      listJobs();
      fetchMatchedCandidates();
      fetchInterviews();
    }
  }, [profile?.company?.id]); // Remove function dependencies to prevent infinite loops

  // Update AI candidates when real candidates change
  useEffect(() => {
    if (candidates && candidates.length > 0) {
      setAiCandidates(candidates);
    }
  }, [candidates]);

  // Filters and inputs
  const [candidateFilters, setCandidateFilters] = useState({
    experience: 'all',
    location: '',
    skills: ''
  });

  const [jobFormData, setJobFormData] = useState({
    title: '',
    description: '',
    requirements: '',
    responsibilities: '',
    location: '',
    job_type: 'full-time',
    experience_level: 'mid',
    salary_min: '',
    salary_max: '',
    skills_required: []
  });

  const [evaluationQuery, setEvaluationQuery] = useState('');
  const [marketQuery, setMarketQuery] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [interviewJobId, setInterviewJobId] = useState('');

  // Handle candidate search with AI enhancement
  const handleCandidateSearch = async () => {
    try {
      const aiPrompt = `Find candidates that match our company culture and job requirements. 
                       Focus on skills: ${candidateFilters.skills || 'Any'}. 
                       Experience level: ${candidateFilters.experience}.`;
      
      const candidates = await fetchAICandidateRecommendations(candidateFilters, aiPrompt);
      setAiCandidates(candidates);
    } catch (err) {
      console.error('Error fetching AI candidates:', err);
    }
  };

  // Handle job creation with AI
  const handleJobCreation = async (e) => {
    e.preventDefault();
    try {
      const newJob = await createJobWithAI(jobFormData);
      setJobCreation(newJob);
      // Refresh jobs list
      listJobs();
    } catch (err) {
      console.error('Error creating job:', err);
    }
  };

  // Handle candidate evaluation
  const handleCandidateEvaluation = async () => {
    if (!evaluationQuery.trim()) return;
    
    try {
      const evaluation = await evaluateCandidate(evaluationQuery);
      setCandidateEvaluation(evaluation);
    } catch (err) {
      console.error('Error evaluating candidate:', err);
    }
  };

  // Handle market insights
  const handleMarketInsights = async () => {
    if (!marketQuery.trim()) return;
    
    try {
      const insights = await getMarketInsights(marketQuery);
      setMarketInsights(insights);
    } catch (err) {
      console.error('Error getting market insights:', err);
    }
  };

  // Handle resume analysis for hiring
  const handleResumeAnalysis = async () => {
    if (!resumeText.trim()) return;
    
    try {
      const analysis = await analyzeResumeForHiring(resumeText);
      setResumeAnalysis(analysis);
    } catch (err) {
      console.error('Error analyzing resume:', err);
    }
  };

  // Handle interview preparation for employer
  const handleInterviewPrep = async () => {
    if (!interviewJobId) return;
    
    try {
      const prep = await prepareInterviewForEmployer(interviewJobId);
      setInterviewPrep(prep);
    } catch (err) {
      console.error('Error preparing interview:', err);
    }
  };

  const tabs = [
    { id: 'candidates', label: 'AI Candidate Search', icon: Users, count: aiCandidates.length },
    { id: 'jobs', label: 'My Job Posts', icon: Briefcase, count: jobs.length },
    { id: 'create-job', label: 'Create Job with AI', icon: Plus },
    { id: 'evaluate', label: 'Candidate Evaluation', icon: Star },
    { id: 'market', label: 'Market Insights', icon: BarChart3 },
    { id: 'resume', label: 'Resume Analysis', icon: FileText },
    { id: 'interview', label: 'Interview Prep', icon: MessageCircle },
    { id: 'interviews', label: 'Scheduled Interviews', icon: Clock, count: interviews.length }
  ];

  const formatSalary = (min, max) => {
    if (!min && !max) return 'Salary not specified';
    if (!min) return `Up to $${max?.toLocaleString()}`;
    if (!max) return `From $${min?.toLocaleString()}`;
    return `$${min?.toLocaleString()} - $${max?.toLocaleString()}`;
  };

  const getMatchScore = (candidate) => {
    // Use the match score calculated by useMatchedCandidates hook
    return candidate.matchScore || 0;
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          AI Hiring Assistant
        </h1>
        <p className="text-gray-600">
          AI-powered candidate matching, job creation, and hiring insights for your company
        </p>
        {profile?.company && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900">Company Profile</h3>
            <p className="text-blue-700 text-sm mt-1">
              <strong>Company:</strong> {profile.company.name} | 
              <strong> Industry:</strong> {profile.company.industry || 'Not specified'} | 
              <strong> Size:</strong> {profile.company.size || 'Not specified'}
            </p>
          </div>
        )}
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
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                  {tab.count !== undefined && (
                    <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* AI Candidate Search Tab */}
        {activeTab === 'candidates' && (
          <div className="space-y-6">
            {/* Candidate Filters */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">AI Candidate Search</h3>
              <p className="text-sm text-gray-600 mb-4">
                Showing only candidates whose skills match your posted job requirements. 
                Candidates are ranked by their compatibility with your open positions.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <Select
                  value={candidateFilters.experience}
                  onChange={(e) => setCandidateFilters({...candidateFilters, experience: e.target.value})}
                  options={[
                    { value: 'all', label: 'All Experience Levels' },
                    { value: 'entry', label: 'Entry Level (0-2 years)' },
                    { value: 'mid', label: 'Mid Level (3-5 years)' },
                    { value: 'senior', label: 'Senior Level (6+ years)' }
                  ]}
                />
                <Input
                  placeholder="Location"
                  value={candidateFilters.location}
                  onChange={(e) => setCandidateFilters({...candidateFilters, location: e.target.value})}
                />
                <Input
                  placeholder="Skills (comma separated)"
                  value={candidateFilters.skills}
                  onChange={(e) => setCandidateFilters({...candidateFilters, skills: e.target.value})}
                />
              </div>
              <Button onClick={handleCandidateSearch} disabled={loading} className="flex items-center">
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                Find AI-Matched Candidates
              </Button>
            </Card>

            {/* Candidate Results */}
            <div className="space-y-4">
              {aiCandidates.map((candidate) => {
                const matchScore = getMatchScore(candidate);
                return (
                  <Card key={candidate.id} className="p-6 hover:shadow-lg transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          {candidate.name || 'Candidate'}
                        </h3>
                        <p className="text-gray-600 mb-2">{candidate.headline}</p>
                        <div className="flex items-center text-gray-600 mb-2">
                          <MapPin className="h-4 w-4 mr-2" />
                          <span>{candidate.current_location}</span>
                          <Clock className="h-4 w-4 ml-4 mr-2" />
                          <span>{candidate.experience_years} years experience</span>
                        </div>
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{candidate.summary}</p>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {candidate.skills?.slice(0, 5).map((skill, index) => (
                            <Badge key={index} variant="secondary">{skill}</Badge>
                          ))}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center mb-2">
                          <Target className="h-4 w-4 mr-1 text-green-500" />
                          <span className="text-sm font-medium text-green-600">{matchScore}% Match</span>
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatSalary(candidate.target_salary_range?.min, candidate.target_salary_range?.max)}
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center text-sm text-gray-500">
                        <span>{candidate.preferred_job_types?.join(', ') || 'Any type'}</span>
                      </div>
                      <div className="space-x-2">
                        <Button size="sm" variant="outline">View Profile</Button>
                        <Button size="sm">Contact</Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* My Job Posts Tab */}
        {activeTab === 'jobs' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">My Job Posts ({jobs.length})</h3>
            {jobs.length === 0 ? (
              <Card className="p-6 text-center">
                <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No job posts yet. Create your first job!</p>
              </Card>
            ) : (
              jobs.map((job) => (
                <Card key={job.id} className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="text-xl font-semibold mb-2">{job.title}</h4>
                      <div className="flex items-center text-gray-600 mb-2">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span>{job.location}</span>
                        <Clock className="h-4 w-4 ml-4 mr-2" />
                        <span>{job.job_type}</span>
                      </div>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{job.description}</p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {job.skills_required?.slice(0, 5).map((skill, index) => (
                          <Badge key={index} variant="secondary">{skill}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500 mb-2">
                        {formatSalary(job.salary_min, job.salary_max)}
                      </div>
                      <Badge variant={job.status === 'active' ? 'success' : 'secondary'}>
                        {job.status}
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Create Job with AI Tab */}
        {activeTab === 'create-job' && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Create Job Post with AI</h3>
            <form onSubmit={handleJobCreation} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Job Title"
                  value={jobFormData.title}
                  onChange={(e) => setJobFormData({...jobFormData, title: e.target.value})}
                  required
                />
                <Input
                  label="Location"
                  value={jobFormData.location}
                  onChange={(e) => setJobFormData({...jobFormData, location: e.target.value})}
                  required
                />
                <Select
                  label="Job Type"
                  value={jobFormData.job_type}
                  onChange={(e) => setJobFormData({...jobFormData, job_type: e.target.value})}
                  options={[
                    { value: 'full-time', label: 'Full-time' },
                    { value: 'part-time', label: 'Part-time' },
                    { value: 'contract', label: 'Contract' },
                    { value: 'internship', label: 'Internship' }
                  ]}
                />
                <Select
                  label="Experience Level"
                  value={jobFormData.experience_level}
                  onChange={(e) => setJobFormData({...jobFormData, experience_level: e.target.value})}
                  options={[
                    { value: 'entry', label: 'Entry Level' },
                    { value: 'mid', label: 'Mid Level' },
                    { value: 'senior', label: 'Senior Level' },
                    { value: 'executive', label: 'Executive' }
                  ]}
                />
                <Input
                  label="Min Salary"
                  type="number"
                  value={jobFormData.salary_min}
                  onChange={(e) => setJobFormData({...jobFormData, salary_min: e.target.value})}
                />
                <Input
                  label="Max Salary"
                  type="number"
                  value={jobFormData.salary_max}
                  onChange={(e) => setJobFormData({...jobFormData, salary_max: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Job Description</label>
                <textarea
                  value={jobFormData.description}
                  onChange={(e) => setJobFormData({...jobFormData, description: e.target.value})}
                  className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Requirements</label>
                <textarea
                  value={jobFormData.requirements}
                  onChange={(e) => setJobFormData({...jobFormData, requirements: e.target.value})}
                  className="w-full h-24 p-3 border border-gray-300 rounded-lg resize-none"
                />
              </div>
              <Button type="submit" disabled={loading} className="flex items-center">
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                Create Job with AI
              </Button>
            </form>
            {jobCreation && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2">Job Created Successfully!</h4>
                <p className="text-green-700">Your job post has been created and is now live.</p>
              </div>
            )}
          </Card>
        )}

        {/* Candidate Evaluation Tab */}
        {activeTab === 'evaluate' && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">AI Candidate Evaluation</h3>
            <div className="space-y-4">
              <Input
                placeholder="Describe the candidate you want to evaluate..."
                value={evaluationQuery}
                onChange={(e) => setEvaluationQuery(e.target.value)}
                className="w-full"
              />
              <Button onClick={handleCandidateEvaluation} disabled={loading || !evaluationQuery.trim()}>
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Star className="h-4 w-4 mr-2" />}
                Evaluate Candidate
              </Button>
              {candidateEvaluation && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Candidate Evaluation</h4>
                  <p className="text-blue-700">{candidateEvaluation}</p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Market Insights Tab */}
        {activeTab === 'market' && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">AI Market Insights</h3>
            <div className="space-y-4">
              <Input
                placeholder="Ask about market trends, salary ranges, or hiring insights..."
                value={marketQuery}
                onChange={(e) => setMarketQuery(e.target.value)}
                className="w-full"
              />
              <Button onClick={handleMarketInsights} disabled={loading || !marketQuery.trim()}>
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <BarChart3 className="h-4 w-4 mr-2" />}
                Get Market Insights
              </Button>
              {marketInsights && (
                <div className="mt-4 p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-semibold text-purple-900 mb-2">Market Insights</h4>
                  <p className="text-purple-700">{marketInsights}</p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Resume Analysis Tab */}
        {activeTab === 'resume' && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">AI Resume Analysis for Hiring</h3>
            <div className="space-y-4">
              <textarea
                placeholder="Paste candidate's resume text here for AI analysis..."
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none"
              />
              <Button onClick={handleResumeAnalysis} disabled={loading || !resumeText.trim()}>
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
                Analyze Resume
              </Button>
              {resumeAnalysis && (
                <div className="mt-4 p-4 bg-green-50 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-2">Resume Analysis</h4>
                  <p className="text-green-700">{resumeAnalysis}</p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Interview Preparation Tab */}
        {activeTab === 'interview' && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">AI Interview Preparation</h3>
            <div className="space-y-4">
              <Select
                value={interviewJobId}
                onChange={(e) => setInterviewJobId(e.target.value)}
                options={[
                  { value: '', label: 'Select a job for interview prep' },
                  ...jobs.map(job => ({ value: job.id, label: job.title }))
                ]}
              />
              <Button onClick={handleInterviewPrep} disabled={loading || !interviewJobId}>
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <MessageCircle className="h-4 w-4 mr-2" />}
                Prepare Interview Questions
              </Button>
              {interviewPrep && (
                <div className="mt-4 p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-semibold text-purple-900 mb-2">Interview Preparation</h4>
                  <p className="text-purple-700">{interviewPrep}</p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Scheduled Interviews Tab */}
        {activeTab === 'interviews' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Scheduled Interviews ({interviews.length})</h3>
            {interviews.length === 0 ? (
              <Card className="p-6 text-center">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No interviews scheduled yet.</p>
              </Card>
            ) : (
              interviews.map((interview) => (
                <Card key={interview.id} className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{interview.job?.title}</h4>
                      <p className="text-gray-600">{interview.job?.companies?.name}</p>
                      <div className="flex items-center mt-2">
                        <Users className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          Candidate: {interview.seeker_profile?.full_name || interview.application?.applicant?.full_name || 'Unknown'}
                        </span>
                      </div>
                      <div className="flex items-center mt-1">
                        <Clock className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          {new Date(interview.interview_date).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <Badge variant={interview.status === 'scheduled' ? 'success' : 'secondary'}>
                      {interview.status}
                    </Badge>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployerAIAgentComponent;
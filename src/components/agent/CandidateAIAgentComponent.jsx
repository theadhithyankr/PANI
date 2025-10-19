import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Brain, 
  FileText, 
  MessageCircle, 
  Euro,
  Star,
  MapPin,
  Clock,
  TrendingUp,
  Target,
  CheckCircle,
  AlertCircle,
  Loader2,
  Sparkles,
  Briefcase,
  Users
} from 'lucide-react';
import { useCandidateAIAgent } from '../../hooks/useCandidateAIAgent';
import useJobs from '../../hooks/candidate/useJobs';
import useJobSeekerProfile from '../../hooks/candidate/useJobSeekerProfile';
import { useApplicationsStoreData } from '../../hooks/candidate/useApplicationsStore';
import useInterviews from '../../hooks/candidate/useInterviews';
import Button from '../common/Button';
import Card from '../common/Card';
import Input from '../common/Input';
import Select from '../common/Select';
import Badge from '../common/Badge';
import useGlobalStore from '../../stores/globalStore';

const CandidateAIAgentComponent = () => {
  const {
    loading: aiLoading,
    error: aiError,
    fetchAIMatchingJobs,
    getCareerCoaching,
    analyzeResume,
    prepareForInterview,
    getSalaryNegotiationGuidance,
    getCacheStats,
    clearCache
  } = useCandidateAIAgent();

  // Real data hooks
  const { jobs, loading: jobsLoading, error: jobsError, fetchJobs } = useJobs();
  const { profile: jobSeekerProfile, loading: profileLoading } = useJobSeekerProfile();
  const { applications, matchedJobs, loading: applicationsLoading } = useApplicationsStoreData(
    jobSeekerProfile?.id, 
    jobSeekerProfile
  );
  const user = useGlobalStore((state) => state.user);
  const { interviews, loading: interviewsLoading } = useInterviews(user?.id, jobSeekerProfile?.id);

  // State for different AI functions
  const [activeTab, setActiveTab] = useState('jobs');
  const [aiJobs, setAiJobs] = useState([]);
  const [careerAdvice, setCareerAdvice] = useState(null);
  const [resumeAnalysis, setResumeAnalysis] = useState(null);
  const [interviewPrep, setInterviewPrep] = useState(null);
  const [salaryGuidance, setSalaryGuidance] = useState(null);

  // Ref to track if data has been fetched
  const hasFetchedData = useRef(false);

  // Combined loading and error states
  const loading = aiLoading || jobsLoading || profileLoading || applicationsLoading || interviewsLoading;
  const error = aiError || jobsError;

  // Load real jobs on component mount
  useEffect(() => {
    if (jobSeekerProfile?.skills?.length > 0 && !hasFetchedData.current) {
      hasFetchedData.current = true;
      fetchJobs();
    }
  }, [jobSeekerProfile?.skills]); // Remove fetchJobs dependency to prevent infinite loops

  // Update AI jobs when real jobs change
  useEffect(() => {
    if (jobs && jobs.length > 0) {
      setAiJobs(jobs);
    }
  }, [jobs]);

  // Filters and inputs
  const [jobFilters, setJobFilters] = useState({
    date: 'all',
    jobType: 'all',
    company: '',
    experience: 'all',
    location: ''
  });

  const [careerQuery, setCareerQuery] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [interviewJobId, setInterviewJobId] = useState('');
  const [salaryQuery, setSalaryQuery] = useState('');

  // Handle job search with AI enhancement
  const handleJobSearch = async () => {
    try {
      const aiPrompt = `Find jobs that match my skills: ${jobSeekerProfile?.skills?.join(', ') || 'Not specified'}. 
                       My experience: ${jobSeekerProfile?.experience_years || 0} years. 
                       Location preference: ${jobSeekerProfile?.current_location || 'Any'}.`;
      
      const jobs = await fetchAIMatchingJobs(jobFilters, aiPrompt);
      setAiJobs(jobs);
    } catch (err) {
      console.error('Error fetching AI jobs:', err);
    }
  };

  // Handle career coaching
  const handleCareerCoaching = async () => {
    if (!careerQuery.trim()) return;
    
    try {
      const advice = await getCareerCoaching(careerQuery);
      setCareerAdvice(advice);
    } catch (err) {
      console.error('Error getting career advice:', err);
    }
  };

  // Handle resume analysis
  const handleResumeAnalysis = async () => {
    if (!resumeText.trim()) return;
    
    try {
      const analysis = await analyzeResume(resumeText);
      setResumeAnalysis(analysis);
    } catch (err) {
      console.error('Error analyzing resume:', err);
    }
  };

  // Handle interview preparation
  const handleInterviewPrep = async () => {
    if (!interviewJobId) return;
    
    try {
      const prep = await prepareForInterview(interviewJobId);
      setInterviewPrep(prep);
    } catch (err) {
      console.error('Error preparing for interview:', err);
    }
  };

  // Handle salary negotiation
  const handleSalaryGuidance = async () => {
    if (!salaryQuery.trim()) return;
    
    try {
      const guidance = await getSalaryNegotiationGuidance(salaryQuery);
      setSalaryGuidance(guidance);
    } catch (err) {
      console.error('Error getting salary guidance:', err);
    }
  };

  const tabs = [
    { id: 'jobs', label: 'AI Job Matching', icon: Search, count: aiJobs.length },
    { id: 'career', label: 'Career Coaching', icon: Brain },
    { id: 'resume', label: 'Resume Analysis', icon: FileText },
    { id: 'interview', label: 'Interview Prep', icon: MessageCircle },
    { id: 'salary', label: 'Salary Guidance', icon: Euro },
    { id: 'applications', label: 'My Applications', icon: Briefcase, count: applications.length },
    { id: 'interviews', label: 'My Interviews', icon: Users, count: interviews.length }
  ];

  const formatSalary = (min, max) => {
    if (!min && !max) return 'Salary not specified';
    if (!min) return `Up to $${max?.toLocaleString()}`;
    if (!max) return `From $${min?.toLocaleString()}`;
    return `$${min?.toLocaleString()} - $${max?.toLocaleString()}`;
  };

  const getMatchScore = (job) => {
    if (!jobSeekerProfile?.skills?.length || !job.skills_required?.length) return 0;
    
    const userSkills = jobSeekerProfile.skills;
    const jobSkills = job.skills_required;
    const matchingSkills = userSkills.filter(skill => 
      jobSkills.some(jobSkill => 
        jobSkill.toLowerCase().includes(skill.toLowerCase()) || 
        skill.toLowerCase().includes(jobSkill.toLowerCase())
      )
    );
    
    return Math.round((matchingSkills.length / jobSkills.length) * 100);
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          AI Career Assistant
        </h1>
        <p className="text-gray-600">
          AI-powered job matching, career coaching, and interview preparation tailored to your profile
        </p>
        {jobSeekerProfile && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900">Your Profile Summary</h3>
            <p className="text-blue-700 text-sm mt-1">
              <strong>Skills:</strong> {jobSeekerProfile.skills?.join(', ') || 'Not specified'} | 
              <strong> Experience:</strong> {jobSeekerProfile.experience_years || 0} years | 
              <strong> Location:</strong> {jobSeekerProfile.current_location || 'Not specified'}
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
        {/* AI Job Matching Tab */}
        {activeTab === 'jobs' && (
          <div className="space-y-6">
            {/* Job Filters */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">AI Job Search</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
                <Select
                  value={jobFilters.date}
                  onChange={(e) => setJobFilters({...jobFilters, date: e.target.value})}
                  options={[
                    { value: 'all', label: 'All Time' },
                    { value: 'today', label: 'Today' },
                    { value: 'week', label: 'This Week' },
                    { value: 'month', label: 'This Month' }
                  ]}
                />
                <Select
                  value={jobFilters.jobType}
                  onChange={(e) => setJobFilters({...jobFilters, jobType: e.target.value})}
                  options={[
                    { value: 'all', label: 'All Types' },
                    { value: 'full-time', label: 'Full-time' },
                    { value: 'part-time', label: 'Part-time' },
                    { value: 'contract', label: 'Contract' },
                    { value: 'internship', label: 'Internship' }
                  ]}
                />
                <Input
                  placeholder="Company name"
                  value={jobFilters.company}
                  onChange={(e) => setJobFilters({...jobFilters, company: e.target.value})}
                />
                <Select
                  value={jobFilters.experience}
                  onChange={(e) => setJobFilters({...jobFilters, experience: e.target.value})}
                  options={[
                    { value: 'all', label: 'All Levels' },
                    { value: 'entry', label: 'Entry Level' },
                    { value: 'mid', label: 'Mid Level' },
                    { value: 'senior', label: 'Senior Level' },
                    { value: 'executive', label: 'Executive' }
                  ]}
                />
                <Input
                  placeholder="Location"
                  value={jobFilters.location}
                  onChange={(e) => setJobFilters({...jobFilters, location: e.target.value})}
                />
              </div>
              <Button onClick={handleJobSearch} disabled={loading} className="flex items-center">
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                Find AI-Matched Jobs
              </Button>
            </Card>

            {/* Job Results */}
            <div className="space-y-4">
              {aiJobs.map((job) => {
                const matchScore = getMatchScore(job);
                return (
                  <Card key={job.id} className="p-6 hover:shadow-lg transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">{job.title}</h3>
                        <div className="flex items-center text-gray-600 mb-2">
                          <Briefcase className="h-4 w-4 mr-2" />
                          <span>{job.companies?.name || 'Company'}</span>
                          <MapPin className="h-4 w-4 ml-4 mr-2" />
                          <span>{job.location}</span>
                        </div>
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{job.description}</p>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {job.skills_required?.slice(0, 5).map((skill, index) => (
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
                          {formatSalary(job.salary_min, job.salary_max)}
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>{job.job_type}</span>
                        <span className="mx-2">•</span>
                        <span>{job.experience_level}</span>
                      </div>
                      <Button size="sm">Apply Now</Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Career Coaching Tab */}
        {activeTab === 'career' && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">AI Career Coaching</h3>
            <div className="space-y-4">
              <Input
                placeholder="Ask me anything about your career..."
                value={careerQuery}
                onChange={(e) => setCareerQuery(e.target.value)}
                className="w-full"
              />
              <Button onClick={handleCareerCoaching} disabled={loading || !careerQuery.trim()}>
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Brain className="h-4 w-4 mr-2" />}
                Get AI Advice
              </Button>
              {careerAdvice && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">AI Career Advice</h4>
                  <p className="text-blue-700">{careerAdvice}</p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Resume Analysis Tab */}
        {activeTab === 'resume' && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">AI Resume Analysis</h3>
            <div className="space-y-4">
              <textarea
                placeholder="Paste your resume text here for AI analysis..."
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
                  ...aiJobs.map(job => ({ value: job.id, label: job.title }))
                ]}
              />
              <Button onClick={handleInterviewPrep} disabled={loading || !interviewJobId}>
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <MessageCircle className="h-4 w-4 mr-2" />}
                Prepare for Interview
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

        {/* Salary Guidance Tab */}
        {activeTab === 'salary' && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">AI Salary Negotiation Guidance</h3>
            <div className="space-y-4">
              <Input
                placeholder="Ask about salary negotiation strategies..."
                value={salaryQuery}
                onChange={(e) => setSalaryQuery(e.target.value)}
                className="w-full"
              />
              <Button onClick={handleSalaryGuidance} disabled={loading || !salaryQuery.trim()}>
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Euro className="h-4 w-4 mr-2" />}
                Get Salary Guidance
              </Button>
              {salaryGuidance && (
                <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
                  <h4 className="font-semibold text-yellow-900 mb-2">Salary Guidance</h4>
                  <p className="text-yellow-700">{salaryGuidance}</p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* My Applications Tab */}
        {activeTab === 'applications' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">My Applications ({applications.length})</h3>
            {applications.length === 0 ? (
              <Card className="p-6 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No applications yet. Start applying to jobs!</p>
              </Card>
            ) : (
              applications.map((application) => (
                <Card key={application.id} className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{application.job?.title}</h4>
                      <p className="text-gray-600">{application.job?.companies?.name}</p>
                      <Badge variant={application.status === 'accepted' ? 'success' : 'secondary'}>
                        {application.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-500">
                      Applied {new Date(application.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {/* My Interviews Tab */}
        {activeTab === 'interviews' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">My Interviews ({interviews.length})</h3>
            {interviews.length === 0 ? (
              <Card className="p-6 text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No interviews scheduled yet.</p>
              </Card>
            ) : (
              interviews.map((interview) => (
                <Card key={interview.id} className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{interview.job?.title}</h4>
                      <p className="text-gray-600">{interview.job?.company?.name}</p>
                      <div className="flex items-center mt-2">
                        <Clock className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          {new Date(interview.interviewDate).toLocaleString()}
                        </span>
                      </div>
                      {interview.interviewer && (
                        <div className="flex items-center mt-1">
                          <Users className="h-4 w-4 mr-2 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            Interviewer: {interview.interviewer.fullName}
                          </span>
                        </div>
                      )}
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

export default CandidateAIAgentComponent;
import React, { useState } from 'react';
import { Search, Filter, Star, Users, CheckSquare, X, Eye, Calendar, MessageCircle, Download, BarChart3 } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import CandidateDetailModal from '../../components/employer/CandidateDetailModal';
import InterviewSchedulingModal from '../../components/employer/InterviewSchedulingModal';
import { getApplicationsForJob, getCandidatesForJob, getJobById, applications, candidates } from '../../data/dummyData';

const JobApplicantsPage = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedApplicants, setSelectedApplicants] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showSchedulingModal, setShowSchedulingModal] = useState(false);
  const [schedulingCandidate, setSchedulingCandidate] = useState(null);
  const [viewMode, setViewMode] = useState('pipeline');

  const job = getJobById(jobId);
  const jobApplications = getApplicationsForJob(jobId);
  const jobCandidates = getCandidatesForJob(jobId);

  // If job not found, show not found page
  if (!job) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Job Not Found</h2>
        <p className="text-gray-600 mt-2">The job you're looking for doesn't exist.</p>
        <Button variant="primary" onClick={() => navigate('/dashboard/jobs')} className="mt-4">
          Back to Jobs
        </Button>
      </div>
    );
  }

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'applied', label: 'Applied' },
    { value: 'reviewing', label: 'Under Review' },
    { value: 'interviewing', label: 'Interviewing' },
    { value: 'offered', label: 'Offered' },
    { value: 'rejected', label: 'Rejected' },
  ];

  const filteredApplications = jobApplications.filter(app => {
    const candidate = candidates.find(c => c.id === app.candidateId);
    if (!candidate) return false;
    
    const matchesSearch = candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         candidate.position.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'applied': return 'info';
      case 'reviewing': return 'warning';
      case 'interviewing': return 'secondary';
      case 'offered': return 'success';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const handleApplicantSelect = (applicantId, selected) => {
    if (selected) {
      setSelectedApplicants(prev => [...prev, applicantId]);
    } else {
      setSelectedApplicants(prev => prev.filter(id => id !== applicantId));
    }
    setShowBulkActions(selectedApplicants.length > 0 || selected);
  };

  const handleBulkAction = (action) => {
    console.log(`Bulk ${action}:`, selectedApplicants);
    setSelectedApplicants([]);
    setShowBulkActions(false);
  };

  const handleViewProfile = (candidate) => {
    setSelectedCandidate(candidate);
    setShowDetailModal(true);
  };

  const handleScheduleInterview = (candidate) => {
    setSchedulingCandidate(candidate);
    setShowSchedulingModal(true);
  };

  const handleInterviewScheduled = (interviewData) => {
    console.log('Interview scheduled:', interviewData);
    setShowSchedulingModal(false);
    setSchedulingCandidate(null);
  };

  const renderPipelineView = () => {
    const stages = [
      { id: 'applied', label: 'Applied', color: 'bg-blue-100 border-blue-300' },
      { id: 'reviewing', label: 'Under Review', color: 'bg-yellow-100 border-yellow-300' },
      { id: 'interviewing', label: 'Interviewing', color: 'bg-purple-100 border-purple-300' },
      { id: 'offered', label: 'Offered', color: 'bg-green-100 border-green-300' },
      { id: 'rejected', label: 'Rejected', color: 'bg-red-100 border-red-300' },
    ];

    return (
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {stages.map((stage) => {
          const stageApplications = filteredApplications.filter(app => app.status === stage.id);
          
          return (
            <div key={stage.id} className={`rounded-lg border-2 ${stage.color} min-h-[600px]`}>
              <div className="p-4 border-b border-gray-200 bg-white rounded-t-lg">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">{stage.label}</h3>
                  <Badge variant="default" size="sm">{stageApplications.length}</Badge>
                </div>
              </div>
              
              <div className="p-4 space-y-4 max-h-[550px] overflow-y-auto">
                {stageApplications.map((application) => {
                  const candidate = candidates.find(c => c.id === application.candidateId);
                  if (!candidate) return null;
                  
                  return (
                    <Card key={application.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <div className="p-4">
                        <div className="flex items-center space-x-3 mb-3">
                          <img
                            src={candidate.avatar}
                            alt={candidate.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 truncate">{candidate.name}</h4>
                            <p className="text-sm text-gray-600 truncate">{candidate.position}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900">{candidate.matchScore}%</div>
                            <div className="text-xs text-gray-500">match</div>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-1 mb-3">
                          {candidate.skills.slice(0, 2).map((skill, index) => (
                            <Badge key={index} variant="default" size="sm" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {candidate.skills.length > 2 && (
                            <Badge variant="default" size="sm" className="text-xs">
                              +{candidate.skills.length - 2}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="text-xs text-gray-500 mb-3">
                          Applied {new Date(application.appliedDate).toLocaleDateString()}
                        </div>
                        
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleViewProfile(candidate)}>
                            <Eye className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleScheduleInterview(candidate)}>
                            <Calendar className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <MessageCircle className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
                
                {stageApplications.length === 0 && (
                  <div className="text-center py-8">
                    <div className="text-gray-400 mb-2">No candidates</div>
                    <div className="text-xs text-gray-500">in this stage</div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderListView = () => (
    <div className="space-y-4">
      {filteredApplications.map((application) => {
        const candidate = candidates.find(c => c.id === application.candidateId);
        if (!candidate) return null;
        
        return (
          <div key={application.id} className="flex items-start gap-4">
            <input
              type="checkbox"
              checked={selectedApplicants.includes(application.id)}
              onChange={(e) => handleApplicantSelect(application.id, e.target.checked)}
              className="mt-6 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <Card className="flex-1 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between p-6">
                <div className="flex items-center space-x-4">
                  <img
                    src={candidate.avatar}
                    alt={candidate.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">{candidate.name}</h4>
                    <p className="text-gray-600">{candidate.position}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <Badge variant={getStatusColor(application.status)} size="sm">
                        {application.status}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        Applied {new Date(application.appliedDate).toLocaleDateString()}
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {candidate.matchScore}% match
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => handleViewProfile(candidate)}>
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleScheduleInterview(candidate)}>
                    <Calendar className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MessageCircle className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    Move to Next Stage
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Job Info Section */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600">{job.company} • {jobApplications.length} applications</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </Button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {showBulkActions && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckSquare className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-blue-900">
              {selectedApplicants.length} applicant(s) selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => handleBulkAction('advance')}>
              <Star className="w-4 h-4 mr-2" />
              Advance All
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleBulkAction('reject')}>
              <X className="w-4 h-4 mr-2" />
              Reject All
            </Button>
            <Button variant="ghost" size="sm" onClick={() => {
              setSelectedApplicants([]);
              setShowBulkActions(false);
            }}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {[
          { label: 'Total', count: jobApplications.length, color: 'text-blue-600' },
          { label: 'Applied', count: jobApplications.filter(app => app.status === 'applied').length, color: 'text-gray-600' },
          { label: 'Reviewing', count: jobApplications.filter(app => app.status === 'reviewing').length, color: 'text-yellow-600' },
          { label: 'Interviewing', count: jobApplications.filter(app => app.status === 'interviewing').length, color: 'text-purple-600' },
          { label: 'Offered', count: jobApplications.filter(app => app.status === 'offered').length, color: 'text-green-600' },
        ].map((stat, index) => (
          <Card key={index} padding="sm">
            <div className="text-center">
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.count}</div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="flex flex-1 gap-4 w-full lg:w-auto">
          <div className="flex-1 max-w-md">
            <Input
              placeholder="Search applicants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search className="w-4 h-4" />}
            />
          </div>
          <Select
            options={statusOptions}
            value={statusFilter}
            onChange={setStatusFilter}
            className="w-48"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            More Filters
          </Button>
          <div className="flex items-center border border-gray-300 rounded-lg">
            <Button
              variant={viewMode === 'pipeline' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('pipeline')}
              className="rounded-r-none border-r-0"
            >
              Pipeline
            </Button>
            <Button
              variant={viewMode === 'list' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              List
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'pipeline' ? renderPipelineView() : renderListView()}

      {filteredApplications.length === 0 && (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No applicants found</h3>
          <p className="text-gray-600 mb-6">
            {jobApplications.length === 0 
              ? 'No applications have been received for this job yet.'
              : 'Try adjusting your search or filters to find applicants.'
            }
          </p>
        </div>
      )}

      {/* Modals */}
      <CandidateDetailModal
        candidate={selectedCandidate}
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedCandidate(null);
        }}
        onShortlist={() => {}}
        onReject={() => {}}
        onScheduleInterview={(candidate) => {
          setShowDetailModal(false);
          handleScheduleInterview(candidate);
        }}
      />

      <InterviewSchedulingModal
        candidate={schedulingCandidate}
        isOpen={showSchedulingModal}
        onClose={() => {
          setShowSchedulingModal(false);
          setSchedulingCandidate(null);
        }}
        onSchedule={handleInterviewScheduled}
      />
    </div>
  );
};

export default JobApplicantsPage;

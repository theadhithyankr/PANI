import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Video, MapPin, Search, Filter, Plus, Loader2, AlertTriangle } from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import InterviewDetailModal from '../../components/candidate/InterviewDetailModal';
import { useAuth } from '../../hooks/common/useAuth';
import { useJobSeekerProfile } from '../../hooks/candidate/useJobSeekerProfile';
import useInterviews from '../../hooks/candidate/useInterviews';
import { useToast } from '../../hooks/common/useToast';

const InterviewsPage = () => {
  const { user } = useAuth();
  const { profile: jobSeekerProfile } = useJobSeekerProfile(user?.id);
  const { success: showSuccess, error: showError } = useToast();
  
  const {
    interviews,
    loading,
    error,
    fetchInterviews,
    getUpcomingInterviews,
    getPastInterviews,
    updateInterviewStatus
  } = useInterviews(user?.id, jobSeekerProfile?.id);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Fetch interviews on component mount
  useEffect(() => {
    if (user?.id && jobSeekerProfile?.id) {
      fetchInterviews();
    }
  }, [user?.id, jobSeekerProfile?.id, fetchInterviews]);

  const statusOptions = [
    { value: 'all', label: 'All Interviews' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'rescheduled', label: 'Rescheduled' },
  ];

  const typeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'application-linked', label: 'Application Interviews' },
    { value: 'direct', label: 'Direct Invitations' },
  ];

  const filteredInterviews = interviews.filter(interview => {
    const matchesSearch = interview.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         interview.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         interview.interview_type?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || interview.status === statusFilter;
    const matchesType = typeFilter === 'all' || interview.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'info';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      case 'rescheduled': return 'warning';
      default: return 'default';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'application-linked': return 'blue';
      case 'direct': return 'purple';
      default: return 'gray';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatInterviewDateTime = (interview) => {
    if (!interview?.interview_date) return 'Date not set';
    
    const interviewDate = new Date(interview.interview_date);
    const now = new Date();
    const diffTime = interviewDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let timeDescription;
    if (diffDays < 0) {
      timeDescription = 'Past due';
    } else if (diffDays === 0) {
      timeDescription = 'Today';
    } else if (diffDays === 1) {
      timeDescription = 'Tomorrow';
    } else {
      timeDescription = `${diffDays} days from now`;
    }
    
    return `${timeDescription} at ${formatTime(interview.interview_date)}`;
  };

  const handleViewInterview = (interview) => {
    setSelectedInterview(interview);
    setShowDetailModal(true);
  };

  const handleReschedule = async (interview) => {
    try {
      await updateInterviewStatus(interview.id, 'rescheduled');
      showSuccess('Interview reschedule request sent successfully!');
      setShowDetailModal(false);
      setSelectedInterview(null);
    } catch (error) {
      showError('Failed to request reschedule. Please try again.');
    }
  };

  const handleCancel = async (interview) => {
    if (!window.confirm('Are you sure you want to cancel this interview?')) {
      return;
    }

    try {
      await updateInterviewStatus(interview.id, 'cancelled');
      showSuccess('Interview cancelled successfully.');
      setShowDetailModal(false);
      setSelectedInterview(null);
    } catch (error) {
      showError('Failed to cancel interview. Please try again.');
    }
  };

  const upcomingInterviews = getUpcomingInterviews();
  const pastInterviews = getPastInterviews();

  // Loading state
  if (loading && interviews.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="text-gray-600">Loading interviews...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-lg font-medium text-gray-900 mb-2">Error loading interviews</p>
        <p className="text-sm text-gray-500 mb-4">{error}</p>
        <Button 
          variant="outline" 
          onClick={() => fetchInterviews()}
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Interviews</h1>
          <p className="text-gray-600 mt-1">Manage your interview schedule and preparation</p>
          <div className="mt-2 text-sm text-gray-500">
            <span className="mx-2">•</span>
            <span>Total: {interviews.length}</span>
            <span className="mx-2">•</span>
            <span>Upcoming: {upcomingInterviews.length}</span>
            <span className="mx-2">•</span>
            <span>Direct Invitations: {interviews.filter(i => i.type === 'direct').length}</span>
          </div>
        </div>
        <Button variant="primary">
          <Calendar className="w-4 h-4 mr-2" />
          Sync Calendar
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search interviews by job title, company, or type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
        </div>
        <div className="flex gap-3">
          <Select
            options={statusOptions}
            value={statusFilter}
            onChange={(value) => setStatusFilter(value)}
            className="w-40"
          />
          <Select
            options={typeOptions}
            value={typeFilter}
            onChange={(value) => setTypeFilter(value)}
            className="w-40"
          />
        </div>
      </div>

      {/* Upcoming Interviews */}
      {upcomingInterviews.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Upcoming Interviews</h2>
          <div className="space-y-4">
            {upcomingInterviews.map((interview) => (
              <Card key={interview.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleViewInterview(interview)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      {interview.interview_format === 'video' ? (
                        <Video className="w-6 h-6 text-blue-600" />
                      ) : interview.interview_format === 'in_person' ? (
                        <MapPin className="w-6 h-6 text-blue-600" />
                      ) : (
                        <Clock className="w-6 h-6 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{interview.interview_type?.replace('_', ' ').toUpperCase()}</h3>
                        <Badge variant={getTypeColor(interview.type)} size="sm">
                          {interview.type === 'direct' ? 'Direct Invitation' : 'Application'}
                        </Badge>
                      </div>
                      <p className="text-gray-600">{interview.jobTitle} at {interview.companyName}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatInterviewDateTime(interview)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {interview.duration_minutes} minutes
                        </div>
                        <Badge variant={getStatusColor(interview.status)} size="sm">
                          {interview.status}
                        </Badge>
                        {interview.interviewer && (
                          <span className="text-xs text-gray-500">
                            with {interview.interviewer.full_name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <Button variant="outline" size="sm" onClick={(e) => {
                    e.stopPropagation();
                    handleViewInterview(interview);
                  }}>
                    View Details
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Past Interviews */}
      {pastInterviews.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Past Interviews</h2>
          <div className="space-y-4">
            {pastInterviews.map((interview) => (
              <Card key={interview.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleViewInterview(interview)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      {interview.interview_format === 'video' ? (
                        <Video className="w-6 h-6 text-gray-600" />
                      ) : interview.interview_format === 'in_person' ? (
                        <MapPin className="w-6 h-6 text-gray-600" />
                      ) : (
                        <Clock className="w-6 h-6 text-gray-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{interview.interview_type?.replace('_', ' ').toUpperCase()}</h3>
                        <Badge variant={getTypeColor(interview.type)} size="sm">
                          {interview.type === 'direct' ? 'Direct Invitation' : 'Application'}
                        </Badge>
                      </div>
                      <p className="text-gray-600">{interview.jobTitle} at {interview.companyName}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(interview.interview_date)}
                        </div>
                        <Badge variant={getStatusColor(interview.status)} size="sm">
                          {interview.status}
                        </Badge>
                        {interview.feedback && (
                          <span className="text-green-600 text-xs">Feedback Available</span>
                        )}
                        {interview.rating && (
                          <span className="text-blue-600 text-xs">Rated: {interview.rating}/5</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <Button variant="outline" size="sm" onClick={(e) => {
                    e.stopPropagation();
                    handleViewInterview(interview);
                  }}>
                    View Details
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {filteredInterviews.length === 0 && (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No interviews found</h3>
          <p className="text-gray-600 mb-6">
            {interviews.length === 0 
              ? 'Your interview schedule will appear here once you start getting interview invitations.'
              : 'Try adjusting your search or filters to find interviews.'
            }
          </p>
          {interviews.length === 0 && (
            <Button variant="primary">
              <Search className="w-4 h-4 mr-2" />
              Browse Jobs
            </Button>
          )}
        </div>
      )}

      {/* Interview Detail Modal */}
      <InterviewDetailModal
        interview={selectedInterview}
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedInterview(null);
        }}
        onReschedule={handleReschedule}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default InterviewsPage;

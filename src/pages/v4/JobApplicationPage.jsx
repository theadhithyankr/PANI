import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, MapPin, Calendar, Clock, Building, ChevronRight, Star, FileText, CheckCircle, Eye } from 'lucide-react';
import { useAuth } from '../../hooks/common/useAuth';
import { useConversations } from '../../hooks/common/useConversations';
import { useApplicationsStoreData } from '../../hooks/candidate/useApplicationsStore';
import { useToast } from '../../hooks/common/useToast';
import useJobsStore from '../../store/jobsStore';

const JobApplicationPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success: showSuccess, error: showError } = useToast();
  const { getOrCreateConversation } = useConversations();
  
  // Security check - ensure user is authenticated
  if (!user?.id) {
    console.warn('User not authenticated in JobApplicationPage');
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-gray-600">Please log in to view your applications</p>
        </div>
      </div>
    );
  }

  console.log('JobApplicationPage - Current user ID:', user.id);
  
  // Use Zustand store for all data and state management
  const {
    // Data
    applications,
    matchedJobs,
    offers,
    invitations,
    filteredData,
    
    // Loading and Error States
    loading,
    error,
    
    // UI State
    filters,
    selectedApplication,
    showDetailPanel,
    
    // Statistics
    stats,
    tabCounts,
    
    // Actions
    setFilters,
    setSelectedApplication,
    setShowDetailPanel,
    fetchData,
    updateOfferStatus,
    acceptInvitation,
    declineInvitation
  } = useApplicationsStoreData(user.id);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Fetch data when component mounts
  useEffect(() => {
    if (user?.id) {
      fetchData();
    }
  }, [user?.id, fetchData]);

  // Helper function to format salary data
  const formatSalary = (salaryData) => {
    if (!salaryData) return '$80k - $120k';
    
    // If it's already a string, return it
    if (typeof salaryData === 'string') return salaryData;
    
    // If it's an object with min/max values
    if (typeof salaryData === 'object' && salaryData.min && salaryData.max) {
      return `$${salaryData.min}k - $${salaryData.max}k`;
    }
    
    // If it's an object with type, period, currency (fallback)
    if (typeof salaryData === 'object' && salaryData.type && salaryData.period && salaryData.currency) {
      return `${salaryData.currency} ${salaryData.type}/${salaryData.period}`;
    }
    
    // Default fallback
    return '$80k - $120k';
  };

  // Transform applications and invitations data to match the UI format
  const allItems = [...applications, ...invitations];
  const { getJobById } = useJobsStore();
  const transformedApplications = allItems.map(app => {
    const jobId = app.jobId || app.job_id || app.job?.id;
    const jobFromStore = jobId ? getJobById(jobId) : null;
    const resolvedScore =
      (app.matchScore !== undefined && app.matchScore !== null)
        ? app.matchScore
        : (app.ai_match_score !== undefined && app.ai_match_score !== null)
          ? app.ai_match_score
          : (app.bestJobMatch?.matchScore !== undefined && app.bestJobMatch?.matchScore !== null)
            ? app.bestJobMatch.matchScore
            : (jobFromStore?.matchScore !== undefined && jobFromStore?.matchScore !== null)
              ? jobFromStore.matchScore
              : 0;
    return {
      id: app.id,
      jobTitle: app.jobTitle || app.title,
      company: app.company || app.companyName,
      location: app.location,
      appliedDate: app.appliedDate || app.created_at,
      status: app.status,
      matchScore: Math.round(resolvedScore),
      salary: formatSalary(app.salary || app.salaryRange),
      logo: app.logo || null,
      isInvitation: app.isInvitation || false,
      invitationId: app.invitationId || null,
      invitationStatus: app.invitationStatus || null
    };
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'under_review':
      case 'reviewing':
        return 'bg-yellow-100 text-yellow-800';
      case 'interview_scheduled':
      case 'interviewing':
        return 'bg-blue-100 text-blue-800';
      case 'offer_received':
      case 'offered':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'hired':
        return 'bg-purple-100 text-purple-800';
      case 'accepted':
        return 'bg-emerald-100 text-emerald-800';
      case 'invited':
        return 'bg-indigo-100 text-indigo-800';
      case 'declined':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'under_review':
      case 'reviewing':
        return 'Under Review';
      case 'interview_scheduled':
      case 'interviewing':
        return 'Interview Scheduled';
      case 'offer_received':
      case 'offered':
        return 'Offer Received';
      case 'rejected':
        return 'Rejected';
      case 'hired':
        return 'Hired';
      case 'accepted':
        return 'Accepted';
      case 'invited':
        return 'Invited';
      case 'declined':
        return 'Declined';
      default:
        return 'Applied';
    }
  };

  const filteredApplications = transformedApplications.filter(app => {
    const matchesSearch = app.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleViewDetails = (application) => {
    console.log('View Details clicked for application:', application);
    let applicationId = application.id;
    
    // Navigate to the new CandidateApplicationJourneyPage
    const url = `/v4/candidate/application-journey/${applicationId}`;
    console.log('Navigating to:', url);
    navigate(url);
  };

  const handleMessage = async (application, conversationId = null) => {
    try {
      if (conversationId) {
        navigate(`/dashboard/messages/${conversationId}`);
        return;
      }

      const title = `${application.jobTitle} · ${application.company}`;
      const conversation = await getOrCreateConversation(application.id, title);

      if (conversation?.id) {
        navigate(`/dashboard/messages/${conversation.id}`);
      } else {
        navigate('/dashboard/messages', { 
          state: { 
            applicationId: application.id,
            jobTitle: application.jobTitle,
            company: application.company
          } 
        });
      }
    } catch (err) {
      console.error('Failed to open or create conversation:', err);
      navigate('/dashboard/messages', { 
        state: { 
          applicationId: application.id,
          jobTitle: application.jobTitle,
          company: application.company
        } 
      });
    }
  };

  const handleViewInterview = (application) => {
    // Navigate to CandidateApplicationJourneyPage interview section (step 2)
    // This will automatically open the interview tab in the journey page
    const url = `/v4/candidate/application-journey/${application.id}?step=2`;
    console.log('Navigating to interview section:', url);
    navigate(url);
  };

  const handleViewOffer = (application) => {
    // Navigate to offer details
    navigate(`/dashboard/offers/${application.id}`);
  };

  const handleAcceptOffer = async (application) => {
    console.log('Accept offer:', application);
    const success = await updateOfferStatus(application.id, 'accepted', user.id);
    if (success) {
      showSuccess('Offer accepted successfully!');
    } else {
      showError('Failed to accept offer. Please try again.');
    }
  };

  const handleDeclineOffer = async (application) => {
    console.log('Decline offer:', application);
    const success = await updateOfferStatus(application.id, 'declined', user.id);
    if (success) {
      showSuccess('Offer declined successfully.');
    } else {
      showError('Failed to decline offer. Please try again.');
    }
  };

  const handleAcceptInvitation = async (application) => {
    console.log('Accept invitation:', application);
    if (!application.invitationId) {
      showError('Invalid invitation data.');
      return;
    }
    
    try {
      const result = await acceptInvitation(application.invitationId, user.id);
      if (result && result.success) {
        showSuccess('Invitation accepted successfully!');
        // Refresh data to show updated status
        await fetchData();
      } else {
        showError('Failed to accept invitation. Please try again.');
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
      showError('Failed to accept invitation. Please try again.');
    }
  };

  const handleDeclineInvitation = async (application) => {
    console.log('Decline invitation:', application);
    if (!application.invitationId) {
      showError('Invalid invitation data.');
      return;
    }
    
    try {
      const result = await declineInvitation(application.invitationId, user.id);
      if (result && result.success) {
        showSuccess('Invitation declined.');
      } else {
        showError('Failed to decline invitation. Please try again.');
      }
    } catch (error) {
      console.error('Error declining invitation:', error);
      showError('Failed to decline invitation. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                My Job Applications
              </h1>
              <p className="text-gray-600 mt-1">
                Track and manage your job applications
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                {applications.length} Applications
              </span>
              {invitations.length > 0 && (
                <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">
                  {invitations.length} Invitations
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Applications</p>
                <p className="text-2xl font-bold text-gray-900">{applications.length}</p>
              </div>
            </div>
          </div>
          
          {invitations.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Star className="h-6 w-6 text-indigo-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Invitations</p>
                  <p className="text-2xl font-bold text-gray-900">{invitations.length}</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Under Review</p>
                <p className="text-2xl font-bold text-gray-900">
                  {applications.filter(app => app.status === 'reviewing' || app.status === 'under_review').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Interviews</p>
                <p className="text-2xl font-bold text-gray-900">
                  {applications.filter(app => app.status === 'interviewing' || app.status === 'interview_scheduled').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Star className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Offers</p>
                <p className="text-2xl font-bold text-gray-900">
                  {applications.filter(app => app.status === 'offered' || app.status === 'offer_received').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow-sm border mb-8">
          <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search applications..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="invited">Invited</option>
                <option value="reviewing">Under Review</option>
                <option value="interviewing">Interview Scheduled</option>
                <option value="offered">Offer Received</option>
                <option value="rejected">Rejected</option>
                <option value="accepted">Accepted</option>
                <option value="hired">Hired</option>
                <option value="declined">Declined</option>
              </select>
            </div>
          </div>
        </div>

        {/* Applications List */}
        <div className="space-y-4">
          {filteredApplications.map((application) => (
            <div
              key={application.id}
              className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleViewDetails(application)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="h-12 w-12 bg-gray-200 rounded-lg flex items-center justify-center">
                        <Building className="h-6 w-6 text-gray-500" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {application.jobTitle}
                        </h3>
                        <p className="text-gray-600">{application.company}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className="flex items-center text-sm text-gray-500">
                            <MapPin className="h-4 w-4 mr-1" />
                            {application.location}
                          </span>
                          <span className="flex items-center text-sm text-gray-500">
                            <Calendar className="h-4 w-4 mr-1" />
                            Applied: {new Date(application.appliedDate).toLocaleDateString()}
                          </span>
                          <span className="flex items-center text-sm text-gray-500">
                            <Star className="h-4 w-4 mr-1 text-yellow-400" />
                            {application.matchScore}% match
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-lg font-semibold text-gray-900">
                          {typeof application.salary === 'string' ? application.salary : formatSalary(application.salary)}
                        </p>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(application.status)}`}>
                          {getStatusText(application.status)}
                        </span>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>

                  {/* Action buttons based on status */}
                  <div className="mt-4 flex space-x-2" onClick={(e) => e.stopPropagation()}>
                    {application.isInvitation && application.status === 'invited' && (
                      <>
                        <button 
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                          onClick={() => handleAcceptInvitation(application)}
                        >
                          Accept Invitation
                        </button>
                        <button 
                          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
                          onClick={() => handleDeclineInvitation(application)}
                        >
                          Decline Invitation
                        </button>
                      </>
                    )}
                    {(application.status === 'interviewing' || application.status === 'interview_scheduled') && (
                      <button 
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        onClick={() => handleViewInterview(application)}
                      >
                        View Interview Schedule
                      </button>
                    )}
                    {(application.status === 'offered' || application.status === 'offer_received') && (
                      <>
                        <button 
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                          onClick={() => handleAcceptOffer(application)}
                        >
                          Accept Offer
                        </button>
                        <button 
                          className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm"
                          onClick={() => handleViewOffer(application)}
                        >
                          View Offer Details
                        </button>
                      </>
                    )}
                    <button 
                      className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                      onClick={() => handleViewDetails(application)}
                    >
                      {application.isInvitation ? 'View Invitation' : 'View Application'}
                    </button>
                    <button 
                      className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                      onClick={() => handleMessage(application)}
                    >
                      Send Message
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredApplications.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No applications found
            </h3>
            <p className="text-gray-500">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'Start applying to jobs to see them here!'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobApplicationPage;

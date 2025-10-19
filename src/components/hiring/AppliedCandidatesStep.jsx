import React from 'react';
import { 
  User, 
  MapPin, 
  Clock, 
  Star, 
  MessageCircle, 
  Calendar, 
  Eye, 
  X, 
  CheckCircle,
  FileText,
  Loader
} from 'lucide-react';

const AppliedCandidatesStep = ({ 
  candidates, 
  loading, 
  onViewRecommendations, 
  onViewProfile, 
  onScheduleInterview, 
  onMessage, 
  onReject,
  onShortlist,
  onMoveToInterviewing,
  onOfferPosition
}) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'applied':
        return 'bg-blue-100 text-blue-800';
      case 'reviewing':
        return 'bg-yellow-100 text-yellow-800';
      case 'shortlisted':
        return 'bg-green-100 text-green-800';
      case 'interviewing':
        return 'bg-purple-100 text-purple-800';
      case 'offered':
        return 'bg-indigo-100 text-indigo-800';
      case 'hired':
        return 'bg-emerald-100 text-emerald-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'withdrawn':
        return 'bg-gray-100 text-gray-800';
      case 'expired':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'applied':
        return 'Applied';
      case 'reviewing':
        return 'Under Review';
      case 'shortlisted':
        return 'Shortlisted';
      case 'interviewing':
        return 'Interviewing';
      case 'offered':
        return 'Offered';
      case 'hired':
        return 'Hired';
      case 'rejected':
        return 'Rejected';
      case 'withdrawn':
        return 'Withdrawn';
      case 'expired':
        return 'Expired';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader className="w-8 h-8 text-violet-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading applied candidates...</p>
        </div>
      </div>
    );
  }

  if (candidates.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Applied Candidates Yet</h3>
        <p className="text-gray-600 mb-6">
          Candidates who apply for this job will appear here. You can also invite candidates from the recommended section.
        </p>
        <button
          onClick={onViewRecommendations}
          className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
        >
          View Recommended Candidates
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Applied Candidates</h2>
          <p className="text-gray-600 mt-1">
            {candidates.length} candidate{candidates.length !== 1 ? 's' : ''} applied for this position
          </p>
        </div>
        <button
          onClick={onViewRecommendations}
          className="px-4 py-2 text-violet-600 border border-violet-600 rounded-lg hover:bg-violet-50 transition-colors"
        >
          View Recommended
        </button>
      </div>

      {/* Candidates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {candidates.map((candidate) => (
          <div key={candidate.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
            {/* Candidate Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-violet-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-violet-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{candidate.name}</h3>
                  <p className="text-sm text-gray-600">{candidate.title}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(candidate.status)}`}>
                {getStatusText(candidate.status)}
              </span>
            </div>

            {/* Candidate Details */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="w-4 h-4 mr-2" />
                {candidate.location}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="w-4 h-4 mr-2" />
                {candidate.experience}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="w-4 h-4 mr-2" />
                Applied {new Date(candidate.appliedDate).toLocaleDateString()}
              </div>
              {candidate.matchScore > 0 && (
                <div className="flex items-center text-sm text-gray-600">
                  <Star className="w-4 h-4 mr-2 text-yellow-500" />
                  {candidate.matchScore}% match
                </div>
              )}
              {candidate.internalRating && (
                <div className="flex items-center text-sm text-gray-600">
                  <Star className="w-4 h-4 mr-2 text-violet-500" />
                  Internal Rating: {candidate.internalRating}/5
                </div>
              )}
              {candidate.salaryExpectation && (
                <div className="flex items-center text-sm text-gray-600">
                  <span className="w-4 h-4 mr-2 text-green-500">💰</span>
                  Salary: {candidate.salaryExpectation}
                </div>
              )}
              {candidate.availabilityDate && (
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                  Available: {new Date(candidate.availabilityDate).toLocaleDateString()}
                </div>
              )}
              {candidate.visaStatus && (
                <div className="flex items-center text-sm text-gray-600">
                  <span className="w-4 h-4 mr-2 text-indigo-500">📋</span>
                  Visa: {candidate.visaStatus}
                </div>
              )}
            </div>

            {/* Skills */}
            {candidate.skills && candidate.skills.length > 0 && (
              <div className="mb-4">
                <div className="flex flex-wrap gap-1">
                  {candidate.skills.slice(0, 3).map((skill, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md"
                    >
                      {skill}
                    </span>
                  ))}
                  {candidate.skills.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md">
                      +{candidate.skills.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="mb-4">
              <p className="text-sm text-gray-600 line-clamp-2">
                {candidate.summary}
              </p>
            </div>

            {/* Cover Letter Preview */}
            {candidate.coverLetter && (
              <div className="mb-4">
                <div className="flex items-center text-xs text-gray-500 mb-1">
                  <FileText className="w-3 h-3 mr-1" />
                  Cover Letter
                </div>
                <p className="text-xs text-gray-600 line-clamp-2">
                  {candidate.coverLetter}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onViewProfile(candidate)}
                className="flex-1 px-3 py-2 text-sm text-violet-600 border border-violet-600 rounded-lg hover:bg-violet-50 transition-colors flex items-center justify-center"
              >
                <Eye className="w-4 h-4 mr-1" />
                View Profile
              </button>
              <button
                onClick={() => onMessage(candidate)}
                className="flex-1 px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
              >
                <MessageCircle className="w-4 h-4 mr-1" />
                Message
              </button>
            </div>

            {/* Secondary Actions */}
            <div className="flex flex-wrap gap-2 mt-3">
              {/* Primary Action based on status */}
              {candidate.status === 'applied' && (
                <button
                  onClick={() => onScheduleInterview(candidate)}
                  className="flex-1 px-3 py-2 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors flex items-center justify-center"
                >
                  <Calendar className="w-4 h-4 mr-1" />
                  Schedule Interview
                </button>
              )}
              
              {candidate.status === 'reviewing' && (
                <button
                  onClick={() => onShortlist(candidate)}
                  className="flex-1 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                >
                  <Star className="w-4 h-4 mr-1" />
                  Shortlist
                </button>
              )}
              
              {candidate.status === 'shortlisted' && (
                <button
                  onClick={() => onMoveToInterviewing(candidate)}
                  className="flex-1 px-3 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center"
                >
                  <Calendar className="w-4 h-4 mr-1" />
                  Move to Interviewing
                </button>
              )}
              
              {(candidate.status === 'interviewing' || candidate.status === 'offered') && (
                <button
                  onClick={() => onScheduleInterview(candidate)}
                  className="flex-1 px-3 py-2 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors flex items-center justify-center"
                >
                  <Calendar className="w-4 h-4 mr-1" />
                  Schedule Interview
                </button>
              )}
              
              {candidate.status === 'interviewing' && (
                <button
                  onClick={() => onOfferPosition(candidate)}
                  className="flex-1 px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center"
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Offer Position
                </button>
              )}

              {/* Reject button for all statuses except hired */}
              {candidate.status !== 'hired' && (
                <button
                  onClick={() => onReject(candidate)}
                  className="px-3 py-2 text-sm text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center"
                  title="Reject Candidate"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {candidates.filter(c => c.status === 'applied').length}
            </div>
            <div className="text-sm text-gray-600">Applied</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {candidates.filter(c => c.status === 'reviewing').length}
            </div>
            <div className="text-sm text-gray-600">Reviewing</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {candidates.filter(c => c.status === 'shortlisted').length}
            </div>
            <div className="text-sm text-gray-600">Shortlisted</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {candidates.filter(c => c.status === 'interviewing').length}
            </div>
            <div className="text-sm text-gray-600">Interviewing</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600">
              {candidates.filter(c => c.status === 'offered').length}
            </div>
            <div className="text-sm text-gray-600">Offered</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">
              {candidates.length}
            </div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppliedCandidatesStep;

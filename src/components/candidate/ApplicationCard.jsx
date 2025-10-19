import React, { useState } from 'react';
import { 
  Calendar, 
  MapPin, 
  Building, 
  Clock, 
  MessageCircle, 
  FileText,
  CheckCircle,
  XCircle,
  CalendarDays
} from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';
import Badge from '../common/Badge';
import { useApplicationStatus } from '../../hooks/candidate/useApplicationStatus';
import { useToast } from '../../hooks/common/useToast';
import { useConversations } from '../../hooks/common/useConversations';

const ApplicationCard = ({ application, job, onViewDetails, onMessage, isSelected, onSelect, onRefresh }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmReason, setConfirmReason] = useState('');
  const { 
    acceptDirectInterview, 
    acceptApplication,
    rejectDirectInterview, 
    rejectApplication,
    requestReschedule, 
    requestApplicationReschedule,
    cancelRescheduleRequest
  } = useApplicationStatus();
  const { success: showSuccess, error: showError } = useToast();
  const { getOrCreateConversation } = useConversations();

  const getStatusColor = (status) => {
    switch (status) {
      case 'applied': return 'info';
      case 'reviewing': return 'warning';
      case 'interviewing': return 'secondary';
      case 'offered': return 'success';
      case 'accepted': return 'success';
      case 'hired': return 'success';
      case 'declined': return 'error';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status, isDirectInterview = false, interview = null) => {
    if (isDirectInterview) {
      if (status === 'declined') {
        return 'Direct Interview Rejected';
      }
      if (status === 'reviewing' && interview?.status === 'rescheduled') {
        return 'Reschedule Requested - Waiting for Company Response';
      }
      return 'Direct Interview Invitation';
    }
    
    // Handle rescheduled normal applications
    if (status === 'reviewing' && interview?.status === 'rescheduled') {
      return 'Reschedule Requested - Waiting for Company Response';
    }
    
    switch (status) {
      case 'applied': return 'Application Submitted';
      case 'reviewing': return 'Under Review';
      case 'interviewing': return 'Interview Stage';
      case 'offered': return 'Offer Received';
      case 'accepted': return 'Offer Accepted';
      case 'hired': return 'Hired';
      case 'declined': return 'Application Declined';
      case 'rejected': return 'Not Selected';
      default: return status;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getProgressPercentage = (status) => {
    switch (status) {
      case 'applied': return 25;
      case 'reviewing': return 50;
      case 'interviewing': return 75;
      case 'offered': return 90;
      case 'accepted': return 100;
      case 'hired': return 100;
      case 'declined': return 0;
      case 'rejected': return 0;
      default: return 0;
    }
  };

  // Check if this is a hired application (no action buttons needed)
  const isHired = application?.status === 'hired';

  // Check if this application needs action buttons
  // Show for: applied status (not hired) OR declined status (for reschedule/reject options) OR direct interviews
  const needsActionButtons = (application?.status === 'applied' && !isHired) || 
                           (application?.status === 'declined') ||
                           (application?.isDirectInterview && application?.status === 'interviewing');

  // Check if this is a declined application (show only reschedule and reject)
  const isDeclined = application?.status === 'declined';

  // Check if this is a direct interview (show reject, reschedule or cancel reschedule)
  // A direct interview is marked with isDirectInterview flag
  // Note: cancelled direct interviews will have status 'declined' so won't show action buttons
  const isDirectInterview = application?.isDirectInterview && (application?.status === 'interviewing' || application?.status === 'reviewing');
  
  // Check if this is a rescheduled direct interview (show cancel reschedule button)
  const isRescheduledDirectInterview = application?.isDirectInterview && 
                                       application?.status === 'reviewing' && 
                                       application?.interview?.status === 'rescheduled';

  // Check if this is a rescheduled normal application interview
  const isRescheduledNormalApplication = !application?.isDirectInterview && 
                                         application?.status === 'reviewing' && 
                                         application?.interview?.status === 'rescheduled';

  // Check if this is a normal application (show only reschedule)
  const isNormalApplication = !application?.isDirectInterview && !application?.interview?.id && application?.status === 'applied' && !isHired;
  
  // Check if this is a normal application with interview (show reject/reschedule or cancel reschedule)
  const isNormalApplicationWithInterview = !application?.isDirectInterview && application?.interview?.id && 
                                           (application?.status === 'interviewing' || application?.status === 'reviewing') && !isHired;

  const handleAcceptInterview = async (e) => {
    e.stopPropagation();
    if (!application?.id) {
      showError('Missing application data');
      return;
    }

    setIsUpdating(true);
    try {
      let success = false;
      
             if (application?.isDirectInterview && application?.interview?.id) {
         // Handle direct interview
         success = await acceptDirectInterview(application.id, application.interview.id);
       } else {
         // Handle regular application
         success = await acceptApplication(application.id);
       }
      
      if (success && onRefresh) {
        onRefresh();
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRejectInterview = async (e) => {
    e.stopPropagation();
    if (!application?.id) {
      showError('Missing application data');
      return;
    }

    setShowConfirmModal(true);
    setConfirmAction('reject');
  };

  const handleRescheduleInterview = async (e) => {
    e.stopPropagation();
    if (!application?.id) {
      showError('Missing application data');
      return;
    }

    setShowConfirmModal(true);
    setConfirmAction('reschedule');
  };

  const handleCancelReschedule = async (e) => {
    e.stopPropagation();
    if (!application?.id) {
      showError('Missing application data');
      return;
    }

    setShowConfirmModal(true);
    setConfirmAction('cancel-reschedule');
  };

  const handleMessage = async (e) => {
    e.stopPropagation();
    
    if (!application?.id) {
      showError('Missing application data');
      return;
    }

    try {
      // Get or create conversation for this application
      const conversation = await getOrCreateConversation(
        application.id,
        application.jobId,
        application.jobTitle,
        application.company
      );

      if (conversation) {
        // Navigate to messages page with conversation ID
        if (onMessage) {
          onMessage(application, conversation.id);
        }
      }
    } catch (error) {
      console.error('Error handling message:', error);
      showError('Failed to open conversation. Please try again.');
    }
  };

  const handleConfirmAction = async () => {
    if (!application?.id) {
      showError('Missing application data');
      return;
    }

    setIsUpdating(true);
    try {
      let success = false;
      let reason = confirmReason;

                          if (confirmAction === 'reject') {
        if (application?.isDirectInterview && application?.interview?.id) {
          // Handle direct interview
          success = await rejectDirectInterview(application.id, application.interview.id, reason);
        } else {
          // Handle regular application
          success = await rejectApplication(application.id, reason);
        }
      } else if (confirmAction === 'reschedule') {
        if (application?.interview?.id) {
          // Handle interview reschedule (works for both direct interviews and normal applications)
          success = await requestReschedule(application.id, application.interview.id, reason);
        } else {
          // Handle regular application without interview (fallback)
          success = await requestApplicationReschedule(application.id, reason);
        }
      } else if (confirmAction === 'cancel-reschedule') {
        if (application?.interview?.id) {
          // Cancel reschedule request - revert interview status back to scheduled
          // Works for both direct interviews and normal applications
          success = await cancelRescheduleRequest(application.id, application.interview.id, reason);
        }
      }
      
      if (success && onRefresh) {
        onRefresh();
      }
    } finally {
      setIsUpdating(false);
      setShowConfirmModal(false);
      setConfirmAction(null);
      setConfirmReason('');
    }
  };

  const handleCancelAction = () => {
    setShowConfirmModal(false);
    setConfirmAction(null);
    setConfirmReason('');
  };

  return (
    <Card 
      className={`bg-white/80 backdrop-blur-sm rounded-xl border p-6 transition-all duration-300 group cursor-pointer ${
        isSelected 
          ? 'border-blue-400 bg-blue-50/80 shadow-lg' 
          : 'border-violet-100 hover:border-violet-300'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-gray-900">
              {job?.title || application?.jobTitle || 'Job Title'}
            </h3>
                         {(application?.isDirectInterview || application?.interview?.id) && (
               <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                 Direct Invitation
               </span>
             )}
          </div>
          <div className="flex items-center text-gray-600 mb-2">
            <Building className="w-4 h-4 mr-1" />
            <span className="font-medium mr-3">{job?.company || application?.company || 'Company'}</span>
            <MapPin className="w-4 h-4 mr-1" />
            <span>{job?.location || application?.location || 'Location'}</span>
          </div>
                     <div className="flex items-center text-sm text-gray-500">
             <Calendar className="w-4 h-4 mr-1" />
             {(application?.isDirectInterview || application?.interview?.id) ? 'Invited on' : 'Applied on'} {formatDate(application?.appliedDate || application?.updatedAt)}
           </div>
        </div>
                 <Badge variant={getStatusColor(application?.status)} size="sm">
           {getStatusText(application?.status, application?.isDirectInterview || application?.interview?.id, application?.interview)}
         </Badge>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Application Progress</span>
          <span>{getProgressPercentage(application?.status)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              application?.status === 'rejected' || application?.status === 'declined'
                ? 'bg-red-500' 
                : application?.status === 'offered' || application?.status === 'accepted' || application?.status === 'hired'
                ? 'bg-green-500'
                : 'bg-blue-500'
            }`}
            style={{ width: `${getProgressPercentage(application?.status)}%` }}
          />
        </div>
      </div>

      {/* Application Timeline */}
      <div className="space-y-2 mb-4">
                 <div className="flex items-center text-sm">
           <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
           <span className="text-gray-600">
             {(application?.isDirectInterview || application?.interview?.id) ? 'Direct interview invitation received' : 'Application submitted'}
           </span>
           <span className="ml-auto text-gray-500">{formatDate(application?.appliedDate || application?.updatedAt)}</span>
         </div>
                 {application?.status !== 'applied' && !application?.isDirectInterview && !application?.interview?.id && (
          <div className="flex items-center text-sm">
            <div className={`w-2 h-2 rounded-full mr-3 ${
              application?.status === 'rejected' || application?.status === 'declined' 
                ? 'bg-red-500' 
                : application?.status === 'accepted' || application?.status === 'hired'
                ? 'bg-green-500'
                : 'bg-blue-500'
            }`}></div>
            <span className="text-gray-600">{getStatusText(application?.status)}</span>
            <span className="ml-auto text-gray-500">Recent</span>
          </div>
        )}
                 {(application?.isDirectInterview || application?.interview?.id) && application?.interview && (
          <div className="flex items-center text-sm">
            <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
            <span className="text-gray-600">Interview scheduled for {formatDate(application.interview.date)}</span>
            <span className="ml-auto text-gray-500">{application.interview.time}</span>
          </div>
        )}
      </div>

      {/* Match Score (if available) */}
      {application?.matchScore && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">AI Match Score</span>
            <span className="text-lg font-bold text-blue-600">{application.matchScore}%</span>
          </div>
        </div>
      )}

      {/* Cover Note or Direct Interview Notes (if available) */}
      {application?.coverNote && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                     <h4 className="text-sm font-medium text-gray-700 mb-1">
             {(application?.isDirectInterview || application?.interview?.id) ? 'Interview Notes' : 'Cover Note'}
           </h4>
          <p className="text-sm text-gray-600 line-clamp-2">{application.coverNote}</p>
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-500">
          <Clock className="w-4 h-4 inline mr-1" />
          Last updated: {formatDate(application?.updatedAt || application?.appliedDate)}
        </div>
                 <div className="flex gap-2">
                       {/* Action buttons for direct interviews */}
            {needsActionButtons && isDirectInterview && !isDeclined && (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRejectInterview}
                  disabled={isUpdating}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  {isUpdating ? 'Rejecting...' : 'Reject'}
                </Button>
                
                {/* Show Reschedule button for scheduled interviews */}
                {!isRescheduledDirectInterview && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleRescheduleInterview}
                    disabled={isUpdating}
                  >
                    <CalendarDays className="w-4 h-4 mr-2" />
                    {isUpdating ? 'Requesting...' : 'Reschedule'}
                  </Button>
                )}
                
                {/* Show Cancel Reschedule button for rescheduled interviews */}
                {isRescheduledDirectInterview && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleCancelReschedule}
                    disabled={isUpdating}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    {isUpdating ? 'Cancelling...' : 'Cancel Reschedule'}
                  </Button>
                )}
              </>
            )}
            
                        {/* Action buttons for normal applications (decline, reschedule) */}
            {needsActionButtons && isNormalApplication && (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRejectInterview}
                  disabled={isUpdating}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  {isUpdating ? 'Declining...' : 'Decline'}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRescheduleInterview}
                  disabled={isUpdating}
                >
                  <CalendarDays className="w-4 h-4 mr-2" />
                  {isUpdating ? 'Requesting...' : 'Reschedule'}
                </Button>
              </>
            )}
            
            {/* Action buttons for normal applications with interviews */}
            {needsActionButtons && isNormalApplicationWithInterview && (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRejectInterview}
                  disabled={isUpdating}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  {isUpdating ? 'Rejecting...' : 'Reject'}
                </Button>
                
                {/* Show Reschedule button for scheduled interviews */}
                {!isRescheduledNormalApplication && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleRescheduleInterview}
                    disabled={isUpdating}
                  >
                    <CalendarDays className="w-4 h-4 mr-2" />
                    {isUpdating ? 'Requesting...' : 'Reschedule'}
                  </Button>
                )}
                
                {/* Show Cancel Reschedule button for rescheduled interviews */}
                {isRescheduledNormalApplication && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleCancelReschedule}
                    disabled={isUpdating}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    {isUpdating ? 'Cancelling...' : 'Cancel Reschedule'}
                  </Button>
                )}
              </>
            )}
            
            {/* Action buttons for declined applications (reschedule only) */}
            {needsActionButtons && isDeclined && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRescheduleInterview}
                disabled={isUpdating}
              >
                <CalendarDays className="w-4 h-4 mr-2" />
                {isUpdating ? 'Requesting...' : 'Reschedule'}
              </Button>
            )}
          
          <Button variant="outline" size="sm" onClick={handleMessage}>
            <MessageCircle className="w-4 h-4 mr-2" />
            Message
          </Button>
          <Button variant="primary" size="sm" onClick={(e) => {
            e.stopPropagation();
            onViewDetails(application);
          }}>
            View Details
          </Button>
        </div>
      </div>

             {/* Confirmation Modal */}
       {showConfirmModal && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
           <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
             <h3 className="text-lg font-semibold mb-4">
               {confirmAction === 'reject' ? 'Decline Application' : 'Request Reschedule'}
             </h3>
             <p className="text-sm mb-4">
               Are you sure you want to {confirmAction === 'reject' ? 'decline' : 'reschedule'} this application?
             </p>
             <div className="mb-4">
               <label className="block text-sm font-medium text-gray-700 mb-2">
                 Reason (optional):
               </label>
               <textarea
                 value={confirmReason}
                 onChange={(e) => setConfirmReason(e.target.value)}
                 placeholder={`Enter reason for ${confirmAction === 'reject' ? 'declining' : 'rescheduling'}...`}
                 className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                 rows="3"
               />
             </div>
             <div className="flex justify-end gap-2">
               <Button variant="outline" size="sm" onClick={handleCancelAction}>
                 Cancel
               </Button>
               <Button 
                 variant={confirmAction === 'reject' ? 'error' : 'primary'} 
                 size="sm" 
                 onClick={handleConfirmAction}
                 disabled={isUpdating}
               >
                 {isUpdating ? `${confirmAction === 'reject' ? 'Declining' : 'Requesting'}...` : 
                  confirmAction === 'reject' ? 'Decline' : 'Request Reschedule'}
               </Button>
             </div>
           </div>
         </div>
       )}
    </Card>
  );
};

export default ApplicationCard;

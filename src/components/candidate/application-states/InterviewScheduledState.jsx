import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  Video, 
  Phone, 
  MapPin, 
  User, 
  ExternalLink, 
  Edit3, 
  X,
  Headphones,
  Camera,
  Wifi,
  MessageCircle
} from 'lucide-react';
import Card from '../../common/Card';
import Button from '../../common/Button';
import Badge from '../../common/Badge';
import CountdownTimer from '../../common/CountdownTimer';
import { useAuth } from '../../../hooks/common/useAuth';
import { useJobSeekerProfile } from '../../../hooks/candidate/useJobSeekerProfile';
import useInterviews from '../../../hooks/candidate/useInterviews';
import { useToast } from '../../../hooks/common/useToast';

const InterviewScheduledState = ({ application, job }) => {
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { user } = useAuth();
  const { profile: jobSeekerProfile } = useJobSeekerProfile(user?.id);
  const { success: showSuccess, error: showError } = useToast();
  
  const {
    updateInterviewStatus
  } = useInterviews(user?.id, jobSeekerProfile?.id);

  // Get initials from name
  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Generate avatar background color based on name
  const getAvatarColor = (name) => {
    if (!name) return 'bg-gray-400';
    
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-red-500',
      'bg-yellow-500',
      'bg-teal-500',
      'bg-orange-500',
      'bg-cyan-500'
    ];
    
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  // Defensive programming - check if interview data exists
  if (!application.interview || !application.interview.date || !application.interview.time) {
    return (
      <div className="space-y-6">
        <Card>
          <div className="text-center py-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Interview Scheduled</h3>
            <p className="text-gray-600 mb-4">
              Your interview has been scheduled! Interview details will be available soon.
            </p>
            <div className="flex justify-center space-x-4">
              <Button variant="outline">
                <MessageCircle className="w-4 h-4 mr-2" />
                Contact Recruiter
              </Button>
              <Button variant="primary">
                <Calendar className="w-4 h-4 mr-2" />
                Check Email
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const handleReschedule = async () => {
    if (!application.interview?.id) {
      showError('Interview ID not found. Please try refreshing the page.');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Update interview status to 'rescheduled'
      await updateInterviewStatus(application.interview.id, 'rescheduled');
      
      // Show success message
      showSuccess('Reschedule request sent successfully! The recruiter will contact you with new details.');
      
      // Close modal
      setShowRescheduleModal(false);
      setRescheduleReason('');
      
      // Optionally refresh the application data
      // You might want to trigger a refresh of the parent component
      if (application.onRefresh) {
        application.onRefresh();
      }
      
    } catch (error) {
      console.error('Error requesting reschedule:', error);
      showError('Failed to send reschedule request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    console.log('Cancel interview for:', application.id);
  };

  const formatInterviewDate = (date, time) => {
    const dateTime = new Date(`${date}T${time}`);
    return {
      date: dateTime.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      time: dateTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
      })
    };
  };

  const { interview } = application;
  const interviewDateTime = formatInterviewDate(interview.date, interview.time);
  const interviewDate = new Date(`${interview.date}T${interview.time}`);
  const now = new Date();
  const isUpcoming = interviewDate > now;
  const canJoin = interviewDate.getTime() - now.getTime() <= 10 * 60 * 1000; // 10 minutes before
  
  // Calculate if reschedule is still allowed (e.g., 24 hours before interview)
  const hoursUntilInterview = (interviewDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  const canReschedule = interview.status === 'scheduled' && 
                       hoursUntilInterview > 24 && 
                       interview.canReschedule !== false;

  // Additional defensive checks for interviewer data
  const interviewer = interview.interviewer || {
    name: 'Interviewer',
    title: 'Hiring Manager',
    avatar: '/default-avatar.png',
    bio: 'Interviewer information will be provided soon.'
  };

  return (
    <div className="space-y-6">
      {/* Interview Countdown */}
      {isUpcoming && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Interview in:
            </h3>
            <CountdownTimer 
              targetDate={`${interview.date}T${interview.time}`}
              variant="default"
              size="lg"
              onExpire={() => console.log('Interview time!')}
            />
            <p className="text-sm text-gray-600 mt-2">
              {interviewDateTime.date} at {interviewDateTime.time}
            </p>
          </div>
        </Card>
      )}

      {/* Interview Details */}
      <Card>
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Interview Details</h3>
          <Badge variant="secondary">
            Round {interview.round} of {interview.totalRounds}
          </Badge>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                interview.type === 'video' ? 'bg-blue-100' :
                interview.type === 'phone' ? 'bg-green-100' : 'bg-purple-100'
              }`}>
                {interview.type === 'video' ? (
                  <Video className={`w-5 h-5 ${
                    interview.type === 'video' ? 'text-blue-600' :
                    interview.type === 'phone' ? 'text-green-600' : 'text-purple-600'
                  }`} />
                ) : interview.type === 'phone' ? (
                  <Phone className="w-5 h-5 text-green-600" />
                ) : (
                  <MapPin className="w-5 h-5 text-purple-600" />
                )}
              </div>
              <div>
                <h4 className="font-medium text-gray-900 capitalize">
                  {interview.type} Interview
                </h4>
                <p className="text-sm text-gray-600">
                  {interview.duration} minutes
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">{interviewDateTime.date}</p>
                <p className="text-sm text-gray-600">{interviewDateTime.time}</p>
              </div>
            </div>

            {interview.type === 'video' && (
              <div className="flex items-center space-x-3">
                <ExternalLink className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">{interview.platform}</p>
                  <p className="text-sm text-gray-600">Meeting platform</p>
                </div>
              </div>
            )}
          </div>

          {/* Interviewer Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="relative">
                {interviewer.avatar ? (
                  <img
                    src={interviewer.avatar}
                    alt={interviewer.name}
                    className="w-10 h-10 rounded-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${getAvatarColor(interviewer.name)} ${
                    interviewer.avatar ? 'hidden' : 'flex'
                  }`}
                >
                  {getInitials(interviewer.name)}
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">
                  {interviewer.name}
                </h4>
                <p className="text-sm text-gray-600">
                  {interviewer.title}
                </p>
              </div>
            </div>

            <div className="text-sm text-gray-600">
              <p>{interviewer.bio}</p>
            </div>
          </div>
        </div>

        {/* Interview Instructions */}
        {interview.instructions && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-medium text-yellow-900 mb-2">Special Instructions</h4>
            <p className="text-sm text-yellow-800">{interview.instructions}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-gray-200">
          {interview.type === 'video' && (
            <Button 
              variant="primary" 
              disabled={!canJoin}
              className={canJoin ? '' : 'opacity-50 cursor-not-allowed'}
            >
              <Video className="w-4 h-4 mr-2" />
              {canJoin ? 'Join Interview' : 'Join Available 10 min Before'}
            </Button>
          )}
          
          {interview.type === 'onsite' && (
            <Button variant="outline">
              <MapPin className="w-4 h-4 mr-2" />
              Get Directions
            </Button>
          )}
          
          {canReschedule && (
            <Button 
              variant="outline" 
              onClick={() => setShowRescheduleModal(true)}
              disabled={isSubmitting}
            >
              <Edit3 className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Sending Request...' : 'Reschedule'}
            </Button>
          )}
          
          {!canReschedule && interview.status === 'scheduled' && hoursUntilInterview <= 24 && (
            <div className="text-sm text-gray-500 italic">
              Reschedule deadline has passed (24 hours before interview)
            </div>
          )}
        </div>
      </Card>

      {/* Equipment Test (for video interviews) */}
      {interview.type === 'video' && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Equipment Check</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <Camera className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <h4 className="font-medium text-gray-900">Camera</h4>
              <Button variant="outline" size="sm" className="mt-2">
                Test Camera
              </Button>
            </div>
            
            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <Headphones className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <h4 className="font-medium text-gray-900">Microphone</h4>
              <Button variant="outline" size="sm" className="mt-2">
                Test Audio
              </Button>
            </div>
            
            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <Wifi className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <h4 className="font-medium text-gray-900">Connection</h4>
              <Button variant="outline" size="sm" className="mt-2">
                Speed Test
              </Button>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">💡 Technical Tips</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Ensure stable internet connection (minimum 1 Mbps upload/download)</li>
              <li>• Use headphones to avoid echo</li>
              <li>• Test your setup 30 minutes before the interview</li>
              <li>• Have a backup plan (phone number) in case of technical issues</li>
            </ul>
          </div>
        </Card>
      )}

      {/* Reschedule Modal */}
      {showRescheduleModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowRescheduleModal(false)} />
            
            <div className="inline-block w-full max-w-md my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Request Reschedule
                  </h3>
                  <button
                    onClick={() => setShowRescheduleModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <p className="text-gray-600 mb-4">
                  Please provide a reason for rescheduling your interview. This will help the recruiter understand your situation.
                </p>
                
                <textarea
                  placeholder="Reason for rescheduling (optional)..."
                  rows={3}
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                />
                
                <div className="text-sm text-gray-600 mb-6">
                  <p><strong>Current Interview:</strong> {interviewDateTime.date} at {interviewDateTime.time}</p>
                  <p><strong>Reschedule Deadline:</strong> 24 hours before interview</p>
                </div>
                
                <div className="flex space-x-3">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowRescheduleModal(false);
                      setRescheduleReason('');
                    }} 
                    className="flex-1"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="primary" 
                    onClick={handleReschedule} 
                    className="flex-1"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Sending Request...' : 'Request Reschedule'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewScheduledState;

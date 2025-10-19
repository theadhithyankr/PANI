import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Calendar,
  Clock,
  Video,
  MapPin,
  User,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  Phone
} from 'lucide-react';

const EmptyState = ({ icon: Icon, title, description }) => (
  <div className="text-center py-16">
    <div className="mx-auto h-16 w-16 text-gray-300 mb-6">
      <Icon className="h-16 w-16" />
    </div>
    <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-500 max-w-sm mx-auto">{description}</p>
  </div>
);

const InterviewingStep = ({ interviews = [], onReschedule, onJoinInterview, onCancelInterview, loading = false }) => {
  const { t } = useTranslation();
  
  if (!interviews || interviews.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Interview Schedule</h2>
          <p className="text-gray-600">Your interview status and upcoming sessions</p>
        </div>
        
        <EmptyState 
          icon={Calendar}
          title="No interviews scheduled yet"
          description="The employer will contact you soon to schedule your interviews. We'll notify you once an interview is scheduled."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Interview Schedule</h2>
        <p className="text-gray-600">Your upcoming and completed interviews</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {interviews.map((interview) => (
          <div key={interview.id} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start space-x-4">
                <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                  interview.status === 'completed' 
                    ? 'bg-green-100 text-green-600'
                    : interview.status === 'scheduled'
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {interview.status === 'completed' ? (
                    <CheckCircle className="h-6 w-6" />
                  ) : (
                    <Calendar className="h-6 w-6" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{interview.type} Interview</h3>
                  <p className="text-gray-600">Round {interview.round}</p>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                    <span className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {new Date(interview.dateTime).toLocaleString()}
                    </span>
                    <span className="flex items-center">
                      <User className="h-4 w-4 mr-1" />
                      {interview.interviewer}
                    </span>
                  </div>
                </div>
              </div>
              
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                interview.status === 'completed' 
                  ? 'bg-green-100 text-green-800'
                  : interview.status === 'scheduled'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {interview.status}
              </span>
            </div>

            {/* Interview Details */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  {interview.mode === 'video' ? (
                    <Video className="h-5 w-5 text-gray-400" />
                  ) : (
                    <MapPin className="h-5 w-5 text-gray-400" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {interview.mode === 'video' ? 'Video Call' : 'In-Person'}
                    </p>
                    <p className="text-sm text-gray-600">{interview.location}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Duration</p>
                    <p className="text-sm text-gray-600">{interview.duration}</p>
                  </div>
                </div>
              </div>
              
              {interview.description && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-900 mb-1">What to expect:</p>
                  <p className="text-sm text-gray-600">{interview.description}</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between border-t border-gray-200 pt-4">
              <div className="flex items-center space-x-2">
                {interview.status === 'scheduled' && (
                  <>
                    {interview.mode === 'video' && interview.meetingLink && (
                      <a 
                        href={interview.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors text-sm"
                      >
                        <Video className="h-4 w-4 mr-2" />
                        Join Meeting
                      </a>
                    )}
                    <button className="flex items-center px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Message Interviewer
                    </button>
                  </>
                )}
                
                {interview.status === 'completed' && interview.feedback && (
                  <div className="flex items-center text-sm text-green-600">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Interview completed successfully
                  </div>
                )}
              </div>
              
              {interview.status === 'scheduled' && (
                <div className="flex items-center space-x-2">
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    Reschedule Request
                  </button>
                </div>
              )}
            </div>

            {/* Feedback Section for Completed Interviews */}
            {interview.status === 'completed' && interview.feedback && (
              <div className="mt-4 bg-green-50 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-2">Interview Feedback</h4>
                <p className="text-green-700 text-sm">{interview.feedback}</p>
              </div>
            )}

            {/* Preparation Tips for Upcoming Interviews */}
            {interview.status === 'scheduled' && interview.tips && (
              <div className="mt-4 bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Preparation Tips</h4>
                <ul className="space-y-1">
                  {interview.tips.map((tip, index) => (
                    <li key={index} className="text-blue-700 text-sm flex items-start">
                      <span className="mr-2">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Interview Process Timeline */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Interview Process</h3>
        <div className="space-y-3">
          {interviews.map((interview, index) => (
            <div key={interview.id} className="flex items-center space-x-4">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                interview.status === 'completed' 
                  ? 'bg-green-100 text-green-600'
                  : interview.status === 'scheduled'
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-gray-100 text-gray-400'
              }`}>
                {interview.status === 'completed' ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <span className="text-sm font-medium">{interview.round}</span>
                )}
              </div>
              <div className="flex-1">
                <p className={`font-medium ${
                  interview.status === 'completed' ? 'text-gray-900' : 
                  interview.status === 'scheduled' ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  {interview.type} Interview
                </p>
                <p className="text-sm text-gray-500">
                  {interview.status === 'completed' 
                    ? `Completed on ${new Date(interview.dateTime).toLocaleDateString()}`
                    : interview.status === 'scheduled'
                    ? `Scheduled for ${new Date(interview.dateTime).toLocaleDateString()}`
                    : 'Pending'
                  }
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InterviewingStep;

import React, { useState } from 'react';
import { X, Calendar, Clock, Video, MapPin, Users, FileText, MessageCircle, Star, Download, ExternalLink } from 'lucide-react';
import Button from '../common/Button';
import Badge from '../common/Badge';
import Card from '../common/Card';

const InterviewDetailModal = ({ interview, isOpen, onClose, onReschedule, onCancel }) => {
  const [activeTab, setActiveTab] = useState('details');
  const [notes, setNotes] = useState('');
  const [rating, setRating] = useState(0);

  if (!isOpen || !interview) return null;

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

  const tabs = [
    { id: 'details', label: 'Interview Details' },
    { id: 'preparation', label: 'Preparation' },
    { id: 'feedback', label: 'Feedback' },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'info';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      case 'rescheduled': return 'warning';
      default: return 'default';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    return new Date(`2024-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const renderDetails = () => (
    <div className="space-y-6">
      {/* Interview Overview */}
      <Card>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">{interview.round}</h3>
            <p className="text-gray-600">{interview.position} at {interview.companyName}</p>
          </div>
          <Badge variant={getStatusColor(interview.status)} size="sm">
            {interview.status}
          </Badge>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gray-500" />
              <div>
                <p className="font-medium text-gray-900">{formatDate(interview.scheduledDate)}</p>
                <p className="text-sm text-gray-600">Interview Date</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-gray-500" />
              <div>
                <p className="font-medium text-gray-900">{formatTime(interview.scheduledTime)} ({interview.duration} min)</p>
                <p className="text-sm text-gray-600">Duration</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {interview.type === 'video' ? (
                <Video className="w-5 h-5 text-gray-500" />
              ) : interview.type === 'onsite' ? (
                <MapPin className="w-5 h-5 text-gray-500" />
              ) : (
                <Users className="w-5 h-5 text-gray-500" />
              )}
              <div>
                <p className="font-medium text-gray-900 capitalize">{interview.type} Interview</p>
                <p className="text-sm text-gray-600">Format</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Interviewers</h4>
              <div className="space-y-2">
                {interview.interviewers?.map((interviewer, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
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
                        <p className="font-medium text-gray-900">{interviewer.name}</p>
                        <p className="text-sm text-gray-600">{interviewer.role || interviewer.title || 'Interviewer'}</p>
                      </div>
                    </div>
                    {interviewer.linkedin && (
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Meeting Details */}
      {interview.type === 'video' && interview.meetingLink && (
        <Card>
          <h4 className="font-medium text-gray-900 mb-3">Video Meeting Details</h4>
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
            <div>
              <p className="font-medium text-blue-900">Join Video Call</p>
              <p className="text-sm text-blue-700">Meeting link will be active 15 minutes before the interview</p>
            </div>
            <Button variant="primary" size="sm">
              <Video className="w-4 h-4 mr-2" />
              Join Meeting
            </Button>
          </div>
          
          <div className="mt-4 space-y-2">
            <h5 className="font-medium text-gray-900">Technical Requirements</h5>
            {interview.requirements?.map((req, index) => (
              <div key={index} className="flex items-center gap-2 text-sm text-gray-700">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                {req}
              </div>
            ))}
          </div>
        </Card>
      )}

      {interview.type === 'onsite' && interview.location && (
        <Card>
          <h4 className="font-medium text-gray-900 mb-3">Location Details</h4>
          <div className="flex items-start gap-3 mb-4">
            <MapPin className="w-5 h-5 text-gray-500 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">{interview.location}</p>
              <p className="text-sm text-gray-600">Office Address</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <Button variant="outline" size="sm">
              <MapPin className="w-4 h-4 mr-2" />
              Get Directions
            </Button>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <h5 className="font-medium text-yellow-900 mb-1">What to Bring</h5>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• Government-issued ID</li>
                <li>• Printed copy of your resume</li>
                <li>• Notebook and pen</li>
                <li>• Portfolio or work samples (if applicable)</li>
              </ul>
            </div>
          </div>
        </Card>
      )}

      {/* Agenda */}
      {interview.agenda && (
        <Card>
          <h4 className="font-medium text-gray-900 mb-3">Interview Agenda</h4>
          <p className="text-gray-700 leading-relaxed">{interview.agenda}</p>
        </Card>
      )}

      {/* Notes */}
      {interview.notes && (
        <Card>
          <h4 className="font-medium text-gray-900 mb-3">Additional Notes</h4>
          <p className="text-gray-700 leading-relaxed">{interview.notes}</p>
        </Card>
      )}
    </div>
  );

  const renderPreparation = () => (
    <div className="space-y-6">
      {/* Preparation Materials */}
      {interview.preparationMaterials && (
        <Card>
          <h4 className="font-medium text-gray-900 mb-4">Recommended Reading</h4>
          <div className="space-y-3">
            {interview.preparationMaterials.map((material, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-gray-500" />
                  <span className="text-gray-900">{material}</span>
                </div>
                <Button variant="ghost" size="sm">
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Interview Tips */}
      <Card>
        <h4 className="font-medium text-gray-900 mb-4">Interview Tips</h4>
        <div className="space-y-4">
          <div>
            <h5 className="font-medium text-gray-900 mb-2">Before the Interview</h5>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>• Research the company and recent news</li>
              <li>• Review the job description and your application</li>
              <li>• Prepare specific examples of your work</li>
              <li>• Test your technology (for video interviews)</li>
              <li>• Prepare thoughtful questions to ask</li>
            </ul>
          </div>
          
          <div>
            <h5 className="font-medium text-gray-900 mb-2">During the Interview</h5>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>• Be authentic and enthusiastic</li>
              <li>• Use the STAR method for behavioral questions</li>
              <li>• Ask clarifying questions if needed</li>
              <li>• Show genuine interest in the role and company</li>
              <li>• Take notes during the conversation</li>
            </ul>
          </div>
          
          <div>
            <h5 className="font-medium text-gray-900 mb-2">After the Interview</h5>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>• Send a thank-you email within 24 hours</li>
              <li>• Reflect on the conversation and take notes</li>
              <li>• Follow up on any commitments you made</li>
              <li>• Be patient while waiting for feedback</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Common Questions */}
      <Card>
        <h4 className="font-medium text-gray-900 mb-4">Common Questions for {interview.round}</h4>
        <div className="space-y-3">
          {[
            "Tell me about yourself and your background",
            "Why are you interested in this position?",
            "What are your greatest strengths and weaknesses?",
            "Describe a challenging project you worked on",
            "How do you handle working under pressure?",
            "Where do you see yourself in 5 years?",
            "Why do you want to work for our company?",
            "Do you have any questions for us?"
          ].map((question, index) => (
            <div key={index} className="p-3 bg-gray-50 rounded-lg">
              <p className="text-gray-900">{question}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  const renderFeedback = () => (
    <div className="space-y-6">
      {interview.status === 'completed' && interview.feedback ? (
        <>
          {/* Received Feedback */}
          <Card>
            <h4 className="font-medium text-gray-900 mb-4">Interview Feedback</h4>
            <div className="space-y-4">
              {interview.rating && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Overall Rating:</span>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(interview.rating) ? 'text-yellow-500 fill-current' : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="ml-1 text-sm text-gray-600">({interview.rating}/5)</span>
                  </div>
                </div>
              )}
              
              <div>
                <h5 className="font-medium text-gray-900 mb-2">Feedback</h5>
                <p className="text-gray-700 leading-relaxed">{interview.feedback}</p>
              </div>
            </div>
          </Card>
        </>
      ) : interview.status === 'completed' ? (
        <Card>
          <div className="text-center py-8">
            <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">Feedback Pending</h4>
            <p className="text-gray-600">
              The interviewer hasn't provided feedback yet. You'll be notified when it's available.
            </p>
          </div>
        </Card>
      ) : (
        <>
          {/* Post-Interview Notes */}
          <Card>
            <h4 className="font-medium text-gray-900 mb-4">Your Interview Notes</h4>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="How did the interview go? What questions were asked? Any key points to remember..."
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="mt-3 flex justify-end">
              <Button variant="outline" size="sm">
                Save Notes
              </Button>
            </div>
          </Card>

          {/* Self-Assessment */}
          <Card>
            <h4 className="font-medium text-gray-900 mb-4">How do you think it went?</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rate your performance
                </label>
                <div className="flex items-center gap-2">
                  {[...Array(5)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setRating(i + 1)}
                      className={`w-8 h-8 ${
                        i < rating ? 'text-yellow-500' : 'text-gray-300'
                      } hover:text-yellow-400 transition-colors`}
                    >
                      <Star className="w-full h-full fill-current" />
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-gray-600">
                    {rating > 0 && `${rating}/5`}
                  </span>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  Save Assessment
                </Button>
                <Button variant="primary" size="sm">
                  Send Thank You Note
                </Button>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'details': return renderDetails();
      case 'preparation': return renderPreparation();
      case 'feedback': return renderFeedback();
      default: return renderDetails();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />
        
        <div className="inline-block w-full max-w-4xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{interview.round}</h2>
              <p className="text-gray-600">{interview.position} at {interview.companyName}</p>
            </div>
            <Button variant="ghost" onClick={onClose}>
              <X className="w-6 h-6" />
            </Button>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[600px] overflow-y-auto">
            {renderTabContent()}
          </div>

          {/* Footer Actions */}
          {interview.status === 'scheduled' && (
            <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex space-x-3">
                <Button variant="outline" onClick={() => onReschedule(interview)}>
                  <Calendar className="w-4 h-4 mr-2" />
                  Request Reschedule
                </Button>
                <Button variant="outline" onClick={() => onCancel(interview)}>
                  Cancel Interview
                </Button>
              </div>
              
              {interview.type === 'video' && interview.meetingLink && (
                <Button variant="primary">
                  <Video className="w-4 h-4 mr-2" />
                  Join Meeting
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InterviewDetailModal;

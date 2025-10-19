import React, { useState } from 'react';
import { 
  Heart, 
  TrendingUp, 
  MessageCircle, 
  Calendar, 
  BookOpen, 
  ExternalLink,
  ChevronRight,
  FileText,
  Star,
  Target,
  Clock,
  AlertCircle
} from 'lucide-react';
import Card from '../../common/Card';
import Button from '../../common/Button';
import Badge from '../../common/Badge';

const RejectedState = ({ application, job }) => {
  const [showFeedbackDetails, setShowFeedbackDetails] = useState(false);
  const [showReapplyModal, setShowReapplyModal] = useState(false);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const canReapply = application.rejection?.canReapply && 
                    new Date(application.rejection.reapplyDate) <= new Date();

  const suggestedRoles = application.rejection?.suggestedRoles || [];

  // Mock similar roles data
  const similarRoles = [
    {
      id: 1,
      title: 'Senior Backend Developer',
      company: 'TechCorp Solutions',
      location: 'Berlin, Germany',
      matchScore: 95,
      postedDate: '2024-03-20',
      status: 'active'
    },
    {
      id: 2,
      title: 'DevOps Engineer',
      company: 'CloudTech GmbH',
      location: 'Munich, Germany',
      matchScore: 88,
      postedDate: '2024-03-18',
      status: 'active'
    },
    {
      id: 3,
      title: 'Full Stack Developer',
      company: 'StartupHub Berlin',
      location: 'Berlin, Germany',
      matchScore: 92,
      postedDate: '2024-03-22',
      status: 'active'
    }
  ];

  const improvementTips = [
    {
      icon: BookOpen,
      title: 'Skill Enhancement',
      description: 'Consider adding Docker and Kubernetes to your skillset',
      action: 'View Learning Paths',
      urgent: true
    },
    {
      icon: FileText,
      title: 'Portfolio Update',
      description: 'Add more recent projects showcasing your latest work',
      action: 'Update Portfolio',
      urgent: false
    },
    {
      icon: MessageCircle,
      title: 'Professional Network',
      description: 'Connect with professionals in your target companies',
      action: 'Expand Network',
      urgent: false
    },
    {
      icon: Target,
      title: 'Application Strategy',
      description: 'Focus on roles that match 90%+ of your current skills',
      action: 'Get Strategy Tips',
      urgent: true
    }
  ];

  return (
    <div className="space-y-6">
      {/* Professional Rejection Notice */}
      <Card className="border-l-4 border-l-red-500">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Application Update
            </h3>
            <p className="text-gray-700 mb-4">
              Thank you for your interest in the <strong>{job?.title}</strong> position at <strong>{job?.company}</strong>. 
              After careful consideration, we have decided to move forward with other candidates at this time.
            </p>
            
            {application.rejection?.reason && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-gray-900 mb-2">Decision Rationale</h4>
                <p className="text-gray-700 text-sm">
                  {application.rejection.reason}
                </p>
              </div>
            )}

            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="w-4 h-4 mr-1" />
              <span>Decision made on {formatDate(application.timeline?.find(t => t.event === 'rejected')?.date || application.lastUpdated)}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Feedback Section */}
      {application.rejection?.feedback && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Feedback & Insights</h3>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowFeedbackDetails(!showFeedbackDetails)}
            >
              {showFeedbackDetails ? 'Hide Details' : 'Show Details'}
              <ChevronRight className={`w-4 h-4 ml-1 transform transition-transform ${showFeedbackDetails ? 'rotate-90' : ''}`} />
            </Button>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-4 mb-4">
            <div className="flex items-start space-x-3">
              <MessageCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 mb-1">Recruiter Feedback</h4>
                <p className="text-blue-800 text-sm">
                  {application.rejection.feedback}
                </p>
              </div>
            </div>
          </div>

          {showFeedbackDetails && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 rounded-lg p-4">
                  <h5 className="font-medium text-green-900 mb-2">Strengths Noted</h5>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• Strong technical foundation</li>
                    <li>• Excellent communication skills</li>
                    <li>• Relevant project experience</li>
                  </ul>
                </div>
                <div className="bg-orange-50 rounded-lg p-4">
                  <h5 className="font-medium text-orange-900 mb-2">Areas for Growth</h5>
                  <ul className="text-sm text-orange-800 space-y-1">
                    <li>• DevOps experience needed</li>
                    <li>• Larger scale project exposure</li>
                    <li>• Leadership experience</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Encouragement & Motivation */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <div className="text-center py-6">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Keep Moving Forward!
          </h3>
          <p className="text-gray-700 mb-4 max-w-md mx-auto">
            Every "no" brings you closer to the right "yes". Your skills and experience are valuable, 
            and the right opportunity is waiting for you.
          </p>
          <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
            <div className="text-center">
              <div className="font-semibold text-purple-600">92%</div>
              <div>Match Score</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-purple-600">Top 15%</div>
              <div>Candidate Ranking</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-purple-600">8+</div>
              <div>Skills Matched</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Improvement Tips */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Personalized Improvement Tips
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {improvementTips.map((tip, index) => {
            const Icon = tip.icon;
            return (
              <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start space-x-3">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                    tip.urgent ? 'bg-orange-100' : 'bg-blue-100'
                  }`}>
                    <Icon className={`w-5 h-5 ${tip.urgent ? 'text-orange-600' : 'text-blue-600'}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium text-gray-900">{tip.title}</h4>
                      {tip.urgent && (
                        <Badge variant="warning" size="xs">Priority</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{tip.description}</p>
                    <Button variant="outline" size="sm">
                      {tip.action}
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Reapply Options */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reapply to Same Company */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Reapply to {job?.company}
          </h3>
          
          {canReapply ? (
            <div className="space-y-4">
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-green-900">Eligible to Reapply</span>
                </div>
                <p className="text-sm text-green-800">
                  You can submit a new application for future openings at {job?.company}.
                </p>
              </div>
              
              {suggestedRoles.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Suggested Positions</h4>
                  <div className="space-y-2">
                    {suggestedRoles.map((role, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-900">{role}</span>
                        <Button variant="outline" size="xs">
                          View Role
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <Button variant="primary" onClick={() => setShowReapplyModal(true)}>
                Get Notified of New Openings
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-orange-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Clock className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-900">Reapply Available</span>
                </div>
                <p className="text-sm text-orange-800">
                  You can reapply starting {formatDate(application.rejection?.reapplyDate)}.
                </p>
              </div>
              
              <Button variant="outline" disabled>
                Reminder Set for {formatDate(application.rejection?.reapplyDate)}
              </Button>
            </div>
          )}
        </Card>

        {/* Similar Opportunities */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Similar Opportunities
          </h3>
          
          <div className="space-y-3">
            {similarRoles.slice(0, 3).map((role) => (
              <div key={role.id} className="border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 text-sm">{role.title}</h4>
                    <p className="text-xs text-gray-600">{role.company} • {role.location}</p>
                    <div className="flex items-center space-x-3 mt-2">
                      <div className="flex items-center space-x-1">
                        <Star className="w-3 h-3 text-yellow-500" />
                        <span className="text-xs text-gray-600">{role.matchScore}% match</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(role.postedDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <Button variant="outline" size="xs">
                    Apply
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          <Button variant="ghost" className="w-full mt-4">
            <TrendingUp className="w-4 h-4 mr-2" />
            View All Similar Roles
          </Button>
        </Card>
      </div>

      {/* Keep in Database Option */}
      {application.rejection?.keepInDatabase && (
        <Card className="bg-blue-50 border-blue-200">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-blue-900 mb-1">Profile Saved</h4>
              <p className="text-sm text-blue-800">
                {job?.company} has kept your profile in their talent database for future opportunities. 
                You'll be considered for relevant positions that match your skills.
              </p>
            </div>
            <Badge variant="info">Active</Badge>
          </div>
        </Card>
      )}

      {/* Reapply Modal */}
      {showReapplyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Get Notified of New Openings
            </h3>
            <p className="text-gray-600 mb-4">
              We'll send you an email when {job?.company} posts new positions that match your profile.
            </p>
            <div className="flex space-x-3">
              <Button variant="primary" onClick={() => setShowReapplyModal(false)}>
                Set Notification
              </Button>
              <Button variant="outline" onClick={() => setShowReapplyModal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RejectedState;

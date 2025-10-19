import React, { useState } from 'react';
import { Eye, TrendingUp, Clock, Users, BarChart, MessageCircle, Target, Star, X } from 'lucide-react';
import Card from '../../common/Card';
import Button from '../../common/Button';
import Badge from '../../common/Badge';

const ReviewingState = ({ application, job, onWithdraw }) => {
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);


  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return `${Math.ceil(diffDays / 30)} months ago`;
  };

  return (
    <div className="space-y-6">
      {/* Review Status Hero */}
      <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
        <div className="text-center py-6">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Eye className="w-8 h-8 text-yellow-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Your Application is Under Review
          </h2>
          <p className="text-gray-700 mb-4">
            The hiring team is actively reviewing your profile
          </p>
          
          <div className="flex justify-center space-x-6 text-sm">
            <div className="text-center">
              <div className="font-semibold text-green-600">{application.matchScore}%</div>
              <div className="text-gray-600">Match Score</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-blue-600">
                {application.companyInsights?.yourRanking || 'Top 20%'}
              </div>
              <div className="text-gray-600">Your Ranking</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-purple-600">
                {(() => {
                  const daysSinceApplied = Math.floor((new Date() - new Date(application.appliedDate)) / (1000 * 60 * 60 * 24));
                  return daysSinceApplied > 0 ? `${daysSinceApplied}d` : 'Today';
                })()}
              </div>
              <div className="text-gray-600">Days Applied</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Review Activity */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        
        <div className="space-y-4">
          {application.timeline
            .filter(item => item.event !== 'applied')
            .map((activity, index) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Eye className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{activity.title}</h4>
                  <p className="text-sm text-gray-600">{activity.description}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {getTimeAgo(activity.date)}
                  </p>
                </div>
                <Badge variant="success" size="sm">Active</Badge>
              </div>
            ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Positive Signals</h4>
              <p className="text-sm text-blue-800 mt-1">
                Your application has been viewed multiple times and moved to active review. 
                This indicates genuine interest from the hiring team.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Company Insights */}
      {application.companyInsights && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Insights</h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Your Position:</span>
                <Badge variant="success" size="sm">
                  {application.companyInsights.yourRanking}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Total Applicants:</span>
                <span className="font-medium">{application.companyInsights.totalApplicants}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Avg Response Time:</span>
                <span className="font-medium">{application.companyInsights.averageResponseTime}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Hiring Timeline:</span>
                <span className="font-medium">{application.companyInsights.hiringTimeline}</span>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">Interview Process</h4>
              <div className="space-y-2">
                {application.companyInsights.interviewProcess?.map((step, index) => (
                  <div key={index} className="flex items-center space-x-2 text-sm">
                    <div className="w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-blue-600">{index + 1}</span>
                    </div>
                    <span className="text-gray-700">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Performance Metrics */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">How You're Performing</h3>
        
        <div className="grid md:grid-cols-3 gap-4">
          <div className="text-center p-4 border border-gray-200 rounded-lg">
            <Target className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <h4 className="font-medium text-gray-900">Skills Match</h4>
            <p className="text-2xl font-bold text-green-600">{application.matchScore}%</p>
            <p className="text-sm text-gray-600">Above average</p>
          </div>
          
          <div className="text-center p-4 border border-gray-200 rounded-lg">
            <Users className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <h4 className="font-medium text-gray-900">Competition</h4>
            <p className="text-2xl font-bold text-blue-600">
              {application.companyInsights?.totalApplicants || 'N/A'}
            </p>
            <p className="text-sm text-gray-600">Total applicants</p>
          </div>
          
          <div className="text-center p-4 border border-gray-200 rounded-lg">
            <Star className="w-8 h-8 text-purple-500 mx-auto mb-2" />
            <h4 className="font-medium text-gray-900">Profile Strength</h4>
            <p className="text-2xl font-bold text-purple-600">Strong</p>
            <p className="text-sm text-gray-600">Based on views</p>
          </div>
        </div>
      </Card>

      {/* Skills Assessment */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills Assessment</h3>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Matching Skills</h4>
            <div className="flex flex-wrap gap-2">
              {application.jobMatchDetails?.matchedSkills?.map((skill) => (
                <Badge key={skill} variant="success" size="sm">
                  ✓ {skill}
                </Badge>
              ))}
            </div>
          </div>
          
          {application.jobMatchDetails?.missingSkills?.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Areas for Growth</h4>
              <div className="flex flex-wrap gap-2">
                {application.jobMatchDetails.missingSkills.map((skill) => (
                  <Badge key={skill} variant="warning" size="sm">
                    {skill}
                  </Badge>
                ))}
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Consider highlighting transferable skills or learning experience in these areas
              </p>
            </div>
          )}
        </div>

        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="font-medium text-green-900 mb-2">💡 Pro Tip</h4>
          <p className="text-sm text-green-800">
            Your profile shows strong alignment with the role requirements. 
            Keep your profile updated and be ready to discuss your experience in detail.
          </p>
        </div>
      </Card>

      {/* What's Happening Now */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">What's Happening Now</h3>
        
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
              <Eye className="w-4 h-4 text-yellow-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Profile Review</h4>
              <p className="text-sm text-gray-600">
                Hiring managers are reviewing your experience, skills, and cultural fit
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <BarChart className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Candidate Comparison</h4>
              <p className="text-sm text-gray-600">
                Your profile is being compared with other candidates to create a shortlist
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <Users className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Team Input</h4>
              <p className="text-sm text-gray-600">
                Multiple team members may be providing input on your application
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* What You Can Do */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">What You Can Do</h3>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 border border-gray-200 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Stay Updated</h4>
            <p className="text-sm text-gray-600 mb-3">
              Keep your profile current and be ready to respond quickly
            </p>
            <Button variant="outline" size="sm">
              Update Profile
            </Button>
          </div>
          
          <div className="p-4 border border-gray-200 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Prepare for Next Steps</h4>
            <p className="text-sm text-gray-600 mb-3">
              Research the company and prepare for potential interviews
            </p>
            <Button variant="outline" size="sm">
              Company Research
            </Button>
          </div>
          
          <div className="p-4 border border-gray-200 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Follow Up</h4>
            <p className="text-sm text-gray-600 mb-3">
              Send a polite follow-up message to express continued interest
            </p>

          </div>
          
          <div className="p-4 border border-gray-200 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Network</h4>
            <p className="text-sm text-gray-600 mb-3">
              Connect with current employees to learn more about the role
            </p>
            <Button variant="outline" size="sm">
              Find Connections
            </Button>
          </div>
        </div>
      </Card>

      {/* Timeline Expectations */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Expected Timeline</h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Initial Review:</span>
            <Badge variant="success" size="sm">Completed</Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Detailed Assessment:</span>
            <Badge variant="warning" size="sm">In Progress</Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Decision/Interview Invite:</span>
            <span className="text-sm text-gray-500">
              {application.companyInsights?.averageResponseTime || '3-5 days'}
            </span>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Stay Patient</h4>
              <p className="text-sm text-blue-800 mt-1">
                Quality review takes time. Your application being actively reviewed is a positive sign.
                We'll notify you immediately when there's an update.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Action Panel */}
      {onWithdraw && (
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button 
            variant="outline" 
            onClick={() => setShowWithdrawModal(true)} 
            className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400 flex-1"
          >
            <X className="w-4 h-4 mr-2" />
            Withdraw Application
          </Button>
        </div>
      )}

      {/* Withdraw Confirmation Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowWithdrawModal(false)} />
            
            <div className="inline-block w-full max-w-md my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Withdraw Application
                </h3>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to withdraw your application for {job.title} at {job.company}? 
                  This action cannot be undone.
                </p>
                <div className="flex space-x-3">
                  <Button variant="outline" onClick={() => setShowWithdrawModal(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button 
                    variant="primary" 
                    onClick={() => {
                      setShowWithdrawModal(false);
                      if (onWithdraw) {
                        onWithdraw();
                      }
                    }} 
                    className="flex-1 bg-red-600 hover:bg-red-700"
                  >
                    Withdraw
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

export default ReviewingState;

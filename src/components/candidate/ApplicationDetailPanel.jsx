import React, { useState, useEffect } from 'react';
import { 
  X, Building, MapPin, Calendar, Clock, Euro, FileText, 
  Download, MessageCircle, Phone, Video, CheckCircle, AlertTriangle,
  TrendingUp, Target, Users, Award, Star, Eye, Edit, Plus, Minus
} from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';
import Badge from '../common/Badge';
import useDocumentsStore from '../../store/documentsStore';
import { useToast } from '../../hooks/common/useToast';

const ApplicationDetailPanel = ({ application, job, onClose }) => {
  const [expandedSections, setExpandedSections] = useState({
    documents: true,
    aiInsights: false,
    companyInsights: false,
    skillMatch: false
  });
  
  const { documents, getDocumentUrl } = useDocumentsStore();
  const { error: showError } = useToast();

  // Get document by ID from the store
  const getDocumentById = (documentId) => {
    return documents.find(doc => doc.id === documentId);
  };

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

  const toggleAISubsection = (subsection) => {
    setExpandedSections(prev => ({
      ...prev,
      [subsection]: !prev[subsection]
    }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'applied': return 'info';
      case 'reviewing': return 'warning';
      case 'interviewing': return 'secondary';
      case 'offer_received': return 'success';
      case 'rejected': return 'error';
      case 'withdrawn': return 'default';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'applied': return 'Applied';
      case 'reviewing': return 'Under Review';
      case 'interviewing': return 'Interviewing';
      case 'offer_received': return 'Offer Received';
      case 'rejected': return 'Not Selected';
      case 'withdrawn': return 'Withdrawn';
      default: return status;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatInterviewDateTime = (interview) => {
    if (!interview?.date || !interview?.time) return 'TBD';
    
    const date = new Date(interview.date);
    const time = interview.time;
    
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) + ` at ${time}`;
  };

  const handleJoinInterview = () => {
    if (application?.interview?.meetingLink) {
      window.open(application.interview.meetingLink, '_blank');
    }
  };

  const getProgressPercentage = (status) => {
    switch (status) {
      case 'applied': return 25;
      case 'reviewing': return 50;
      case 'interviewing': return 75;
      case 'offer_received': return 90;
      case 'hired': return 100;
      case 'rejected': return 0;
      default: return 25;
    }
  };

  const getAIInsights = (status) => {
    const baseScore = 85;
    const ranking = Math.floor(Math.random() * 20) + 10;
    const totalApplicants = Math.floor(Math.random() * 50) + 20;

    switch (status) {
      case 'applied':
        return {
          overallScore: baseScore,
          recommendation: "Your application looks strong. Continue monitoring for updates.",
          applicationStrength: { score: 88, highlights: ["Strong resume", "Good experience match"] },
          improvementAreas: { suggestions: ["Add more specific achievements"], priorityActions: ["Update portfolio"] },
          competitionAnalysis: { ranking, totalApplicants, advantages: ["Relevant experience"], challenges: ["High competition"] }
        };
      case 'reviewing':
        return {
          overallScore: baseScore + 5,
          recommendation: "Application is under review. Prepare for potential interview.",
          applicationStrength: { score: 92, highlights: ["Strong initial screening", "Good cultural fit"] },
          improvementAreas: { suggestions: ["Prepare interview questions"], priorityActions: ["Research company culture"] },
          competitionAnalysis: { ranking: ranking - 5, totalApplicants, advantages: ["Passed initial screening"], challenges: ["Technical interview next"] }
        };
      case 'interviewing':
        return {
          overallScore: baseScore + 10,
          recommendation: "Interview scheduled! Prepare thoroughly and practice common questions.",
          applicationStrength: { score: 95, highlights: ["Interview invitation", "Strong candidate profile"] },
          improvementAreas: { suggestions: ["Practice behavioral questions", "Research company"], priorityActions: ["Prepare portfolio", "Test interview setup"] },
          competitionAnalysis: { ranking: ranking - 10, totalApplicants, advantages: ["Interview opportunity"], challenges: ["Need to impress in interview"] }
        };
      case 'offer_received':
        return {
          overallScore: baseScore + 15,
          recommendation: "Congratulations! Review the offer carefully and respond promptly.",
          applicationStrength: { score: 98, highlights: ["Offer received", "Strong performance"], },
          improvementAreas: { suggestions: ["Review offer terms", "Negotiate if needed"], priorityActions: ["Respond to offer", "Plan next steps"] },
          competitionAnalysis: { ranking: 1, totalApplicants, advantages: ["Selected for position"], challenges: ["Decision time"] }
        };
      default:
        return {
          overallScore: baseScore,
          recommendation: "Continue monitoring your application status and preparing for next steps.",
          applicationStrength: { score: 88, highlights: [] },
          improvementAreas: { suggestions: [], priorityActions: [] },
          competitionAnalysis: { ranking, totalApplicants, advantages: [], challenges: [] }
        };
    }
  };

  const aiInsights = getAIInsights(application.status);

  const handleDownloadDocument = async (docId, type) => {
    try {
      const url = await getDocumentUrl(docId);
      const link = document.createElement('a');
      link.href = url;
      
      // Get document info from store
      const doc = getDocumentById(docId);
      const filename = doc?.file_name || `${type}_document`;
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading document:', error);
      showError('Failed to download document. Please try again.');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 max-h-screen flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Building className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{job?.title || application?.jobTitle || 'Job Title'}</h2>
                <p className="text-sm text-gray-600">{job?.company || application?.company || 'Company'}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {job?.location || application?.location || 'Location'}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Applied {formatDate(application?.appliedDate || application?.updatedAt)}
              </div>
              <Badge variant={getStatusColor(application.status)} size="sm">
                {getStatusText(application.status)}
              </Badge>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto min-h-0 p-4 space-y-4">
        {/* Application Progress */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Application Progress</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Progress</span>
              <span className="font-medium">{getProgressPercentage(application.status)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  application.status === 'rejected' 
                    ? 'bg-red-500' 
                    : application.status === 'offer_received' || application.status === 'hired'
                    ? 'bg-green-500'
                    : 'bg-blue-500'
                }`}
                style={{ width: `${getProgressPercentage(application.status)}%` }}
              />
            </div>
            
            {/* Timeline Steps */}
            <div className="space-y-2 mt-4">
              <div className="flex items-center text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                <span className="text-gray-600">Application submitted</span>
                <span className="ml-auto text-gray-500">{formatDate(application?.appliedDate || application?.updatedAt)}</span>
              </div>
              {application.status !== 'applied' && (
                <div className="flex items-center text-sm">
                  <div className={`w-2 h-2 rounded-full mr-3 ${
                    application.status === 'rejected' ? 'bg-red-500' : 'bg-blue-500'
                  }`}></div>
                  <span className="text-gray-600">{getStatusText(application.status)}</span>
                  <span className="ml-auto text-gray-500">Recent</span>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* AI Insights Section */}
        <Card>
          <div className="border border-blue-200 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Eye className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">AI Application Insights</h3>
              <div className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                {aiInsights.overallScore}% Match
              </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                <Target className="w-4 h-4 text-green-600 mx-auto mb-1" />
                <p className="text-xs font-medium text-gray-700">Application Strength</p>
                <p className="text-lg font-bold text-green-600">{aiInsights.applicationStrength.score}%</p>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                <Target className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                <p className="text-xs font-medium text-gray-700">Ranking</p>
                <p className="text-lg font-bold text-blue-600">#{aiInsights.competitionAnalysis.ranking}</p>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                <Users className="w-4 h-4 text-purple-600 mx-auto mb-1" />
                <p className="text-xs font-medium text-gray-700">Competition</p>
                <p className="text-lg font-bold text-purple-600">{aiInsights.competitionAnalysis.totalApplicants}</p>
              </div>
            </div>

            {/* AI Recommendation */}
            <div className="bg-blue-100 border border-blue-200 rounded-lg p-3 mb-4">
              <div className="flex items-start gap-2">
                <Eye className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-900 text-sm mb-1">AI Recommendation</h4>
                  <p className="text-xs text-blue-700">
                    {aiInsights.recommendation}
                  </p>
                </div>
              </div>
            </div>

            {/* Application Analysis Accordion */}
            <div className="space-y-3">
              <div className="border border-gray-200 rounded-lg bg-white">
                <button
                  onClick={() => toggleAISubsection('applicationAnalysis')}
                  className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-green-600" />
                    <div>
                      <h4 className="font-medium text-gray-900 text-sm">Application Strengths</h4>
                      <p className="text-xs text-gray-600">Technical skills, experience alignment, cultural fit</p>
                    </div>
                  </div>
                  {expandedSections.applicationAnalysis ? (
                    <Minus className="w-4 h-4 text-gray-500" />
                  ) : (
                    <Plus className="w-4 h-4 text-gray-500" />
                  )}
                </button>
                {expandedSections.applicationAnalysis && (
                  <div className="px-3 pb-3 border-t border-gray-200 bg-green-50 rounded-b-lg">
                    <h5 className="font-medium text-gray-800 text-xs mb-2 mt-3">Key Highlights</h5>
                    <ul className="space-y-1">
                      {aiInsights.applicationStrength.highlights.map((highlight, index) => (
                        <li key={index} className="text-xs text-gray-600 flex items-start gap-2">
                          <div className="w-1 h-1 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                          {highlight}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Improvement/Offer Evaluation Accordion */}
              <div className="border border-gray-200 rounded-lg bg-white">
                <button
                  onClick={() => toggleAISubsection('improvementSuggestions')}
                  className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <Edit className="w-4 h-4 text-yellow-600" />
                    <div>
                      <h4 className="font-medium text-gray-900 text-sm">
                        {application.status === 'offer_received' ? 'Offer Evaluation' : 'Improvement Opportunities'}
                      </h4>
                      <p className="text-xs text-gray-600">
                        {application.status === 'offer_received' 
                          ? 'Salary analysis, negotiation tips, decision factors' 
                          : 'Certifications, portfolio updates, profile optimization'}
                      </p>
                    </div>
                  </div>
                  {expandedSections.improvementSuggestions ? (
                    <Minus className="w-4 h-4 text-gray-500" />
                  ) : (
                    <Plus className="w-4 h-4 text-gray-500" />
                  )}
                </button>
                {expandedSections.improvementSuggestions && (
                  <div className="px-3 pb-3 border-t border-gray-200 bg-yellow-50 rounded-b-lg space-y-3">
                    {application.status === 'offer_received' && aiInsights.offerEvaluation ? (
                      <>
                        <div className="mt-3">
                          <h5 className="font-medium text-gray-800 text-xs mb-2">Evaluation Criteria</h5>
                          <ul className="space-y-1">
                            {aiInsights.offerEvaluation.suggestions.map((suggestion, index) => (
                              <li key={index} className="text-xs text-gray-600 flex items-start gap-2">
                                <div className="w-1 h-1 bg-yellow-500 rounded-full mt-2 flex-shrink-0" />
                                {suggestion}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-800 text-xs mb-2">Priority Actions</h5>
                          <ul className="space-y-1">
                            {aiInsights.offerEvaluation.priorityActions.map((action, index) => (
                              <li key={index} className="text-xs text-gray-600 flex items-start gap-2">
                                <div className="w-1 h-1 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                                {action}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="mt-3">
                          <h5 className="font-medium text-gray-800 text-xs mb-2">Suggested Improvements</h5>
                          <ul className="space-y-1">
                            {aiInsights.improvementAreas.suggestions.map((suggestion, index) => (
                              <li key={index} className="text-xs text-gray-600 flex items-start gap-2">
                                <div className="w-1 h-1 bg-yellow-500 rounded-full mt-2 flex-shrink-0" />
                                {suggestion}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-800 text-xs mb-2">Priority Actions</h5>
                          <ul className="space-y-1">
                            {aiInsights.improvementAreas.priorityActions.map((action, index) => (
                              <li key={index} className="text-xs text-gray-600 flex items-start gap-2">
                                <div className="w-1 h-1 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                                {action}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Competition Analysis Accordion */}
              <div className="border border-gray-200 rounded-lg bg-white">
                <button
                  onClick={() => toggleAISubsection('competitionInsights')}
                  className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-purple-600" />
                    <div>
                      <h4 className="font-medium text-gray-900 text-sm">Competition Analysis</h4>
                      <p className="text-xs text-gray-600">Ranking #{aiInsights.competitionAnalysis.ranking} of {aiInsights.competitionAnalysis.totalApplicants} candidates</p>
                    </div>
                  </div>
                  {expandedSections.competitionInsights ? (
                    <Minus className="w-4 h-4 text-gray-500" />
                  ) : (
                    <Plus className="w-4 h-4 text-gray-500" />
                  )}
                </button>
                {expandedSections.competitionInsights && (
                  <div className="px-3 pb-3 border-t border-gray-200 bg-purple-50 rounded-b-lg space-y-3">
                    <div className="mt-3">
                      <h5 className="font-medium text-gray-800 text-xs mb-2">Your Advantages</h5>
                      <ul className="space-y-1">
                        {aiInsights.competitionAnalysis.advantages.map((advantage, index) => (
                          <li key={index} className="text-xs text-gray-600 flex items-start gap-2">
                            <div className="w-1 h-1 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                            {advantage}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-800 text-xs mb-2">Areas to Address</h5>
                      <ul className="space-y-1">
                        {aiInsights.competitionAnalysis.challenges.map((challenge, index) => (
                          <li key={index} className="text-xs text-gray-600 flex items-start gap-2">
                            <div className="w-1 h-1 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                            {challenge}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {/* Interview Preparation/Next Steps Accordion */}
              <div className="border border-gray-200 rounded-lg bg-white">
                <button
                  onClick={() => toggleAISubsection('interviewPrep')}
                  className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-blue-600" />
                    <div>
                      <h4 className="font-medium text-gray-900 text-sm">
                        {application.status === 'interviewing' ? 'Interview Preparation' : 'Next Steps'}
                      </h4>
                      <p className="text-xs text-gray-600">
                        {application.status === 'interviewing' 
                          ? 'Technical questions, cultural prep, salary negotiation'
                          : aiInsights.nextSteps ? `Timeline: ${aiInsights.nextSteps.timeframe}` : 'Recommended actions and timeline'}
                      </p>
                    </div>
                  </div>
                  {expandedSections.interviewPrep ? (
                    <Minus className="w-4 h-4 text-gray-500" />
                  ) : (
                    <Plus className="w-4 h-4 text-gray-500" />
                  )}
                </button>
                {expandedSections.interviewPrep && (
                  <div className="px-3 pb-3 border-t border-gray-200 bg-blue-50 rounded-b-lg space-y-3">
                    {application.status === 'interviewing' && aiInsights.interviewPreparation ? (
                      <>
                        <div className="mt-3">
                          <h5 className="font-medium text-gray-800 text-xs mb-2">Likely Interview Questions</h5>
                          <ul className="space-y-1">
                            {aiInsights.interviewPreparation.likelyQuestions.map((question, index) => (
                              <li key={index} className="text-xs text-gray-600 flex items-start gap-2">
                                <div className="w-1 h-1 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                                {question}
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <h5 className="font-medium text-gray-800 text-xs mb-2">Technical Focus Areas</h5>
                          <ul className="space-y-1">
                            {aiInsights.interviewPreparation.technicalFocus.map((focus, index) => (
                              <li key={index} className="text-xs text-gray-600 flex items-start gap-2">
                                <div className="w-1 h-1 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                                {focus}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h5 className="font-medium text-gray-800 text-xs mb-2">Cultural Preparation</h5>
                          <ul className="space-y-1">
                            {aiInsights.interviewPreparation.culturalPreparation.map((prep, index) => (
                              <li key={index} className="text-xs text-gray-600 flex items-start gap-2">
                                <div className="w-1 h-1 bg-purple-500 rounded-full mt-2 flex-shrink-0" />
                                {prep}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </>
                    ) : aiInsights.nextSteps ? (
                      <div className="mt-3">
                        <h5 className="font-medium text-gray-800 text-xs mb-2">Recommended Actions</h5>
                        <ul className="space-y-1">
                          {aiInsights.nextSteps.actions.map((action, index) => (
                            <li key={index} className="text-xs text-gray-600 flex items-start gap-2">
                              <div className="w-1 h-1 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                              {action}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {/* Salary Insights for interviewing and offered status */}
                    {(application.status === 'interviewing' || application.status === 'offer_received') && aiInsights.salaryInsights && (
                      <div className="bg-green-100 border border-green-200 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <Euro className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <h5 className="font-medium text-green-900 text-xs mb-1">Salary Insights</h5>
                            <p className="text-xs text-green-700 mb-2">
                              Market Range: <strong>{aiInsights.salaryInsights.marketRange}</strong> | 
                              Position: <strong>{aiInsights.salaryInsights.yourPosition}</strong>
                            </p>
                            <ul className="space-y-1">
                              {aiInsights.salaryInsights.tips.map((tip, index) => (
                                <li key={index} className="text-xs text-green-700 flex items-start gap-2">
                                  <div className="w-1 h-1 bg-green-600 rounded-full mt-2 flex-shrink-0" />
                                  {tip}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Job Details */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Job Details</h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Salary Range</label>
                <div className="flex items-center gap-1 mt-1">
                  <Euro className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-900">{job?.salary || application?.salary || 'Not specified'}</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Job Type</label>
                <div className="flex items-center gap-1 mt-1">
                  <Video className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-900">{job?.type || 'Full-time'}</span>
                </div>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-600">Description</label>
              <p className="text-sm text-gray-900 mt-1 leading-relaxed">
                {job?.description || 'A challenging role that offers excellent growth opportunities in a dynamic work environment.'}
              </p>
            </div>

            {job?.requirements && (
              <div>
                <label className="text-sm font-medium text-gray-600">Requirements</label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(() => {
                    // Ensure requirements is an array
                    const requirements = Array.isArray(job.requirements)
                      ? job.requirements
                      : typeof job.requirements === 'string' && job.requirements.trim() !== ''
                        ? job.requirements.split(/\r?\n|,/) // split by newline or comma
                        : [];
                    
                    return requirements.slice(0, 6).map((req, index) => (
                      <Badge key={index} variant="outline" size="sm">
                        {req.trim()}
                      </Badge>
                    ));
                  })()}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Application Status Details */}
        {application.status === 'interviewing' && application.interview && (
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Interview Information</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Upcoming Interview</p>
                  <p className="text-sm text-blue-700">{formatInterviewDateTime(application.interview)}</p>
                  {application.interview.duration && (
                    <p className="text-xs text-blue-600 mt-1">
                      Duration: {application.interview.duration} minutes
                    </p>
                  )}
                  {application.interview.location && application.interview.format !== 'video' && (
                    <p className="text-xs text-blue-600">
                      Location: {application.interview.location}
                    </p>
                  )}
                </div>
              </div>
              
              {application.interview.meetingLink && application.interview.format === 'video' && (
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                  <MessageCircle className="w-5 h-5 text-green-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-900">Meeting Link Available</p>
                    <p className="text-xs text-green-700 truncate">{application.interview.meetingLink}</p>
                  </div>
                  <Button variant="success" size="sm" onClick={handleJoinInterview}>
                    Join Now
                  </Button>
                </div>
              )}
              
              {application.interview.interviewer && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="relative">
                    {application.interview.interviewer.avatar ? (
                      <img
                        src={application.interview.interviewer.avatar}
                        alt={application.interview.interviewer.name}
                        className="w-10 h-10 rounded-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                        application.interview.interviewer.avatar ? 'hidden' : 'flex'
                      }`}
                    >
                      {application.interview.interviewer.name ? getInitials(application.interview.interviewer.name) : '?'}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Interviewer: {application.interview.interviewer.name}
                    </p>
                    <p className="text-xs text-gray-600">
                      {application.interview.interviewer.title || 'Hiring Manager'}
                    </p>
                  </div>
                </div>
              )}
              
              {application.interview.instructions && (
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <p className="text-sm font-medium text-yellow-900 mb-1">Instructions</p>
                  <p className="text-xs text-yellow-700">{application.interview.instructions}</p>
                </div>
              )}
              
              <Button 
                variant="primary" 
                size="sm" 
                className="w-full"
                disabled={!application.interview}
                onClick={handleJoinInterview}
              >
                {application.interview ? 'Join Interview' : 'Interview Not Scheduled'}
              </Button>
            </div>
          </Card>
        )}

        {application.status === 'offer_received' && (
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Offer Details</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                <Award className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-900">Congratulations!</p>
                  <p className="text-sm text-green-700">You have received an offer for this position</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="success" size="sm">Accept Offer</Button>
                <Button variant="outline" size="sm">View Details</Button>
              </div>
            </div>
          </Card>
        )}

        {/* Company Information */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Company Information</h3>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-600">About Company</label>
              <p className="text-sm text-gray-900 mt-1">
                {job?.companyDescription || 'A leading technology company focused on innovation and excellence in the industry.'}
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Company Size</label>
                <div className="flex items-center gap-1 mt-1">
                  <Users className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-900">{job?.companySize || '100-500 employees'}</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Industry</label>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-900">{job?.industry || 'Technology'}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Application Statistics */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Application Insights</h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-lg font-bold text-blue-600">{application.matchScore || 92}%</div>
                <div className="text-xs text-blue-600">Match Score</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-lg font-bold text-green-600">
                  {(() => {
                    const daysSinceApplied = Math.floor((new Date() - new Date(application.appliedDate)) / (1000 * 60 * 60 * 24));
                    return daysSinceApplied > 0 ? `${daysSinceApplied}d` : 'Today';
                  })()}
                </div>
                <div className="text-xs text-green-600">Days Applied</div>
              </div>
            </div>
            
            {application.ranking && (
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-900">
                    You're ranked #{application.ranking} out of {application.totalApplicants || 50} applicants
                  </span>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Documents */}
        {application.documents && (
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Submitted Documents</h3>
            <div className="space-y-2">
              {application.documents.resumeId && (() => {
                const resumeDoc = getDocumentById(application.documents.resumeId);
                return resumeDoc ? (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-500" />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-gray-900 block truncate">
                          {resumeDoc.file_name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {Math.round(resumeDoc.file_size / 1024)} KB
                        </span>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDownloadDocument(application.documents.resumeId, 'resume')}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-900">Resume (Document not found)</span>
                    </div>
                  </div>
                );
              })()}
              
              {application.documents.coverLetterId && (() => {
                const coverLetterDoc = getDocumentById(application.documents.coverLetterId);
                return coverLetterDoc ? (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-500" />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-gray-900 block truncate">
                          {coverLetterDoc.file_name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {Math.round(coverLetterDoc.file_size / 1024)} KB
                        </span>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDownloadDocument(application.documents.coverLetterId, 'cover_letter')}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-900">Cover Letter (Document not found)</span>
                    </div>
                  </div>
                );
              })()}
              
              {application.documents.additionalDocumentIds && application.documents.additionalDocumentIds.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-medium text-gray-600 mb-2">
                    Additional Documents ({application.documents.additionalDocumentIds.length})
                  </div>
                  {application.documents.additionalDocumentIds.map((docId, index) => {
                    const additionalDoc = getDocumentById(docId);
                    return additionalDoc ? (
                      <div key={docId} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <FileText className="w-3 h-3 text-gray-500" />
                          <div className="flex-1 min-w-0">
                            <span className="text-sm text-gray-900 truncate">
                              {additionalDoc.file_name}
                            </span>
                            <span className="text-xs text-gray-500 block">
                              {Math.round(additionalDoc.file_size / 1024)} KB
                            </span>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDownloadDocument(docId, 'additional')}
                        >
                          <Download className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <div key={docId} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <FileText className="w-3 h-3 text-gray-500" />
                          <span className="text-sm text-gray-900">Additional Document {index + 1} (Not found)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Job-Specific Information */}
        {application.jobSpecific && (
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Application Details</h3>
            <div className="space-y-3">
              {application.jobSpecific.availabilityDate && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Availability Date</label>
                  <p className="text-sm text-gray-900 mt-1">
                    {new Date(application.jobSpecific.availabilityDate).toLocaleDateString()}
                  </p>
                </div>
              )}
              {application.jobSpecific.salaryExpectation && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Salary Expectation</label>
                  <p className="text-sm text-gray-900 mt-1">{application.jobSpecific.salaryExpectation}</p>
                </div>
              )}
              {application.jobSpecific.visaStatus && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Visa Status</label>
                  <p className="text-sm text-gray-900 mt-1">{application.jobSpecific.visaStatus}</p>
                </div>
              )}
              {application.jobSpecific.motivation && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Motivation</label>
                  <p className="text-sm text-gray-900 mt-1 leading-relaxed">{application.jobSpecific.motivation}</p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Custom Questions */}
        {application.customQuestions && Object.keys(application.customQuestions).length > 0 && (
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Additional Questions</h3>
            <div className="space-y-3">
              {Object.entries(application.customQuestions).map(([questionId, answer]) => (
                <div key={questionId}>
                  <label className="text-sm font-medium text-gray-600">{questionId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</label>
                  <p className="text-sm text-gray-900 mt-1">{answer}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Cover Note */}
        {application.coverNote && (
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Cover Note</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-700 whitespace-pre-wrap text-sm">{application.coverNote}</p>
            </div>
          </Card>
        )}
      </div>

      {/* Footer Actions */}
      <div className="flex-shrink-0 p-6 border-t border-gray-200 bg-gray-50">
        <div className="flex gap-3">
          <Button variant="outline" size="sm" className="flex-1">
            <MessageCircle className="w-4 h-4 mr-2" />
            Message HR
          </Button>
          <Button variant="primary" size="sm" className="flex-1">
            <Eye className="w-4 h-4 mr-2" />
            View Full Details
          </Button>
          <Button 
            variant={application.interview ? "success" : "outline"} 
            size="sm" 
            className="flex-1"
            disabled={!application.interview}
            onClick={handleJoinInterview}
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            {application.interview ? 'Join Interview' : 'Join Meet'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ApplicationDetailPanel; 
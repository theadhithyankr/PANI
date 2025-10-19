import React, { useState, useEffect } from 'react';
import { FileText, Eye, Download, MessageCircle, X, Target, TrendingUp, Clock, CheckCircle, Calendar } from 'lucide-react';
import Card from '../../common/Card';
import Button from '../../common/Button';
import Badge from '../../common/Badge';
import useDocumentsStore from '../../../store/documentsStore';
import { useAuth } from '../../../hooks/common/useAuth';
import JobDetailModal from '../JobDetailModal';
import { useToast } from '../../../hooks/common/useToast';

const AppliedState = ({ application, job, onWithdraw }) => {
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showJobDetailModal, setShowJobDetailModal] = useState(false);
  const { user } = useAuth();
  const { getDocumentUrl, documents, fetchDocuments } = useDocumentsStore();
  const { error: showError } = useToast();

  // Fetch documents when component mounts
  useEffect(() => {
    if (user?.id) {
      fetchDocuments(user.id);
    }
  }, [user?.id, fetchDocuments]);

  // Get document by ID from the store
  const getDocumentById = (documentId) => {
    console.log('Looking for document ID:', documentId);
    console.log('Available documents:', documents);
    return documents.find(doc => doc.id === documentId);
  };

  const handleWithdrawApplication = () => {
    console.log('Withdraw application:', application.id);
    setShowWithdrawModal(false);
    if (onWithdraw) {
      onWithdraw();
    }
  };



  const handleViewJobPosting = () => {
    setShowJobDetailModal(true);
  };

  const handleDownloadDocument = async (docId) => {
    try {
      const url = await getDocumentUrl(docId);
      const doc = getDocumentById(docId);
      const link = document.createElement('a');
      link.href = url;
      link.download = doc?.file_name || 'document';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading document:', error);
      showError('Failed to download document. Please try again.');
    }
  };

  // Calculate document count
  const documentCount = [
    application.documents?.resumeId,
    application.documents?.coverLetterId,
    ...(application.documents?.additionalDocumentIds || [])
  ].filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Application Summary */}
      <Card>
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Application Summary</h3>
          <Badge variant="info">Submitted</Badge>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <h4 className="font-medium text-gray-900">Documents Submitted</h4>
            <p className="text-sm text-gray-600 mt-1">
              {documentCount} files uploaded
            </p>
          </div>
          
                    <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Target className="w-6 h-6 text-green-600" />
            </div>
            <h4 className="font-medium text-gray-900">Match Score</h4>
            <p className="text-sm text-gray-600 mt-1">
              {application.matchScore}% compatibility
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <h4 className="font-medium text-gray-900">Response Time</h4>
            <p className="text-sm text-gray-600 mt-1">
              {(() => {
                const avgResponseTime = application.estimatedTimeline || 'ASAP';
                return avgResponseTime;
              })()}
            </p>
          </div>
        </div>
      </Card>

      {/* Submitted Documents */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Submitted Documents</h3>
        <div className="space-y-3">
          {/* Resume */}
          {application.documents?.resumeId && (() => {
            const resumeDoc = getDocumentById(application.documents.resumeId);
            return resumeDoc ? (
              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <div>
                    <h4 className="font-medium text-gray-900">{resumeDoc.file_name}</h4>
                    <p className="text-sm text-gray-600">
                      {Math.round(resumeDoc.file_size / 1024)} KB • Uploaded {new Date(resumeDoc.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleDownloadDocument(application.documents.resumeId)}>
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <div>
                    <h4 className="font-medium text-gray-900">Resume</h4>
                    <p className="text-sm text-gray-600">
                      {documents.length === 0 ? 'Loading documents...' : 'Document submitted with application'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="success" size="sm">Submitted</Badge>
                </div>
              </div>
            );
          })()}

          {/* Cover Letter */}
          {application.documents?.coverLetterId && (() => {
            const coverLetterDoc = getDocumentById(application.documents.coverLetterId);
            return coverLetterDoc ? (
              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <div>
                    <h4 className="font-medium text-gray-900">{coverLetterDoc.file_name}</h4>
                    <p className="text-sm text-gray-600">
                      {Math.round(coverLetterDoc.file_size / 1024)} KB • Uploaded {new Date(coverLetterDoc.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleDownloadDocument(application.documents.coverLetterId)}>
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <div>
                    <h4 className="font-medium text-gray-900">Cover Letter</h4>
                    <p className="text-sm text-gray-600">
                      {documents.length === 0 ? 'Loading documents...' : 'Document submitted with application'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="success" size="sm">Submitted</Badge>
                </div>
              </div>
            );
          })()}

          {/* Additional Documents */}
          {application.documents?.additionalDocumentIds && application.documents.additionalDocumentIds.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-700 mb-2">
                Additional Documents ({application.documents.additionalDocumentIds.length})
              </div>
              {application.documents.additionalDocumentIds.map((docId, index) => {
                const additionalDoc = getDocumentById(docId);
                return additionalDoc ? (
                  <div key={docId} className="flex items-center justify-between p-2 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <div>
                        <h4 className="font-medium text-gray-900 text-sm">{additionalDoc.file_name}</h4>
                        <p className="text-xs text-gray-600">
                          {Math.round(additionalDoc.file_size / 1024)} KB • Uploaded {new Date(additionalDoc.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleDownloadDocument(docId)}>
                        <Download className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div key={docId} className="flex items-center justify-between p-2 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <div>
                        <h4 className="font-medium text-gray-900 text-sm">Additional Document {index + 1}</h4>
                        <p className="text-xs text-gray-600">
                          {documents.length === 0 ? 'Loading...' : 'Document submitted with application'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="success" size="sm">Submitted</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Fallback when no documents are submitted */}
          {(!application.documents?.resumeId && !application.documents?.coverLetterId && 
            (!application.documents?.additionalDocumentIds || application.documents.additionalDocumentIds.length === 0)) && (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No documents were submitted with this application.</p>
              <p className="text-sm text-gray-500 mt-1">You can update your documents using the button below.</p>
            </div>
          )}
        </div>
        

      </Card>

      {/* Job Posting Recap */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Requirements Match</h3>
        
        <div className="space-y-4">
          {/* Matched Skills */}
          <div>
            <h4 className="font-medium text-gray-900 mb-2 flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
              Your Matching Skills
            </h4>
            <div className="flex flex-wrap gap-2">
              {application.jobMatchDetails?.matchedSkills?.map((skill) => (
                <Badge key={skill} variant="success" size="sm">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>

          {/* Skills to Develop */}
          {application.jobMatchDetails?.missingSkills?.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                <TrendingUp className="w-5 h-5 text-yellow-500 mr-2" />
                Skills to Develop
              </h4>
              <div className="flex flex-wrap gap-2">
                {application.jobMatchDetails.missingSkills.map((skill) => (
                  <Badge key={skill} variant="warning" size="sm">
                    {skill}
                  </Badge>
                ))}
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Consider developing these skills to strengthen future applications
              </p>
            </div>
          )}

          {/* Job Details */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3">Position Details</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Salary Range:</span>
                <span className="font-medium">{job.salary || 'Not specified'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Type:</span>
                <span className="font-medium">{job.jobType || 'Not specified'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Remote:</span>
                <span className="font-medium">{job.isRemote ? 'Yes' : 'No'}</span>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-3"
              onClick={handleViewJobPosting}
            >
              View Full Job Posting
            </Button>
          </div>
        </div>
      </Card>

      {/* Your Answers */}
      {application.submittedAnswers && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Application Answers</h3>
          <div className="space-y-4">
            {Object.entries(application.submittedAnswers).map(([key, value]) => (
              <div key={key}>
                <dt className="text-sm font-medium text-gray-600 mb-1">
                  {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </dt>
                <dd className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                  {value}
                </dd>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* What's Next */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">What's Next?</h3>
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <Clock className="w-5 h-5 text-blue-500 mt-0.5" />
            <div>
              <h4 className="font-medium text-gray-900">Application Review</h4>
              <p className="text-sm text-gray-600">
                Your application will be reviewed by the hiring team.
              </p>
            </div>
          </div>
          

          
          <div className="flex items-start space-x-3">
            <MessageCircle className="w-5 h-5 text-purple-500 mt-0.5" />
            <div>
              <h4 className="font-medium text-gray-900">Stay in Touch</h4>
              <p className="text-sm text-gray-600">
                We'll notify you of any updates. You can also message the recruiter anytime.
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <Calendar className="w-5 h-5 text-indigo-500 mt-0.5" />
            <div>
              <h4 className="font-medium text-gray-900">Application Timeline</h4>
              <p className="text-sm text-gray-600">
                Applied {new Date(application.appliedDate).toLocaleDateString()} • 
                {(() => {
                  const daysSinceApplied = Math.floor((new Date() - new Date(application.appliedDate)) / (1000 * 60 * 60 * 24));
                  return daysSinceApplied > 0 ? ` ${daysSinceApplied} days ago` : ' Today';
                })()}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Action Panel */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <Button variant="outline" onClick={() => setShowWithdrawModal(true)} className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400">
          <X className="w-4 h-4 mr-2" />
          Withdraw Application
        </Button>
      </div>

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
                  <Button variant="primary" onClick={handleWithdrawApplication} className="flex-1 bg-red-600 hover:bg-red-700">
                    Withdraw
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Job Detail Modal */}
      <JobDetailModal
        job={job}
        isOpen={showJobDetailModal}
        onClose={() => setShowJobDetailModal(false)}
        hasApplied={true}
        userSkills={application.jobMatchDetails?.matchedSkills || []}
      />
    </div>
  );
};

export default AppliedState;

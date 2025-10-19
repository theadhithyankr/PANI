import React from 'react';
import { 
  Building,
  MapPin,
  Clock,
  DollarSign,
  Users,
  CheckCircle,
  Star,
  Calendar,
  Eye,
  FileText,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

const JobDetailStep = ({ jobData, applicationData, isInvitation = false, onAcceptInvitation, onDeclineInvitation, interviewDetails = null }) => {
  
  return (
    <div className="space-y-8">
      {/* Application Status Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {isInvitation ? 'Job Invitation' : 'Your Application Status'}
            </h2>
            <p className="text-gray-600">
              {isInvitation 
                ? `Invited on ${new Date(applicationData.appliedDate).toLocaleDateString()}`
                : `Applied on ${new Date(applicationData.appliedDate).toLocaleDateString()}`
              }
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              applicationData.status === 'applied'
                ? 'bg-blue-100 text-blue-800'
                : applicationData.status === 'under_review' 
                ? 'bg-yellow-100 text-yellow-800'
                : applicationData.status === 'interviewing'
                ? 'bg-blue-100 text-blue-800'
                : applicationData.status === 'offer_received'
                ? 'bg-green-100 text-green-800'
                : applicationData.status === 'invited'
                ? 'bg-indigo-100 text-indigo-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {applicationData.status === 'applied' ? 'Applied' : 
               applicationData.status === 'invited' ? 'Invited' :
               applicationData.status.replace('_', ' ')}
            </span>
            {applicationData.matchScore && (
              <div className="flex items-center bg-violet-100 text-violet-800 px-2 py-1 rounded-full text-sm font-medium">
                <Star className="h-3 w-3 mr-1" />
                {applicationData.matchScore}% match
              </div>
            )}
          </div>
        </div>
        
        {isInvitation && (
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-6 border-2 border-indigo-200">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                  <Star className="h-5 w-5 text-indigo-600" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-indigo-900 mb-2">
                  {applicationData?.status === 'invited' ? '🎉 You\'ve been invited to interview!' : 
                   applicationData?.status === 'accepted' ? '✅ Invitation Accepted - Waiting for Interview Schedule' :
                   applicationData?.status === 'interviewing' ? '✅ Interview Scheduled' :
                   '📋 Invitation Details'}
                </h3>
                <p className="text-indigo-700 mb-3">
                  {applicationData?.status === 'invited' ? 
                    'The employer has reviewed your profile and would like to invite you for an interview. You must accept or decline this invitation to proceed further.' :
                    applicationData?.status === 'accepted' ?
                    'You have accepted this invitation! The employer will now schedule your interview. You will be notified once the interview details are available.' :
                    applicationData?.status === 'interviewing' ?
                    'Your interview has been scheduled. Check the Interviewing tab for details.' :
                    'Invitation details and next steps.'}
                </p>
            
            {/* Interview Details from response */}
            {interviewDetails && (
              <div className="mt-3 p-3 bg-white rounded border border-indigo-200">
                <p className="text-xs font-medium text-indigo-800 mb-2">Interview Details:</p>
                <div className="text-sm text-indigo-700 space-y-1">
                  <p><strong>Date:</strong> {interviewDetails.date}</p>
                  <p><strong>Time:</strong> {interviewDetails.time}</p>
                  <p><strong>Type:</strong> {interviewDetails.type}</p>
                  <p><strong>Format:</strong> {interviewDetails.format}</p>
                  <p><strong>Duration:</strong> {interviewDetails.duration} minutes</p>
                  {interviewDetails.location && interviewDetails.location !== 'TBD' && (
                    <p><strong>Location:</strong> {interviewDetails.location}</p>
                  )}
                  {interviewDetails.agenda && (
                    <p><strong>Agenda:</strong> {interviewDetails.agenda}</p>
                  )}
                </div>
              </div>
            )}
            
                {applicationData?.status === 'invited' && (
                  <div className="flex flex-col sm:flex-row gap-3 mt-4">
                    <button
                      onClick={onAcceptInvitation}
                      className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium text-base shadow-md hover:shadow-lg"
                    >
                      ✅ Accept Invitation
                    </button>
                    <button
                      onClick={onDeclineInvitation}
                      className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium text-base shadow-md hover:shadow-lg"
                    >
                      ❌ Decline Invitation
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {isInvitation && applicationData.status === 'declined' && (
          <div className="bg-red-50 rounded-lg p-6 border-2 border-red-200">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-red-900 mb-2">Invitation Declined</h3>
                <p className="text-red-700 mb-3">
                  You have declined this interview invitation. The application process has been terminated.
                </p>
                <div className="bg-white rounded-lg p-4 border border-red-200">
                  <p className="text-sm text-red-600">
                    <strong>Note:</strong> If you change your mind, you can contact the employer directly or apply for other positions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {!isInvitation && applicationData.lastUpdate && (
          <div className="bg-violet-50 rounded-lg p-4">
            <p className="text-sm font-medium text-violet-900">Latest Update</p>
            <p className="text-violet-700 mt-1">{applicationData.lastUpdate}</p>
            <p className="text-xs text-violet-600 mt-2">
              Updated {new Date(applicationData.lastUpdateDate).toLocaleDateString()}
            </p>
          </div>
        )}
      </div>

      {/* Job Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{jobData.title}</h2>
          <div className="flex items-center space-x-4 text-gray-600">
            <span className="flex items-center">
              <Building className="h-4 w-4 mr-2" />
              {jobData.company}
            </span>
            <span className="flex items-center">
              <MapPin className="h-4 w-4 mr-2" />
              {jobData.location}
            </span>
            <span className="flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              {jobData.type}
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-violet-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-violet-700">Salary Range</span>
              <DollarSign className="h-4 w-4 text-violet-600" />
            </div>
            <p className="text-lg font-semibold text-violet-900">{jobData.salary}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-green-700">Total Applicants</span>
              <Users className="h-4 w-4 text-green-600" />
            </div>
            <p className="text-lg font-semibold text-green-900">{jobData.totalApplicants}</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-700">Application Deadline</span>
              <Calendar className="h-4 w-4 text-blue-600" />
            </div>
            <p className="text-lg font-semibold text-blue-900">
              {new Date(jobData.deadline).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Job Description */}
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Description</h3>
        <p className="text-gray-600 mb-6">{jobData.description}</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Requirements</h4>
            <ul className="space-y-2">
              {jobData.requirements.map((req, index) => (
                <li key={index} className="flex items-center text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  {req}
                </li>
              ))}
            </ul>
          </div>
          {Array.isArray(jobData.benefits) && jobData.benefits.filter(b => String(b).trim().length > 0).length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Benefits</h4>
              <ul className="space-y-2">
                {jobData.benefits
                  .filter(b => String(b).trim().length > 0)
                  .map((benefit, index) => (
                    <li key={index} className="flex items-center text-gray-600">
                      <Star className="h-4 w-4 text-violet-500 mr-2 flex-shrink-0" />
                      {benefit}
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Your Application or Invitation Details */}
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {isInvitation ? 'Invitation Details' : 'Your Application'}
        </h3>
        
        {isInvitation ? (
          <div className="bg-indigo-50 rounded-lg p-6">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <Star className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <h4 className="font-medium text-indigo-900 mb-2">You've been selected!</h4>
                <p className="text-indigo-700 text-sm mb-4">
                  The employer has reviewed your profile and would like to invite you for an interview. 
                  This is a great opportunity to discuss the role and learn more about the company.
                </p>
                <div className="bg-white rounded-lg p-4">
                  <p className="text-sm text-gray-600">
                    <strong>Next steps:</strong> If you accept this invitation, an interview will be automatically scheduled for you. 
                    You'll receive the interview details and can prepare accordingly.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Cover Letter</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-600 text-sm">{applicationData.coverLetter}</p>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Documents Submitted</h4>
              <div className="space-y-2">
                {applicationData.documents.map((doc, index) => (
                  <div key={doc.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <div>
                        <span className="text-sm text-gray-900">{doc.name}</span>
                        {doc.size && (
                          <p className="text-xs text-gray-500">
                            {(doc.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {doc.isVerified !== undefined && (
                        <div className="flex items-center">
                          {doc.isVerified ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" title="Verified" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-yellow-500" title="Pending verification" />
                          )}
                        </div>
                      )}
                      {doc.id !== 'placeholder' && (
                        <button className="text-violet-600 hover:text-violet-800 text-sm">
                          <Eye className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobDetailStep;

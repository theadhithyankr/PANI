import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  X, 
  Calendar, 
  Clock, 
  Video, 
  MapPin, 
  Users, 
  FileText, 
  MessageCircle, 
  Star, 
  ExternalLink,
  Edit,
  Trash2,
  User,
  Briefcase,
  Building,
  MapPin as LocationIcon,
  Euro,
  Languages,
  Award,
  GraduationCap,
  Phone,
  Mail,
  Globe
} from 'lucide-react';
import Button from '../common/Button';
import Badge from '../common/Badge';
import Card from '../common/Card';
import useInterviews from '../../hooks/employer/useInterviews';
import { useJobSeekerProfileViewer } from '../../hooks/employer/useJobSeekerProfileViewer';
import { useToast } from '../../hooks/common/useToast';
import { useJobPost } from '../../hooks/employer/useJobPost';
import ApplicationStatusManager from './ApplicationStatusManager';

const InterviewDetailModal = ({ interview, isOpen, onClose, onReschedule, onDelete, onStatusUpdated }) => {
  const { t } = useTranslation('employer');
  const [activeTab, setActiveTab] = useState('details');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [currentInterview, setCurrentInterview] = useState(interview);
  
  // Hooks
  const { updateInterviewStatus, deleteInterview } = useInterviews();
  const { profileData, loading: profileLoading, fetchJobSeekerProfile, downloadResume, clearProfile } = useJobSeekerProfileViewer();
  const { showToast } = useToast();
  const { listJobs } = useJobPost();

  // Update current interview when prop changes
  React.useEffect(() => {
    setCurrentInterview(interview);
  }, [interview]);

  // Transform interview data to include candidate information
  const transformedInterview = React.useMemo(() => {
    if (!currentInterview) return null;
    
    return {
      ...currentInterview,
      // Extract applicantId from nested structure
      applicantId: currentInterview.seeker_id,
      // Extract candidate information
      candidateName: currentInterview.seeker_profile?.full_name || 'Unknown Candidate',
      candidateAvatar: currentInterview.seeker_profile?.avatar_url,
      // Extract job information
      jobTitle: currentInterview.job?.title || 'Unknown Position',
      companyName: currentInterview.job?.companies?.name || 'Unknown Company',
    };
  }, [currentInterview]);

  // Fetch job seeker profile when candidate tab is accessed and interview is available
  useEffect(() => {
    if (transformedInterview && activeTab === 'candidate' && transformedInterview.applicantId && !profileData) {
      fetchJobSeekerProfile(transformedInterview.applicantId);
    }
  }, [transformedInterview, activeTab, transformedInterview?.applicantId, profileData, fetchJobSeekerProfile]);

  // Clear profile data when modal closes
  useEffect(() => {
    if (!isOpen) {
      clearProfile();
    }
  }, [isOpen, clearProfile]);

  // Load jobs when modal opens to ensure they're available for ApplicationStatusManager
  useEffect(() => {
    if (isOpen) {
      listJobs().catch(err => {
        console.error('Error loading jobs:', err);
      });
      // Reset to details tab when modal opens
      setActiveTab('details');
    }
  }, [isOpen, listJobs]);

  if (!isOpen || !transformedInterview) return null;

  const tabs = [
    { id: 'details', label: t('interviewDetailModal.tabs.details') },
    { id: 'candidate', label: t('interviewDetailModal.tabs.candidate') },
    { id: 'feedback', label: t('interviewDetailModal.tabs.feedback') },
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

  const getTypeColor = (type) => {
    switch (type) {
      case '1st_interview': return 'blue';
      case 'technical': return 'purple';
      case 'hr_interview': return 'green';
      case 'final': return 'orange';
      default: return 'gray';
    }
  };

  const getApplicationStatusColor = (status) => {
    switch (status) {
      case 'interviewing': return 'info';
      case 'offered': return 'success';
      case 'hired': return 'success';
      case 'rejected': return 'error';
      case 'withdrawn': return 'warning';
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

  const formatDateTime = (isoString) => {
    if (!isoString) return 'Not set';
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleCancelInterview = async () => {
    if (window.confirm('Are you sure you want to cancel this interview? This action cannot be undone.')) {
      try {
        setIsUpdatingStatus(true);
        await updateInterviewStatus(transformedInterview.id, 'cancelled');
        showToast('Interview cancelled successfully', 'success');
        onClose();
      } catch (error) {
        console.error('Error cancelling interview:', error);
        showToast('Failed to cancel interview', 'error');
      } finally {
        setIsUpdatingStatus(false);
      }
    }
  };

  const handleDeleteInterview = async () => {
    if (window.confirm('Are you sure you want to delete this interview? This action cannot be undone.')) {
      try {
        setIsUpdatingStatus(true);
        await deleteInterview(transformedInterview.id);
        showToast('Interview deleted successfully', 'success');
        if (onDelete) onDelete(transformedInterview);
        onClose();
      } catch (error) {
        console.error('Error deleting interview:', error);
        showToast('Failed to delete interview', 'error');
      } finally {
        setIsUpdatingStatus(false);
      }
    }
  };

  const handleViewResume = async (document) => {
    try {
      await downloadResume(document);
    } catch (error) {
      console.error('Error viewing resume:', error);
      showToast('Failed to open resume', 'error');
    }
  };

  const handleApplicationStatusUpdated = (updatedApplication) => {
    console.log('Application status updated:', updatedApplication);
    // Update the current interview with the new status if it matches
    if (updatedApplication && currentInterview) {
      setCurrentInterview(prev => ({
        ...prev,
        status: updatedApplication.status || prev.status
      }));
    }
    // Notify parent component to refresh the interviews list
    if (onStatusUpdated) {
      onStatusUpdated();
    }
  };

  const renderDetails = () => (
    <div className="space-y-6">
      {/* Interview Overview */}
      <Card>
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-semibold text-gray-900 capitalize">
                  {transformedInterview.interview_type?.replace('_', ' ')} Interview
                </h3>
                <Badge variant={getTypeColor(transformedInterview.interview_type)} size="sm">
                  {transformedInterview.interview_type?.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
              <p className="text-gray-600">
                {transformedInterview.candidateName} • {transformedInterview.jobTitle}
              </p>
              {transformedInterview.companyName && (
                <p className="text-sm text-gray-500">{transformedInterview.companyName}</p>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge variant={getStatusColor(transformedInterview.status)} size="lg">
                Interview: {transformedInterview.status?.toUpperCase()}
              </Badge>
              {transformedInterview.application_status && (
                <Badge variant={getApplicationStatusColor(transformedInterview.application_status)} size="lg">
                  Candidate: {transformedInterview.application_status?.toUpperCase()}
                </Badge>
              )}
            </div>
          </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gray-500" />
              <div>
                <p className="font-medium text-gray-900">
                  {formatDateTime(transformedInterview.interview_date)}
                </p>
                <p className="text-sm text-gray-600">Interview Date & Time</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-gray-500" />
              <div>
                <p className="font-medium text-gray-900">
                  {transformedInterview.duration_minutes || 60} minutes
                </p>
                <p className="text-sm text-gray-600">Duration</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {transformedInterview.interview_format === 'video' ? (
                <Video className="w-5 h-5 text-gray-500" />
              ) : transformedInterview.interview_format === 'in_person' ? (
                <MapPin className="w-5 h-5 text-gray-500" />
              ) : (
                <Users className="w-5 h-5 text-gray-500" />
              )}
              <div>
                <p className="font-medium text-gray-900 capitalize">
                  {transformedInterview.interview_format?.replace('_', ' ')} Interview
                </p>
                <p className="text-sm text-gray-600">Format</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-gray-500" />
              <div>
                <p className="font-medium text-gray-900">{transformedInterview.candidateName}</p>
                <p className="text-sm text-gray-600">Candidate</p>
              </div>
            </div>

            {transformedInterview.jobTitle && (
              <div className="flex items-center gap-3">
                <Briefcase className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="font-medium text-gray-900">{transformedInterview.jobTitle}</p>
                  <p className="text-sm text-gray-600">Position</p>
                </div>
              </div>
            )}

            {transformedInterview.companyName && (
              <div className="flex items-center gap-3">
                <Building className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="font-medium text-gray-900">{transformedInterview.companyName}</p>
                  <p className="text-sm text-gray-600">Company</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Meeting Details */}
      {transformedInterview.interview_format === 'video' && (
        <Card>
          <h4 className="font-medium text-gray-900 mb-3">Video Meeting Details</h4>
          {transformedInterview.meeting_link ? (
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <p className="font-medium text-blue-900">Video Meeting Link</p>
                <p className="text-sm text-blue-700 break-all">{transformedInterview.meeting_link}</p>
              </div>
              <Button 
                variant="primary" 
                size="sm"
                onClick={() => window.open(transformedInterview.meeting_link, '_blank')}
              >
                <Video className="w-4 h-4 mr-2" />
                Join Meeting
              </Button>
            </div>
          ) : (
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-600">No meeting link provided yet</p>
            </div>
          )}
        </Card>
      )}

      {transformedInterview.interview_format === 'in_person' && transformedInterview.location && (
        <Card>
          <h4 className="font-medium text-gray-900 mb-3">Location Details</h4>
          <div className="flex items-start gap-3 mb-4">
            <MapPin className="w-5 h-5 text-gray-500 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">{transformedInterview.location}</p>
              <p className="text-sm text-gray-600">Meeting Location</p>
            </div>
          </div>
        </Card>
      )}

      {/* Additional Interviewers */}
      {transformedInterview.additional_interviewers && transformedInterview.additional_interviewers.length > 0 && (
        <Card>
          <h4 className="font-medium text-gray-900 mb-3">Additional Interviewers</h4>
          <div className="space-y-2">
            {transformedInterview.additional_interviewers.map((interviewerId, index) => (
              <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="text-gray-900">Interviewer ID: {interviewerId}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Agenda */}
      {transformedInterview.agenda && (
        <Card>
          <h4 className="font-medium text-gray-900 mb-3">Interview Agenda</h4>
          <div className="prose prose-sm max-w-none">
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {transformedInterview.agenda}
            </p>
          </div>
        </Card>
      )}

      {/* Notes */}
      {transformedInterview.notes && (
        <Card>
          <h4 className="font-medium text-gray-900 mb-3">Interview Notes</h4>
          <div className="prose prose-sm max-w-none">
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {transformedInterview.notes}
            </p>
          </div>
        </Card>
      )}
    </div>
  );

  const renderCandidate = () => (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center gap-4 mb-6">
          {transformedInterview.candidateAvatar ? (
            <img 
              src={transformedInterview.candidateAvatar} 
              alt={transformedInterview.candidateName}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
              <User className="w-8 h-8 text-gray-500" />
            </div>
          )}
          <div>
            <h3 className="text-xl font-semibold text-gray-900">{transformedInterview.candidateName}</h3>
            <p className="text-gray-600">Applying for {transformedInterview.jobTitle}</p>
            {profileData?.phone && (
              <div className="flex items-center gap-2 mt-1">
                <Phone className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">{profileData.phone}</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Application Details</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Application ID:</span>
                <span className="text-gray-900">{transformedInterview.application_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Job ID:</span>
                <span className="text-gray-900">{transformedInterview.job_id}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {profileLoading ? (
        <Card>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading candidate profile...</span>
          </div>
        </Card>
      ) : profileData ? (
        <>
          {/* Professional Summary */}
          {profileData.summary && (
            <Card>
              <h4 className="font-medium text-gray-900 mb-3">Professional Summary</h4>
              <p className="text-gray-700 leading-relaxed">{profileData.summary}</p>
            </Card>
          )}

          {/* Resume Documents */}
          {profileData.resumeDocuments && profileData.resumeDocuments.length > 0 && (
            <Card>
              <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Resume Documents
              </h4>
              <div className="space-y-3">
                {profileData.resumeDocuments.map((document, index) => (
                  <div key={document.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="font-medium text-gray-900">{document.file_name}</p>
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                          <span className="capitalize">{document.document_type}</span>
                          <span>{(document.file_size / 1024 / 1024).toFixed(2)} MB</span>
                          <span>Uploaded {new Date(document.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <Button 
                      variant="primary" 
                      size="sm"
                      onClick={() => handleViewResume(document)}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View Resume
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Basic Information */}
          <Card>
            <h4 className="font-medium text-gray-900 mb-4">Candidate Information</h4>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                {profileData.headline && (
                  <div className="flex items-start gap-3">
                    <Briefcase className="w-5 h-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">{profileData.headline}</p>
                      <p className="text-sm text-gray-600">Professional Headline</p>
                    </div>
                  </div>
                )}

                {profileData.experience_years !== null && (
                  <div className="flex items-start gap-3">
                    <Award className="w-5 h-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">{profileData.experience_years} years</p>
                      <p className="text-sm text-gray-600">Experience</p>
                    </div>
                  </div>
                )}

                {profileData.current_location && (
                  <div className="flex items-start gap-3">
                    <LocationIcon className="w-5 h-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">{profileData.current_location}</p>
                      <p className="text-sm text-gray-600">Current Location</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {profileData.target_salary_range && (
                  <div className="flex items-start gap-3">
                    <Euro className="w-5 h-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">
                        ${profileData.target_salary_range.min?.toLocaleString()} - ${profileData.target_salary_range.max?.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">Salary Range ({profileData.target_salary_range.currency})</p>
                    </div>
                  </div>
                )}

                {profileData.willing_to_relocate !== null && (
                  <div className="flex items-start gap-3">
                    <Globe className="w-5 h-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {profileData.willing_to_relocate ? 'Yes' : 'No'}
                      </p>
                      <p className="text-sm text-gray-600">Willing to Relocate</p>
                    </div>
                  </div>
                )}

                {profileData.relocation_timeline && (
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">{profileData.relocation_timeline}</p>
                      <p className="text-sm text-gray-600">Relocation Timeline</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Skills */}
          {profileData.skills && profileData.skills.length > 0 && (
            <Card>
              <h4 className="font-medium text-gray-900 mb-3">Skills</h4>
              <div className="flex flex-wrap gap-2">
                {profileData.skills.map((skill, index) => (
                  <Badge key={index} variant="secondary" size="sm">
                    {skill}
                  </Badge>
                ))}
              </div>
            </Card>
          )}

          {/* Languages */}
          {profileData.languages && profileData.languages.length > 0 && (
            <Card>
              <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <Languages className="w-5 h-5" />
                Languages
              </h4>
              <div className="space-y-2">
                {profileData.languages.map((language, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <span className="font-medium text-gray-900">{language.name}</span>
                    <Badge variant="outline" size="sm">
                      {language.proficiency}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Preferred Job Types */}
          {profileData.preferred_job_types && profileData.preferred_job_types.length > 0 && (
            <Card>
              <h4 className="font-medium text-gray-900 mb-3">Preferred Job Types</h4>
              <div className="flex flex-wrap gap-2">
                {profileData.preferred_job_types.map((jobType, index) => (
                  <Badge key={index} variant="outline" size="sm">
                    {jobType}
                  </Badge>
                ))}
              </div>
            </Card>
          )}

          {/* Preferred Locations */}
          {profileData.preferred_locations && profileData.preferred_locations.length > 0 && (
            <Card>
              <h4 className="font-medium text-gray-900 mb-3">Preferred Work Locations</h4>
              <div className="space-y-2">
                {profileData.preferred_locations.map((location, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <LocationIcon className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700">{location}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Cultural Preferences */}
          {profileData.cultural_preferences && Object.keys(profileData.cultural_preferences).length > 0 && (
            <Card>
              <h4 className="font-medium text-gray-900 mb-3">Cultural Preferences</h4>
              <div className="space-y-2 text-sm">
                {Object.entries(profileData.cultural_preferences).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-gray-600 capitalize">{key.replace('_', ' ')}:</span>
                    <span className="text-gray-900">{typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Resume Data */}
          {profileData.resumeData && (
            <>
              {/* Education */}
              {profileData.resumeData.education && profileData.resumeData.education.length > 0 && (
                <Card>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <GraduationCap className="w-5 h-5" />
                    Education
                  </h4>
                  <div className="space-y-4">
                    {profileData.resumeData.education.map((edu, index) => (
                      <div key={index} className="border-l-2 border-blue-200 pl-4">
                        <h5 className="font-medium text-gray-900">{edu.degree || edu.qualification}</h5>
                        <p className="text-gray-600">{edu.institution || edu.school}</p>
                        {edu.year && <p className="text-sm text-gray-500">{edu.year}</p>}
                        {edu.gpa && <p className="text-sm text-gray-500">GPA: {edu.gpa}</p>}
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Experience */}
              {profileData.resumeData.experience && profileData.resumeData.experience.length > 0 && (
                <Card>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <Briefcase className="w-5 h-5" />
                    Work Experience
                  </h4>
                  <div className="space-y-4">
                    {profileData.resumeData.experience.map((exp, index) => (
                      <div key={index} className="border-l-2 border-green-200 pl-4">
                        <h5 className="font-medium text-gray-900">{exp.title || exp.position}</h5>
                        <p className="text-gray-600">{exp.company}</p>
                        {exp.duration && <p className="text-sm text-gray-500">{exp.duration}</p>}
                        {exp.description && (
                          <p className="text-sm text-gray-700 mt-1 leading-relaxed">{exp.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Certifications */}
              {profileData.resumeData.certifications && profileData.resumeData.certifications.length > 0 && (
                <Card>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    Certifications
                  </h4>
                  <div className="space-y-2">
                    {profileData.resumeData.certifications.map((cert, index) => (
                      <div key={index} className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">{cert.name || cert.certification}</p>
                          {cert.issuer && <p className="text-sm text-gray-600">{cert.issuer}</p>}
                        </div>
                        {cert.date && <p className="text-sm text-gray-500">{cert.date}</p>}
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </>
          )}
        </>
      ) : (
        <>
          {/* Fallback: Show basic info from transformedInterview and seeker_profile */}
          <Card>
            <h4 className="font-medium text-gray-900 mb-4">Candidate Information</h4>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">{transformedInterview.candidateName}</p>
                    <p className="text-sm text-gray-600">Candidate Name</p>
                  </div>
                </div>
                {transformedInterview.seeker_profile?.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">{transformedInterview.seeker_profile.phone}</p>
                      <p className="text-sm text-gray-600">Phone Number</p>
                    </div>
                  </div>
                )}
                {transformedInterview.seeker_profile?.email_verified !== undefined && (
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {transformedInterview.seeker_profile.email_verified ? 'Verified' : 'Not Verified'}
                      </p>
                      <p className="text-sm text-gray-600">Email Status</p>
                    </div>
                  </div>
                )}
                {transformedInterview.seeker_profile?.phone_verified !== undefined && (
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {transformedInterview.seeker_profile.phone_verified ? 'Verified' : 'Not Verified'}
                      </p>
                      <p className="text-sm text-gray-600">Phone Status</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Briefcase className="w-5 h-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">{transformedInterview.jobTitle}</p>
                    <p className="text-sm text-gray-600">Position</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Building className="w-5 h-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">{transformedInterview.companyName}</p>
                    <p className="text-sm text-gray-600">Company</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );

  const renderFeedback = () => (
    <div className="space-y-6">
      {transformedInterview.status === 'completed' ? (
        <>
          {/* Feedback Form or Display */}
          <Card>
            <h4 className="font-medium text-gray-900 mb-4">Interview Feedback</h4>
            {transformedInterview.feedback ? (
              <div className="space-y-4">
                {transformedInterview.rating && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">Overall Rating:</span>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.floor(transformedInterview.rating) ? 'text-yellow-500 fill-current' : 'text-gray-300'
                          }`}
                        />
                      ))}
                      <span className="ml-1 text-sm text-gray-600">({transformedInterview.rating}/5)</span>
                    </div>
                  </div>
                )}
                
                <div>
                  <h5 className="font-medium text-gray-900 mb-2">Feedback</h5>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {transformedInterview.feedback}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">No Feedback Yet</h4>
                <p className="text-gray-600 mb-4">
                  Add your feedback about this interview to help with the hiring decision.
                </p>
                <Button variant="primary">
                  Add Feedback
                </Button>
              </div>
            )}
          </Card>
        </>
      ) : (
        <Card>
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">Interview Not Completed</h4>
            <p className="text-gray-600">
              Feedback can be added once the interview is marked as completed.
            </p>
          </div>
        </Card>
      )}

      {/* Interview History */}
      <Card>
        <h4 className="font-medium text-gray-900 mb-4">Interview Timeline</h4>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
            <Calendar className="w-5 h-5 text-blue-600" />
            <div>
              <p className="font-medium text-blue-900">Interview Scheduled</p>
              <p className="text-sm text-blue-700">
                {formatDateTime(transformedInterview.created_at)}
              </p>
            </div>
          </div>
          
          {transformedInterview.updated_at && transformedInterview.updated_at !== transformedInterview.created_at && (
            <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
              <Edit className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-900">Interview Updated</p>
                <p className="text-sm text-yellow-700">
                  {formatDateTime(transformedInterview.updated_at)}
                </p>
              </div>
            </div>
          )}
          
          {transformedInterview.status === 'completed' && (
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <MessageCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-green-900">Interview Completed</p>
                <p className="text-sm text-green-700">
                  Status updated to completed
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'details': return renderDetails();
      case 'candidate': return renderCandidate();
      case 'feedback': return renderFeedback();
      default: return renderDetails();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />
        
        <div className="inline-block w-full max-w-5xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {transformedInterview.interview_type?.replace('_', ' ')} Interview
              </h2>
              <p className="text-gray-600">
                {transformedInterview.candidateName} • {transformedInterview.jobTitle}
              </p>
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
          <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex space-x-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onReschedule && onReschedule(transformedInterview)}
                disabled={isUpdatingStatus}
                className="p-2"
                title="Reschedule Interview"
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleCancelInterview}
                disabled={isUpdatingStatus}
                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                title={isUpdatingStatus ? 'Cancelling...' : 'Cancel Interview'}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="flex space-x-3">
              <ApplicationStatusManager 
                interview={transformedInterview}
                onStatusUpdated={handleApplicationStatusUpdated}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewDetailModal; 
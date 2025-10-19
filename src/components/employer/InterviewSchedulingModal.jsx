import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Calendar, Clock, Video, MapPin, Users, ChevronLeft, ChevronRight, ExternalLink, Briefcase, Plus, Settings, Search, Euro, Star, EyeOff } from 'lucide-react';
import Button from '../common/Button';
import Card from '../common/Card';
import Stepper from '../common/Stepper';
import useInterviews from '../../hooks/employer/useInterviews';
import useAvailableInterviewers from '../../hooks/employer/useAvailableInterviewers';
import { useJobApplications } from '../../hooks/employer/useJobApplications';
import { useJobPost } from '../../hooks/employer';
import { useToast } from '../../hooks/common/useToast';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/common/useAuth';
import { createCalendarEvent, formatMeetingLink } from '../../utils/meetingUtils';
import { formatDistanceToNow } from 'date-fns';
import { getContactDisplayText } from '../../utils/contactMasking';
import useEmailNotifications from '../../hooks/common/useEmailNotifications';

const InterviewSchedulingModal = ({ candidate, isOpen, onClose, onSchedule, interview, job }) => {
  const { t } = useTranslation('employer');
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [interviewData, setInterviewData] = useState({
    type: 'video',
    duration: 60,
    dateTime: '',
    interviewers: [],
    location: '',
    meetingLink: '',
    agenda: '',
    notes: '',
    selectedJobId: null,
    meetingPlatform: 'google'
  });

  // Debug logging for candidate data
  useEffect(() => {
    if (candidate) {
      console.log('InterviewSchedulingModal received candidate:', candidate);
      console.log('Candidate applicationId:', candidate.applicationId);
      console.log('Candidate keys:', Object.keys(candidate));
    }
  }, [candidate]);

  // Hooks - must be called before any conditional returns
  const { createInterview, updateInterview } = useInterviews();
  const { interviewers: availableInterviewers, loading: loadingInterviewers } = useAvailableInterviewers(job?.company_id || null);
  const { createApplication, checkApplicationExists } = useJobApplications();
  
  // Use job post hook like JobsPage
  const { jobs: availableJobs, loading: jobsLoading, listJobs } = useJobPost();
  
  // const toast = useToast(); // Commented out to use direct import
  const { user } = useAuth();
  const { sendInterviewScheduledNotification } = useEmailNotifications();

  // Fetch jobs when modal opens
  useEffect(() => {
    if (isOpen && availableJobs.length === 0) {
      listJobs().catch(err => {
        console.error('Error fetching jobs for interview scheduling:', err);
        toast.error('Failed to load jobs');
      });
    }
  }, [isOpen, availableJobs.length, listJobs]);

  useEffect(() => {
    if (interview) {
      setInterviewData({
        type: interview.interview_format || 'video',
        duration: interview.duration_minutes || 60,
        dateTime: interview.interview_date ? new Date(interview.interview_date).toISOString().slice(0, 16) : '',
        interviewers: interview.additional_interviewers || [],
        location: interview.location || '',
        meetingLink: interview.meeting_link || '',
        agenda: interview.agenda || '',
        notes: interview.notes || '',
        selectedJobId: job?.id || interview.job_id || null,
        meetingPlatform: 'google'
      });
    } else {
      // Reset for new interview
      setInterviewData({
        type: 'video',
        duration: 60,
        dateTime: '',
        interviewers: [],
        location: '',
        meetingLink: '',
        agenda: '',
        notes: '',
        selectedJobId: job?.id || null,
        meetingPlatform: 'google'
      });
    }
  }, [interview, job, isOpen]);

  // Reset step and form data when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      // Reset to step 1 when modal opens
      setCurrentStep(1);
      setSearchTerm('');
      setStatusFilter('active');
      
      // Only reset interview data if it's a new interview (not editing existing)
      if (!interview) {
        setInterviewData({
          type: 'video',
          duration: 60,
          dateTime: '',
          interviewers: [],
          location: '',
          meetingLink: '',
          agenda: '',
          notes: '',
          selectedJobId: job?.id || null,
          meetingPlatform: 'google'
        });
      }
    }
  }, [isOpen, interview, job]);

  // Status filter options (same as JobsPage)
  const statusOptions = [
    { value: 'all', label: 'All Jobs' },
    { value: 'active', label: 'Active' },
    { value: 'draft', label: 'Draft' },
    { value: 'paused', label: 'Paused' },
    { value: 'closed', label: 'Closed' },
  ];

  // Filter jobs (same logic as JobsPage)
  const filteredJobs = useMemo(() => {
    return availableJobs.filter(job => {
      const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           job.location.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [availableJobs, searchTerm, statusFilter]);

  // Early return after all hooks are called
  if (!isOpen || !candidate) return null;

  // Reset function to clean up state when modal closes
  const handleClose = () => {
    // Reset all state when closing
    setCurrentStep(1);
    setSearchTerm('');
    setStatusFilter('active');
    setInterviewData({
      type: 'video',
      duration: 60,
      dateTime: '',
      interviewers: [],
      location: '',
      meetingLink: '',
      agenda: '',
      notes: '',
      selectedJobId: job?.id || null,
      meetingPlatform: 'google'
    });
    setIsSubmitting(false);
    
    // Call the original onClose function
    if (typeof onClose === 'function') {
      onClose();
    }
  };

  // Split into pinned and regular jobs (same as JobsPage)
  const pinnedJobs = filteredJobs.filter(job => job.is_pinned);
  const regularJobs = filteredJobs.filter(job => !job.is_pinned);

  // Format job data (same as JobsPage)
  const formatJobData = (job) => ({
    id: job.id,
    title: job.title,
    description: job.description,
    status: job.status,
    location: job.location,
    workModel: job.is_remote ? 'Remote' : job.is_hybrid ? 'Hybrid' : 'On-site',
    salary: job.salary_range ? `${job.salary_range.min} - ${job.salary_range.max}` : 'Not specified',
    time: job.created_at ? `${formatDistanceToNow(new Date(job.created_at))} ago` : '',
    applicants: job.applications_count || 0,
    newApplicants: job.new_applications_count || 0,
    views: job.views_count || 0,
    matches: job.matches_count || 0,
    isPinned: job.is_pinned || false,
    isLoading: false,
    // Add missing fields for the modal
    requirements: job.requirements,
    responsibilities: job.responsibilities,
    skills_required: job.skills_required,
    benefits: job.benefits,
    salary_range: job.salary_range,
    is_remote: job.is_remote,
    is_hybrid: job.is_hybrid,
    job_type: job.job_type,
    experience_level: job.experience_level,
    application_deadline: job.application_deadline,
    start_date: job.start_date,
    drivers_license: job.drivers_license,
    additional_questions: job.additional_questions,
    preferred_language: job.preferred_language,
    priority: job.priority,
    visa_sponsorship: job.visa_sponsorship,
    relocation: job.relocation,
    equity: job.equity,
    company_id: job.company_id,
    companies: job.companies,
    created_at: job.created_at,
    updated_at: job.updated_at
  });

  const steps = [
    { id: 1, title: t('interviewSchedulingModal.step1') },
    { id: 2, title: t('interviewSchedulingModal.step2') },
    { id: 3, title: t('interviewSchedulingModal.step3') },
    { id: 4, title: t('interviewSchedulingModal.step4') }
  ];

  const interviewTypes = [
    { 
      id: 'phone', 
      label: t('interviewSchedulingModal.phone'), 
      icon: '📞', 
      description: 'Quick screening call',
      color: 'from-green-500 to-green-600'
    },
    { 
      id: 'video', 
      label: t('interviewSchedulingModal.video'), 
      icon: '💻', 
      description: 'Online video meeting',
      color: 'from-blue-500 to-blue-600'
    },
    { 
      id: 'in_person', 
      label: t('interviewSchedulingModal.onsite'), 
      icon: '🏢', 
      description: 'In-person meeting',
      color: 'from-purple-500 to-purple-600'
    }
  ];

  const durations = [
    { value: 30, label: '30 Minuten' },
    { value: 60, label: '1 Stunde' },
    { value: 90, label: '1,5 Stunden' },
    { value: 120, label: '2 Stunden' }
  ];

  // Get minimum date (tomorrow at 9 AM)
  const getMinDateTime = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    return tomorrow.toISOString().slice(0, 16);
  };

  // Get maximum date (30 days from now)
  const getMaxDateTime = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    maxDate.setHours(17, 0, 0, 0);
    return maxDate.toISOString().slice(0, 16);
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Handle job selection (same pattern as JobsPage)
  const handleJobSelect = (jobId) => {
    setInterviewData(prev => ({ ...prev, selectedJobId: jobId }));
  };

  // Simple Job Card Component for Interview Scheduling
  const SimpleJobCard = ({ job, isSelected, onClick }) => {
    const getStatusColor = (status) => {
      switch (status) {
        case 'active': return 'bg-green-100 text-green-800';
        case 'paused': return 'bg-yellow-100 text-yellow-800';
        case 'draft': return 'bg-gray-100 text-gray-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    };

    return (
      <div
        onClick={onClick}
        className={`bg-white rounded-lg border-2 p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
          isSelected 
            ? 'border-blue-500 bg-blue-50 shadow-lg' 
            : 'border-gray-200 hover:border-blue-300'
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(job.status)}`}>
                {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
              </span>
              {job.isPinned && (
                <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                  Pinned
                </span>
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {job.title}
            </h3>
          </div>
          {isSelected && (
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center ml-3">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path 
                  fillRule="evenodd" 
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                  clipRule="evenodd" 
                />
              </svg>
            </div>
          )}
        </div>

        {/* Job Details */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span>{job.location}</span>
            <span className="text-gray-400">•</span>
            <span>{job.workModel}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Euro className="w-4 h-4 text-green-500" />
            <span className="font-medium text-green-700">{job.salary}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4 text-orange-500" />
            <span>Posted {job.time}</span>
          </div>
        </div>

        {/* Skills */}
        {job.skills_required && job.skills_required.length > 0 && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-1">
              {job.skills_required.slice(0, 3).map((skill, index) => (
                <span
                  key={index}
                  className={`px-2 py-1 text-xs rounded-full ${
                    isSelected
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {skill}
                </span>
              ))}
              {job.skills_required.length > 3 && (
                <span className={`px-2 py-1 text-xs rounded-full ${
                  isSelected
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  +{job.skills_required.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>{job.applicants} applicants</span>
            <span>{job.views} views</span>
          </div>
          <div className="text-sm text-gray-500">
            {job.matches} matches
          </div>
        </div>
      </div>
    );
  };



  const handleSchedule = async () => {
    console.log('handleSchedule called', { interview, candidate, job });
    
    if (interview) {
      // Reschedule existing interview
      try {
        setIsSubmitting(true);
        
        const updateData = {
          interview_format: interviewData.type,
          duration_minutes: interviewData.duration, // Backend expects duration_minutes
          interview_date: new Date(interviewData.dateTime).toISOString(),
          location: interviewData.location, // Backend expects location column
          meeting_link: interviewData.meetingLink,
          agenda: interviewData.agenda,
          interview_notes: interviewData.notes, // Backend expects interview_notes
          additional_interviewers: interviewData.interviewers,
          job_id: interviewData.selectedJobId
        };

        await updateInterview(interview.id, updateData);
        
        // Send email notifications for rescheduled interview
        try {
          // Get the job information
          const selectedJob = availableJobs.find(job => job.id === interviewData.selectedJobId) || job;
          if (selectedJob) {
            // Format interview date and time for email
            const interviewDate = new Date(interviewData.dateTime);
            const formattedDate = interviewDate.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });
            const formattedTime = interviewDate.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            });

            // Send email to candidate
            if (candidate.email) {
              await sendInterviewScheduledNotification({
                to: candidate.email,
                recipientType: 'candidate',
                jobTitle: selectedJob.title,
                companyName: selectedJob.company?.name || 'Company',
                candidateName: candidate.profiles?.full_name || candidate.full_name || candidate.name || 'Candidate',
                interviewerName: user.user_metadata?.full_name || user.email || 'Interviewer',
                interviewDate: formattedDate,
                interviewTime: formattedTime,
                interviewLocation: interviewData.location || 'To be confirmed',
                interviewType: interviewData.type === 'video' ? 'Video Call' : 
                             interviewData.type === 'phone' ? 'Phone Call' : 'In-person',
                interviewDuration: `${interviewData.duration} minutes`,
                interviewUrl: `${window.location.origin}/interviews/${interview.id}`,
                jobUrl: `${window.location.origin}/jobs/${selectedJob.id}`
              });
              console.log('Interview reschedule notification email sent to candidate');
            }

            // Send email to employer/interviewer
            if (user.email) {
              await sendInterviewScheduledNotification({
                to: user.email,
                recipientType: 'employer',
                jobTitle: selectedJob.title,
                companyName: selectedJob.company?.name || 'Company',
                candidateName: candidate.profiles?.full_name || candidate.full_name || candidate.name || 'Candidate',
                interviewerName: user.user_metadata?.full_name || user.email || 'Interviewer',
                interviewDate: formattedDate,
                interviewTime: formattedTime,
                interviewLocation: interviewData.location || 'To be confirmed',
                interviewType: interviewData.type === 'video' ? 'Video Call' : 
                             interviewData.type === 'phone' ? 'Phone Call' : 'In-person',
                interviewDuration: `${interviewData.duration} minutes`,
                interviewUrl: `${window.location.origin}/interviews/${interview.id}`,
                jobUrl: `${window.location.origin}/jobs/${selectedJob.id}`
              });
              console.log('Interview reschedule notification email sent to employer');
            }
          }
        } catch (emailError) {
          console.error('Failed to send interview reschedule notification emails:', emailError);
          // Don't fail the interview reschedule if emails fail
          // Just log the error silently
        }
        
        // Show success toast
        toast.success('Interview rescheduled successfully');
        
        // Close modal immediately after success
        try {
          console.log('Calling handleClose function (reschedule):', typeof handleClose);
          handleClose();
        } catch (closeError) {
          console.error('Error closing modal (reschedule):', closeError);
        }
      } catch (error) {
        console.error('Error rescheduling interview:', error);
        toast.error('Failed to reschedule interview');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Create new interview
      try {
        setIsSubmitting(true);
        
        // Get the selected job
        const selectedJob = availableJobs.find(job => job.id === interviewData.selectedJobId);
        if (!selectedJob) {
          throw new Error('Please select a job position');
        }

        // Check if application exists for this candidate and job
        let jobApplicationId = null;
        
        // First, check if candidate already has an applicationId (from job applications)
        if (candidate.applicationId) {
          jobApplicationId = candidate.applicationId;
          console.log('Using existing application ID from candidate:', jobApplicationId);
        } else {
          // If no applicationId in candidate, try to find existing application
          try {
            const existingApplication = await checkApplicationExists(candidate.id, selectedJob.id);
            if (existingApplication) {
              jobApplicationId = existingApplication.id;
              console.log('Found existing application:', existingApplication);
            }
          } catch (error) {
            console.log('No existing application found, will create direct interview');
          }
        }

        // Prepare interview data for database - match backend field names
        const interviewRecord = {
          application_id: jobApplicationId, // Will be set if candidate has application
          job_id: selectedJob.id,
          interview_type: '1st_interview', // Default to first interview
          interview_format: interviewData.type, // This maps to interview_format in DB
          location: interviewData.location || null, // Backend expects location column
          interview_date: new Date(interviewData.dateTime).toISOString(),
          duration_minutes: interviewData.duration, // Backend expects duration_minutes
          interviewer_id: user.id, // Current user as primary interviewer
          meeting_link: interviewData.meetingLink || null,
          interview_notes: interviewData.notes || null, // Backend expects interview_notes
          agenda: interviewData.agenda || null,
          additional_interviewers: interviewData.interviewers.length > 0 ? interviewData.interviewers : [],
          status: 'scheduled',
          seeker_id: candidate.seeker_id || candidate.id // Required for direct interviews
        };
        
        console.log('Creating direct interview with jobApplicationId:', jobApplicationId);
        console.log('Interview record:', interviewRecord);

        const newInterview = await createInterview(interviewRecord);
        
        console.log('Interview created successfully:', newInterview);
        console.log('Interview type:', jobApplicationId ? 'Application-linked' : 'Direct interview');
        
        // Send email notifications to both candidate and employer
        try {
          // Format interview date and time for email
          const interviewDate = new Date(interviewData.dateTime);
          const formattedDate = interviewDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
          const formattedTime = interviewDate.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          });

          // Send email to candidate
          if (candidate.email) {
            await sendInterviewScheduledNotification({
              to: candidate.email,
              recipientType: 'candidate',
              jobTitle: selectedJob.title,
              companyName: selectedJob.company?.name || 'Company',
              candidateName: candidate.profiles?.full_name || candidate.full_name || candidate.name || 'Candidate',
              interviewerName: user.user_metadata?.full_name || user.email || 'Interviewer',
              interviewDate: formattedDate,
              interviewTime: formattedTime,
              interviewLocation: interviewData.location || 'To be confirmed',
              interviewType: interviewData.type === 'video' ? 'Video Call' : 
                           interviewData.type === 'phone' ? 'Phone Call' : 'In-person',
              interviewDuration: `${interviewData.duration} minutes`,
              interviewUrl: `${window.location.origin}/interviews/${newInterview.id}`,
              jobUrl: `${window.location.origin}/jobs/${selectedJob.id}`
            });
            console.log('Interview notification email sent to candidate');
          }

          // Send email to employer/interviewer
          if (user.email) {
            await sendInterviewScheduledNotification({
              to: user.email,
              recipientType: 'employer',
              jobTitle: selectedJob.title,
              companyName: selectedJob.company?.name || 'Company',
              candidateName: candidate.profiles?.full_name || candidate.full_name || candidate.name || 'Candidate',
              interviewerName: user.user_metadata?.full_name || user.email || 'Interviewer',
              interviewDate: formattedDate,
              interviewTime: formattedTime,
              interviewLocation: interviewData.location || 'To be confirmed',
              interviewType: interviewData.type === 'video' ? 'Video Call' : 
                           interviewData.type === 'phone' ? 'Phone Call' : 'In-person',
              interviewDuration: `${interviewData.duration} minutes`,
              interviewUrl: `${window.location.origin}/interviews/${newInterview.id}`,
              jobUrl: `${window.location.origin}/jobs/${selectedJob.id}`
            });
            console.log('Interview notification email sent to employer');
          }
        } catch (emailError) {
          console.error('Failed to send interview notification emails:', emailError);
          // Don't fail the interview creation if emails fail
          // Just log the error silently
        }
        
        // Show success toast
        toast.success(jobApplicationId ? 'Interview scheduled successfully' : 'Direct interview invitation sent successfully');
        
        // Call the onSchedule callback with the created interview
        if (onSchedule) {
          onSchedule(newInterview);
        }
        
        // Close modal immediately after success
        try {
          console.log('Calling handleClose function (create):', typeof handleClose);
          handleClose();
        } catch (closeError) {
          console.error('Error closing modal (create):', closeError);
        }
      } catch (error) {
        console.error('Error scheduling interview:', error);
        toast.error(error.message || 'Failed to schedule interview');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

    const renderStep1 = () => (
    <div className="space-y-8">
      {/* Job Selection Header */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-blue-600" />
          Select Job Position
        </h3>
        <p className="text-gray-600 mb-6">Choose which job position to schedule the interview for</p>
      </div>

      {/* Search and Filters (same as JobsPage) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search jobs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-white border border-gray-300 rounded-lg shadow-sm pl-3 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Jobs List (same as JobsPage) */}
      <div className="space-y-4">
        {jobsLoading ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-gray-600">Loading jobs...</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
            <Briefcase className="w-8 h-8 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No jobs found</p>
            <p className="text-sm text-gray-500 mt-1">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filters' 
                : 'Please create some jobs first to schedule interviews'
              }
            </p>
          </div>
        ) : (
          <>
            {/* Pinned Jobs */}
            {pinnedJobs.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-blue-600" />
                  Pinned Jobs
                </h4>
                <div className="space-y-3">
                  {pinnedJobs.map(job => (
                    <SimpleJobCard
                      key={job.id}
                      job={formatJobData(job)}
                      isSelected={interviewData.selectedJobId === job.id}
                      onClick={() => handleJobSelect(job.id)}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {/* Regular Jobs */}
            {regularJobs.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-gray-600" />
                  {pinnedJobs.length > 0 ? 'Other Jobs' : 'All Jobs'}
                </h4>
                <div className="space-y-3">
                  {regularJobs.map(job => (
                    <SimpleJobCard
                      key={job.id}
                      job={formatJobData(job)}
                      isSelected={interviewData.selectedJobId === job.id}
                      onClick={() => handleJobSelect(job.id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Select Interview Type</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {interviewTypes.map((type) => (
            <Card
              key={type.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-md group ${
                interviewData.type === type.id
                  ? 'border-blue-500 bg-blue-50 shadow-lg ring-2 ring-blue-200 transform scale-105'
                  : 'hover:border-blue-300 hover:bg-blue-25 hover:scale-102'
              }`}
              onClick={() => setInterviewData(prev => ({ ...prev, type: type.id }))}
            >
              <div className="text-center p-2">
                <div className={`w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-r ${type.color} flex items-center justify-center transform transition-transform ${
                  interviewData.type === type.id ? 'scale-110' : 'group-hover:scale-105'
                }`}>
                  <span className="text-2xl">{type.icon}</span>
                </div>
                <h4 className={`font-semibold transition-colors ${
                  interviewData.type === type.id ? 'text-blue-900' : 'text-gray-900'
                }`}>
                  {type.label}
                </h4>
                <p className={`text-sm mt-1 transition-colors ${
                  interviewData.type === type.id ? 'text-blue-700' : 'text-gray-600'
                }`}>
                  {type.description}
                </p>
                {interviewData.type === type.id && (
                  <div className="mt-3 flex justify-center">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path 
                          fillRule="evenodd" 
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                          clipRule="evenodd" 
                        />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Interview Duration</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {durations.map((duration) => (
            <button
              key={duration.value}
              onClick={() => setInterviewData(prev => ({ ...prev, duration: duration.value }))}
              className={`p-4 rounded-lg border-2 text-sm font-medium transition-all duration-200 transform hover:scale-105 ${
                interviewData.duration === duration.value
                  ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-lg ring-2 ring-blue-200'
                  : 'border-gray-300 text-gray-700 hover:border-blue-400 hover:bg-blue-25'
              }`}
            >
              <Clock className={`w-4 h-4 mx-auto mb-1 ${
                interviewData.duration === duration.value ? 'text-blue-600' : 'text-gray-500'
              }`} />
              {duration.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          Select Date & Time
        </h3>
        
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Interview Date & Time
              </label>
              <input
                type="datetime-local"
                value={interviewData.dateTime}
                onChange={(e) => setInterviewData(prev => ({ ...prev, dateTime: e.target.value }))}
                min={getMinDateTime()}
                max={getMaxDateTime()}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900"
                placeholder="Select date and time"
              />
              <p className="mt-2 text-sm text-gray-600">
                Available times: Monday-Friday, 9:00 AM - 5:00 PM
              </p>
            </div>

            {interviewData.dateTime && (
              <div className="mt-4 p-4 bg-white rounded-lg border border-blue-200">
                <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  Selected Date & Time
                </h4>
                <div className="text-lg font-semibold text-blue-900">
                  {(() => {
                    try {
                      const dateObj = new Date(interviewData.dateTime);
                      if (isNaN(dateObj.getTime())) {
                        return 'Invalid date selected';
                      }
                      return dateObj.toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      }) + ' at ' + dateObj.toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      });
                    } catch (error) {
                      return 'Invalid date selected';
                    }
                  })()}
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  Duration: {interviewData.duration} minutes
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-medium text-yellow-800">Scheduling Guidelines</h4>
              <ul className="mt-2 text-sm text-yellow-700 space-y-1">
                <li>• Interviews are scheduled during business hours (9 AM - 5 PM)</li>
                <li>• Please allow at least 24 hours notice for scheduling</li>
                <li>• Weekend interviews are not available</li>
                <li>• All times are in your local timezone</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => {
    // Filter out the current user from the interviewers list
    const filteredInterviewers = availableInterviewers.filter(interviewer => interviewer.id !== user?.id);
    
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Interview Details
          </h3>
          
          {/* Current User Info */}
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Primary Interviewer (You)
            </h4>
            <div className="flex items-center space-x-3">
              <img
                src={user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${user?.user_metadata?.full_name || 'User'}&size=40`}
                alt={user?.user_metadata?.full_name || 'You'}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-300"
              />
              <div>
                <p className="font-medium text-blue-900">
                  {user?.user_metadata?.full_name || 'You'}
                </p>
                <p className="text-sm text-blue-700">
                  Primary Interviewer
                </p>
              </div>
            </div>
          </div>

          {/* Additional Interviewers Section - Under Development */}
          <div className="mb-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-yellow-800 mb-2">Additional Interviewers</h4>
                <p className="text-yellow-700 mb-3">
                  This feature is currently under development. You can schedule interviews with additional team members in future updates.
                </p>
                <div className="bg-white/50 rounded-lg p-3 border border-yellow-300">
                  <p className="text-sm text-yellow-800 font-medium">Coming Soon:</p>
                  <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                    <li>• Select multiple team members for interviews</li>
                    <li>• Send calendar invitations to all participants</li>
                    <li>• Collaborative interview scheduling</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* Location/Meeting Link Section */}
      <div className="space-y-4">
        {interviewData.type === 'in_person' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Meeting Location
            </label>
            <input
              type="text"
              value={interviewData.location}
              onChange={(e) => setInterviewData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="Office address or meeting room"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
        )}

        {interviewData.type === 'video' && (
          <div className="space-y-4">
            {/* Meeting Platform Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <Video className="w-4 h-4" />
                Meeting Platform
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'google', name: 'Google Meet', icon: '🎥', color: 'from-blue-500 to-blue-600' },
                  { id: 'zoom', name: 'Zoom', icon: '📹', color: 'from-blue-400 to-blue-500' },
                  { id: 'teams', name: 'Teams', icon: '💼', color: 'from-purple-500 to-purple-600' }
                ].map((platform) => (
                  <button
                    key={platform.id}
                    onClick={() => setInterviewData(prev => ({ 
                      ...prev, 
                      meetingPlatform: platform.id,
                      meetingLink: '' // Clear existing link when platform changes
                    }))}
                    className={`p-3 rounded-lg border-2 text-sm font-medium transition-all duration-200 ${
                      interviewData.meetingPlatform === platform.id
                        ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-lg ring-2 ring-blue-200'
                        : 'border-gray-300 text-gray-700 hover:border-blue-400 hover:bg-blue-25'
                    }`}
                  >
                    <div className={`w-8 h-8 mx-auto mb-2 rounded-full bg-gradient-to-r ${platform.color} flex items-center justify-center text-white text-lg`}>
                      {platform.icon}
                    </div>
                    {platform.name}
                  </button>
                ))}
              </div>
            </div>



            {/* Meeting Link Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Video className="w-4 h-4" />
                Meeting Link (Optional)
              </label>
              <div className="relative">
                <input
                  type="url"
                  value={interviewData.meetingLink}
                  onChange={(e) => setInterviewData(prev => ({ ...prev, meetingLink: e.target.value }))}
                  placeholder="Enter meeting link (e.g., Google Meet, Zoom, Teams)"
                  className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
                <ExternalLink className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                You can provide a meeting link or share it with the candidate separately
              </p>
            </div>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Interview Agenda (Optional)
        </label>
        <textarea
          value={interviewData.agenda}
          onChange={(e) => setInterviewData(prev => ({ ...prev, agenda: e.target.value }))}
          placeholder="Brief overview of what will be covered in the interview..."
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Additional Notes (Optional)
        </label>
        <textarea
          value={interviewData.notes}
          onChange={(e) => setInterviewData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Any special instructions or requirements..."
          rows={2}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
        />
      </div>
    </div>
  );
  };

  const renderStep4 = () => {
    const selectedJob = job || filteredJobs.find(j => j.id === interviewData.selectedJobId);
    
    // Get masked contact information
    const contactInfo = getContactDisplayText(candidate);
    
    return (
      <div className="space-y-6">
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <h3 className="text-lg font-semibold mb-4 text-blue-900">Interview Summary</h3>
          {contactInfo.message && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-2 text-amber-700 text-sm">
                <EyeOff className="w-4 h-4" />
                <span className="font-medium">Contact Information Notice</span>
              </div>
              <p className="text-amber-600 text-xs mt-1">
                {contactInfo.message}
              </p>
            </div>
          )}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Candidate:</span>
              <div className="text-right">
                <div className="font-medium">
                  {candidate?.profiles?.full_name || 
                   candidate?.full_name || 
                   candidate?.name || 
                   'Unknown Candidate'}
                </div>
                {candidate?.headline && (
                  <div className="text-sm text-gray-500">{candidate.headline}</div>
                )}
              </div>
            </div>
            
            {selectedJob && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Position:</span>
                <div className="text-right">
                  <div className="font-medium">{selectedJob.title}</div>
                  <div className="text-sm text-gray-500">{selectedJob.location}</div>
                </div>
              </div>
            )}
            
            {contactInfo.location && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Candidate Location:</span>
                <div className="text-right">
                  <span className="font-medium">📍 {contactInfo.location}</span>
                  {contactInfo.message && (
                    <div className="flex items-center gap-1 mt-1">
                      <EyeOff className="w-3 h-3 text-amber-600" />
                      <span className="text-xs text-amber-600">Contact hidden until scheduled</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Interview Type:</span>
              <span className="font-medium flex items-center gap-2">
                {interviewTypes.find(t => t.id === interviewData.type)?.icon}
                {interviewTypes.find(t => t.id === interviewData.type)?.label}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Duration:</span>
              <span className="font-medium flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {interviewData.duration} minutes
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Date & Time:</span>
              <span className="font-medium">
                {interviewData.dateTime ? (
                  (() => {
                    try {
                      const dateObj = new Date(interviewData.dateTime);
                      if (isNaN(dateObj.getTime())) {
                        return 'Invalid date selected';
                      }
                      return dateObj.toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      }) + ' at ' + dateObj.toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      });
                    } catch (error) {
                      return 'Invalid date selected';
                    }
                  })()
                ) : (
                  'Date and time not selected'
                )}
              </span>
            </div>
            
            <div className="flex items-start justify-between">
              <span className="text-gray-600">Interviewer:</span>
              <div className="text-right">
                <span className="font-medium">{user?.user_metadata?.full_name || 'You'} (Primary Interviewer)</span>
                <div className="text-xs text-yellow-600 mt-1">
                  Additional interviewers coming soon
                </div>
              </div>
            </div>
            
            {(interviewData.location || interviewData.meetingLink) && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600">
                  {interviewData.type === 'video' ? 'Meeting Link:' : 'Location:'}
                </span>
                <div className="text-right max-w-xs">
                  {interviewData.type === 'video' && interviewData.meetingLink ? (
                    <div>
                      <div className="font-medium text-blue-600 flex items-center gap-1 justify-end">
                        {formatMeetingLink(interviewData.meetingLink, interviewData.meetingPlatform).icon}
                        {formatMeetingLink(interviewData.meetingLink, interviewData.meetingPlatform).platform}
                      </div>
                      <div className="text-sm text-gray-500 truncate">
                        {interviewData.meetingLink}
                      </div>
                    </div>
                  ) : interviewData.type === 'video' && !interviewData.meetingLink ? (
                    <span className="text-sm text-gray-500 italic">
                      Meeting link will be shared separately
                    </span>
                  ) : (
                    <span className="font-medium">
                      {interviewData.location}
                    </span>
                  )}
                </div>
              </div>
            )}
            
            {candidate?.matchPercentage && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Skill Match:</span>
                <span className="font-medium text-blue-600">{candidate.matchPercentage}%</span>
              </div>
            )}
          </div>
        </Card>

        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-medium text-green-900 mb-2 flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            What happens next?
          </h4>
          <ul className="text-sm text-green-800 space-y-1">
            <li>• Calendar invitations will be sent to all participants</li>
            <li>• The candidate will receive an email with interview details</li>
            <li>• {interviewData.type === 'video' ? (interviewData.meetingLink ? 'Provided meeting link will be included' : 'Meeting link can be shared separately') : 'Location details will be provided'}</li>
            <li>• Reminder notifications will be sent 24 hours before</li>
          </ul>
        </div>

        {/* Calendar Integration */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Add to Calendar
          </h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-800">Google Calendar:</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const selectedJob = job || filteredJobs.find(j => j.id === interviewData.selectedJobId);
                  const eventData = {
                    title: `Interview: ${candidate?.profiles?.full_name || candidate?.full_name || candidate?.name} - ${selectedJob?.title || 'Position'}`,
                    startTime: new Date(interviewData.dateTime),
                    duration: interviewData.duration,
                    description: interviewData.agenda || 'Interview meeting',
                    location: interviewData.type === 'video' ? interviewData.meetingLink : interviewData.location,
                    attendees: [candidate?.email || candidate?.profiles?.email]
                  };
                  
                  const calendarUrl = createCalendarEvent('google', eventData);
                  window.open(calendarUrl, '_blank');
                }}
                className="flex items-center gap-1"
              >
                <Calendar className="w-4 h-4" />
                Add to Google Calendar
              </Button>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-800">Outlook Calendar:</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const selectedJob = job || filteredJobs.find(j => j.id === interviewData.selectedJobId);
                  const eventData = {
                    title: `Interview: ${candidate?.profiles?.full_name || candidate?.full_name || candidate?.name} - ${selectedJob?.title || 'Position'}`,
                    startTime: new Date(interviewData.dateTime),
                    duration: interviewData.duration,
                    description: interviewData.agenda || 'Interview meeting',
                    location: interviewData.type === 'video' ? interviewData.meetingLink : interviewData.location,
                    attendees: [candidate?.email || candidate?.profiles?.email]
                  };
                  
                  const calendarUrl = createCalendarEvent('outlook', eventData);
                  window.open(calendarUrl, '_blank');
                }}
                className="flex items-center gap-1"
              >
                <Calendar className="w-4 h-4" />
                Add to Outlook
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      default: return renderStep1();
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1: 
        const hasJob = job || interviewData.selectedJobId;
        return interviewData.type && interviewData.duration && hasJob;
      case 2: 
        if (!interviewData.dateTime) return false;
        // Validate that the selected date is not in the past and is during business hours
        const selectedDate = new Date(interviewData.dateTime);
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 0, 0, 0);
        
        return selectedDate >= tomorrow && 
               selectedDate.getHours() >= 9 && 
               selectedDate.getHours() < 17 &&
               selectedDate.getDay() !== 0 && 
               selectedDate.getDay() !== 6;
      case 3: return true; // Step 3 is always valid since we removed additional interviewers
      case 4: return true;
      default: return false;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={handleClose} />
        
        <div className="inline-block w-full max-w-5xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="w-6 h-6 text-blue-600" />
                {interview ? t('interviewSchedulingModal.updateInterview') : t('interviewSchedulingModal.scheduleInterview')}
              </h2>
              <p className="text-gray-600 mt-1">
                with {candidate?.profiles?.full_name || 
                      candidate?.full_name || 
                      candidate?.name || 
                      'Unknown Candidate'}
              </p>
              {job && (
                <p className="text-sm text-blue-600 mt-1">
                  for {job.title}
                </p>
              )}
            </div>
            <Button variant="ghost" onClick={handleClose} className="hover:bg-white/50">
              <X className="w-6 h-6" />
            </Button>
          </div>

          {/* Stepper */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <Stepper steps={steps} currentStep={currentStep - 1} />
          </div>

          {/* Content */}
          <div className="p-6 min-h-[500px] max-h-[70vh] overflow-y-auto">
            {renderStepContent()}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
                              {t('interviewSchedulingModal.back')}
            </Button>
            
            <div className="flex space-x-3">
              {currentStep === 4 ? (
                <Button
                  variant="primary"
                  onClick={handleSchedule}
                  disabled={!isStepValid() || isSubmitting}
                  className="flex items-center gap-2 px-6"
                >
                  <Calendar className="w-4 h-4" />
                  {isSubmitting 
                    ? (interview ? 'Rescheduling...' : 'Scheduling...') 
                    : (interview ? t('interviewSchedulingModal.updateInterview') : t('interviewSchedulingModal.scheduleInterview'))
                  }
                  {isSubmitting && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-1" />
                  )}
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={handleNext}
                  disabled={!isStepValid()}
                  className="flex items-center gap-2"
                >
                  {t('interviewSchedulingModal.next')}
                  <ChevronRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewSchedulingModal;

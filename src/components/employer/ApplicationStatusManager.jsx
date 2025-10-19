import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check, X, Clock, UserCheck, UserX, Briefcase, Building } from 'lucide-react';
import Button from '../common/Button';
import Badge from '../common/Badge';
import { useJobApplications } from '../../hooks/employer/useJobApplications';
import { useToast } from '../../hooks/common/useToast';
import { useJobsStore } from '../../stores/jobsStore';

const ApplicationStatusManager = ({ interview, onStatusUpdated }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentApplication, setCurrentApplication] = useState(null);
  const [selectedJobId, setSelectedJobId] = useState(interview?.job_id || '');
  const [notes, setNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState('bottom');
  const containerRef = useRef(null);

  const { checkApplicationExists, manageApplicationStatus, loading } = useJobApplications();
  const { success: showSuccess, error: showError } = useToast();
  const jobs = useJobsStore((state) => state.jobs);

  // Get active jobs for selection
  const activeJobs = jobs.filter(job => job.status === 'active');

  // Application status options
  const statusOptions = [
    { 
      value: 'interviewing', 
      label: 'Interviewing', 
      color: 'info', 
      icon: Clock,
      description: 'Candidate is in the interview process'
    },
    { 
      value: 'offered', 
      label: 'Offered', 
      color: 'success', 
      icon: Check,
      description: 'Job offer has been extended'
    },
    { 
      value: 'hired', 
      label: 'Hired', 
      color: 'success', 
      icon: UserCheck,
      description: 'Candidate has been hired'
    },
    { 
      value: 'rejected', 
      label: 'Rejected', 
      color: 'error', 
      icon: UserX,
      description: 'Application has been rejected'
    },
    { 
      value: 'withdrawn', 
      label: 'Withdrawn', 
      color: 'warning', 
      icon: X,
      description: 'Candidate withdrew application'
    }
  ];

  // Force dropdown to always appear at top
  const calculateDropdownPosition = () => {
    return 'top';
  };

  // Check if application exists when component mounts
  useEffect(() => {
    const checkApplication = async () => {
      if (interview?.job_id && interview?.applicantId) {
        try {
          const application = await checkApplicationExists(interview.job_id, interview.applicantId);
          setCurrentApplication(application);
        } catch (error) {
          console.error('Error checking application:', error);
        }
      }
    };

    checkApplication();
  }, [interview, checkApplicationExists]);

  // Update dropdown position when opening
  useEffect(() => {
    if (isOpen) {
      setDropdownPosition(calculateDropdownPosition());
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setNotes('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  const handleStatusUpdate = async (newStatus) => {
    console.log('handleStatusUpdate called with:', newStatus);
    console.log('Interview data:', interview);
    console.log('Selected job ID:', selectedJobId);
    
    // Use selectedJobId if interview.job_id is missing
    const jobId = interview?.job_id || selectedJobId;
    
    if (!jobId || !interview?.applicantId) {
      console.error('Missing required data:', { 
        job_id: jobId, 
        applicantId: interview?.applicantId 
      });
      
      showError('Please select a job and ensure candidate information is available');
      return;
    }

    try {
      setIsUpdating(true);
      console.log('Updating application status...', {
        jobId,
        applicantId: interview.applicantId,
        newStatus,
        notes
      });
      
      const updatedApplication = await manageApplicationStatus(
        jobId,
        interview.applicantId,
        newStatus,
        notes
      );

      console.log('Application updated successfully:', updatedApplication);
      
      setCurrentApplication(updatedApplication);
      setIsOpen(false);
      setNotes('');
      
      showSuccess(
        currentApplication 
          ? `Application status updated to ${newStatus}` 
          : `Candidate added to pipeline with status ${newStatus}`
      );

      if (onStatusUpdated) {
        onStatusUpdated(updatedApplication);
      }
    } catch (error) {
      console.error('Error updating application status:', error);
      showError(`Failed to update application status: ${error.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const getCurrentStatusOption = () => {
    if (!currentApplication) return null;
    return statusOptions.find(option => option.value === currentApplication.status);
  };

  const getSelectedJob = () => {
    const jobId = interview?.job_id || selectedJobId;
    return jobs.find(job => job.id === jobId);
  };

  const currentStatusOption = getCurrentStatusOption();
  const selectedJob = getSelectedJob();

  return (
    <div className="relative" ref={containerRef}>
      <div className="flex items-center gap-3">
        {/* Current Status Display */}
        {currentApplication && currentStatusOption ? (
          <div className="flex items-center gap-2">
            <Badge variant={currentStatusOption.color} size="sm">
              <currentStatusOption.icon className="w-3 h-3 mr-1" />
              {currentStatusOption.label}
            </Badge>
            <span className="text-sm text-gray-600">Current Status</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Badge variant="outline" size="sm">
              <Briefcase className="w-3 h-3 mr-1" />
              Not in Pipeline
            </Badge>
            <span className="text-sm text-gray-600">No Application</span>
          </div>
        )}

        {/* Update Status Button */}
        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          disabled={loading || isUpdating}
        >
          {currentApplication ? 'Update Status' : 'Add to Pipeline'}
          <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </Button>
      </div>

      {/* Status Dropdown */}
      {isOpen && (
        <div className={`absolute right-0 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-[60] ${
          dropdownPosition === 'top' 
            ? 'bottom-full mb-2' 
            : 'top-full mt-2'
        }`}>
          <div className="p-2">
            <h4 className="font-medium text-gray-900 mb-2 text-sm">
              {currentApplication ? 'Update Application Status' : 'Add to Application Pipeline'}
            </h4>
            
            {/* Job Selection - Only show if job_id is missing */}
            {!interview?.job_id && (
              <div className="mb-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Select Job Position
                </label>
                <select
                  value={selectedJobId}
                  onChange={(e) => setSelectedJobId(e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                  required
                >
                  <option value="">Select a job...</option>
                  {activeJobs.map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.title} - {job.location}
                    </option>
                  ))}
                </select>
                {selectedJob && (
                  <div className="mt-1 p-2 bg-blue-50 rounded border border-blue-200">
                    <div className="flex items-center gap-2 text-xs text-blue-800">
                      <Building className="w-3 h-3" />
                      <span className="font-medium">{selectedJob.title}</span>
                      <span>•</span>
                      <span>{selectedJob.location}</span>
                    </div>
                  </div>
                )}
                {activeJobs.length === 0 && (
                  <p className="text-xs text-gray-500 mt-1">No active jobs available</p>
                )}
              </div>
            )}

            {/* Show current job if job_id exists */}
            {interview?.job_id && selectedJob && (
              <div className="mb-2 p-2 bg-gray-50 rounded border">
                <div className="flex items-center gap-2 text-xs text-gray-700">
                  <Building className="w-3 h-3" />
                  <span className="font-medium">{selectedJob.title}</span>
                  <span>•</span>
                  <span>{selectedJob.location}</span>
                </div>
              </div>
            )}
            
            {/* Status Options */}
            <div className="space-y-1 mb-2">
              {statusOptions.map((option) => {
                const Icon = option.icon;
                const isCurrentStatus = currentApplication?.status === option.value;
                const isDisabled = isUpdating || isCurrentStatus || (!interview?.job_id && !selectedJobId);
                
                return (
                  <button
                    key={option.value}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log(`Button clicked for status: ${option.value}`);
                      handleStatusUpdate(option.value);
                    }}
                    disabled={isDisabled}
                    className={`w-full text-left p-2 rounded-md border transition-colors ${
                      isCurrentStatus
                        ? 'bg-gray-100 border-gray-300 cursor-not-allowed'
                        : isDisabled
                        ? 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-gray-500" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 text-xs">{option.label}</span>
                          {isCurrentStatus && (
                            <Badge variant="outline" size="xs">Current</Badge>
                          )}
                          {isUpdating && (
                            <div className="animate-spin rounded-full h-2 w-2 border-b-2 border-blue-600"></div>
                          )}
                        </div>
                        <p className="text-xs text-gray-600">{option.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Notes Section */}
            <div className="mb-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes..."
                rows={2}
                className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
              />
            </div>

            {/* Helper text for job selection */}
            {!interview?.job_id && !selectedJobId && (
              <div className="mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-xs text-yellow-800">
                  Please select a job position to add this candidate to your pipeline.
                </p>
              </div>
            )}

            {/* Close Button */}
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsOpen(false);
                  setNotes('');
                }}
                disabled={isUpdating}
                className="text-xs px-2 py-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationStatusManager; 
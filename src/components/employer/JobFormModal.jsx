import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import Button from '../common/Button';
import Stepper from '../common/Stepper';
import { useJobPost } from '../../hooks/employer';
import { useJobsStore } from '../../stores/jobsStore';
import Confetti from '../common/Confetti';

// Form Steps Components
import JobTypeForm from './job-forms/JobTypeForm';
import JobDetailsForm from './job-forms/JobDetailsForm';
import RequirementsForm from './job-forms/RequirementsForm';
import CompensationForm from './job-forms/CompensationForm';
import ReviewForm from './job-forms/ReviewForm';

const FORM_STEPS = [
  { id: 'type', title: 'Job Type' },
  { id: 'details', title: 'Job Details' },
  { id: 'requirements', title: 'Requirements' },
  { id: 'compensation', title: 'Compensation' },
  { id: 'review', title: 'Review' }
];

const JobFormModal = ({ isOpen, onClose, initialData = null }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const { createJob, updateJob, loading, error } = useJobPost();
  const [showConfetti, setShowConfetti] = useState(false);
  const addJob = useJobsStore((state) => state.addJob);
  const updateJobInStore = useJobsStore((state) => state.updateJob);
  const [formData, setFormData] = useState({
    // Job Type
    job_type: '',
    role_type: '',
    
    // Job Details
    title: '',
    description: '',
    responsibilities: '',
    location: '',
    is_remote: false,
    is_hybrid: false,
    start_date: null,
    application_deadline: null,
    priority: 'normal',
    status: 'draft',
    
    // Requirements
    requirements: '',
    experience_level: 'mid',
    skills_required: [],
    drivers_license: '',
    preferred_language: '',
    additional_questions: [],
    
    // Compensation
    employment_type: 'full_time',
    salary_type: 'fixed',
    salary_currency: 'EUR',
    salary_min: '',
    salary_max: '',
    salary_fixed: '',
    salary_period: 'yearly',
    benefits: [],
    equity_offered: false,
    equity_details: ''
  });

  useEffect(() => {
    if (initialData) {
      // Transform salary range data from DB format to form format
      const salaryRange = initialData.salary_range || {};
      const transformedData = {
        ...initialData,
        salary_type: salaryRange.type || 'fixed',
        salary_currency: salaryRange.currency || 'EUR',
        salary_period: salaryRange.period || 'yearly',
        salary_fixed: salaryRange.fixed || '',
        salary_min: salaryRange.min || '',
        salary_max: salaryRange.max || '',
      };
      setFormData(prev => ({
        ...prev,
        ...transformedData
      }));
    }
  }, [initialData]);

  const handleStepSubmit = (stepData) => {
    setFormData(prev => ({
      ...prev,
      ...stepData
    }));
  };

  const handleContinue = () => {
    if (currentStep < FORM_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
      // Scroll to top when moving to next step
      document.getElementById('modal-content').scrollTop = 0;
    } else {
      handleFinalSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      // Scroll to top when going back
      document.getElementById('modal-content').scrollTop = 0;
    }
  };

  const handleFinalSubmit = async () => {
    try {
      let savedJob;
      if (initialData?.id) {
        savedJob = await updateJob(initialData.id, formData);
        updateJobInStore(initialData.id, savedJob);
      } else {
        savedJob = await createJob(formData);
      }
      
      // Show success celebration
      setShowConfetti(true);
      
      // Close modal after a short delay
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Error saving job:', err);
      // You might want to show an error toast/notification here
    }
  };

  if (!isOpen) return null;

  const renderStep = () => {
    const stepProps = {
      data: formData,
      onSubmit: handleStepSubmit
    };

    switch (currentStep) {
      case 0:
        return <JobTypeForm {...stepProps} />;
      case 1:
        return <JobDetailsForm {...stepProps} />;
      case 2:
        return <RequirementsForm {...stepProps} />;
      case 3:
        return <CompensationForm {...stepProps} />;
      case 4:
        return <ReviewForm {...stepProps} isEditing={!!initialData} />;
      default:
        return null;
    }
  };

  const isStepValid = () => {
    // Basic validation rules for each step
    switch (currentStep) {
      case 0:
        return formData.job_type && formData.role_type;
      case 1:
        return formData.title && formData.description;
      case 2:
        return formData.requirements && formData.experience_level && formData.skills_required.length > 0;
      case 3:
        return formData.employment_type && (
          formData.salary_type === 'negotiable' ||
          (formData.salary_type === 'fixed' && formData.salary_fixed) ||
          (formData.salary_type === 'range' && formData.salary_min && formData.salary_max)
        );
      case 4:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black bg-opacity-50">
      {showConfetti && <Confetti />}
      <div className="min-h-screen w-full py-8 px-4 flex items-center justify-center">
        <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
          {/* Header - Fixed */}
          <div className="flex-none border-b border-gray-200">
            <div className="px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                {initialData ? 'Edit Job Posting' : 'Create New Job Posting'}
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            {/* Stepper - Fixed */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
              <Stepper
                steps={FORM_STEPS}
                currentStep={currentStep}
                onStepClick={(step) => {
                  if (step < currentStep) {
                    setCurrentStep(step);
                    document.getElementById('modal-content').scrollTop = 0;
                  }
                }}
              />
            </div>
          </div>

          {/* Content - Scrollable */}
          <div 
            id="modal-content"
            className="flex-1 overflow-y-auto px-6 py-6"
            style={{ scrollbarWidth: 'thin', scrollbarColor: '#CBD5E0 #F7FAFC' }}
          >
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}
            {renderStep()}
          </div>

          {/* Footer - Fixed */}
          <div className="flex-none border-t border-gray-200 px-6 py-4 bg-white">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                Step {currentStep + 1} of {FORM_STEPS.length}
              </div>
              <div className="flex space-x-3">
                <Button
                  onClick={handleBack}
                  variant="outline"
                  disabled={currentStep === 0}
                >
                  Back
                </Button>
                <Button
                  onClick={handleContinue}
                  disabled={!isStepValid() || loading}
                  variant="primary"
                >
                  {loading ? 'Saving...' : currentStep === FORM_STEPS.length - 1 ? (initialData ? 'Save Changes' : 'Post Job') : 'Continue'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobFormModal; 
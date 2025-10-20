import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Bot, Send, CheckCircle, AlertCircle, ArrowUpCircle, ArrowDownCircle, Circle, Loader, Sparkles } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import Button from '../../components/common/Button';
import MarkdownRenderer from '../../components/common/MarkdownRenderer';
// import SupportTierCard from '../../components/employer/SupportTierCard'; // Disabled support tiers
import Confetti from '../../components/common/Confetti';
import { useJobCreationAI } from '../../hooks/employer';
import { useJobPost } from '../../hooks/employer/useJobPost';
import { useJobsStore } from '../../stores/jobsStore';
import { useToast } from '../../hooks/common/useToast';
import { useEmailNotifications } from '../../hooks/common';
import { useAuth } from '../../hooks/common/useAuth';
import iconmark from '../../assets/logos/iconmark.svg';

// Streaming dots component
const StreamingDots = () => {
  const { t } = useTranslation('employer');
  const [dots, setDots] = useState('');
  
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev.length >= 5) return '.';
        return prev + '.';
      });
    }, 300);
    
    return () => clearInterval(interval);
  }, []);
  
  return <span>{t('createJobPage.ai.thinking')}{dots}</span>;
};

// Markdown-like message formatter
const formatMessage = (content) => {
  if (!content) return null;
  
  // Use MarkdownRenderer for AI messages
  return <MarkdownRenderer content={content} />;
};

const FIELD_LABELS = {
  title: 'Job Title',
  description: 'Description',
  requirements: 'Requirements',
  responsibilities: 'Responsibilities',
  location: 'Location',
  featureImageUrl: 'Feature Image URL',
  isRemote: 'Remote',
  isHybrid: 'Hybrid',
  jobType: 'Job Type',
  experienceLevel: 'Experience Level',
  salaryRange: 'Salary Range',
  skillsRequired: 'Skills Required',
  benefits: 'Benefits',
  applicationDeadline: 'Application Deadline',
  startDate: 'Start Date',
  supportTierId: 'Support Tier ID',
  driversLicense: "Driver's License", 
  additionalQuestions: 'Additional Questions',
  preferredLanguage: 'Preferred Language',
  priority: 'Priority',
};

const JOB_TYPE_OPTIONS = [
  { value: 'internship', label: 'Internship' },
  { value: 'permanent', label: 'Permanent' },
  { value: 'contract', label: 'Contract' },
  { value: 'full_time', label: 'Full-time' },
  { value: 'part_time', label: 'Part-time' },
  { value: 'freelance', label: 'Freelance' },
];

const EXPERIENCE_LEVEL_OPTIONS = [
  { value: 'entry', label: 'Entry' },
  { value: 'junior', label: 'Junior' },
  { value: 'mid', label: 'Mid' },
  { value: 'senior', label: 'Senior' },
  { value: 'lead', label: 'Lead' },
  { value: 'director', label: 'Director' },
];

const DRIVERS_LICENSE_OPTIONS = [
  { value: 'preferred', label: 'Preferred' },
  { value: 'required', label: 'Required' },
  { value: 'not_required', label: 'Not Required' },
];

const LANGUAGE_OPTIONS = [
  { value: 'german', label: 'German' },
  { value: 'english', label: 'English' },
  { value: 'both', label: 'Both German and English' },
];

const PRIORITY_OPTIONS = [
  { 
    value: 'high', 
    label: 'High Priority', 
    description: 'Urgent hiring needs',
    icon: <ArrowUpCircle className="w-8 h-8" />,
    color: 'text-red-500',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    selectedBg: 'bg-red-100',
    selectedBorder: 'border-red-400'
  },
  { 
    value: 'medium', 
    label: 'Medium Priority', 
    description: 'Standard timeline',
    icon: <Circle className="w-8 h-8" />,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    selectedBg: 'bg-yellow-100',
    selectedBorder: 'border-yellow-400'
  },
  { 
    value: 'low', 
    label: 'Low Priority', 
    description: 'Flexible timeline',
    icon: <ArrowDownCircle className="w-8 h-8" />,
    color: 'text-green-500',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    selectedBg: 'bg-green-100',
    selectedBorder: 'border-green-400'
  },
];

const SUPPORT_TIERS = [
  {
    value: 1, // Changed to numeric ID
    title: 'Basic',
    subtitle: 'Essential hiring tools',
    price: 'Free',
    period: '',
    description: 'Access to recommended candidates for your jobs without AI insights',
    features: ['Candidate recommendations', 'Basic job listing', 'Email notifications', 'Standard support'],
    popular: false,
    color: 'blue'
  },
  {
    value: 2, // Changed to numeric ID
    title: 'Professional',
    subtitle: 'AI-powered insights + Marketing',
    price: '€299',
    period: 'one-time',
    description: 'Everything in Basic plus AI insights, recommendations, and job marketing across platforms',
    features: ['Everything in Basic', 'AI candidate insights', 'Smart recommendations', 'Candidate scoring', 'Priority support', 'Advanced analytics', 'Multi-platform job marketing', 'Social media promotion'],
    popular: true,
    color: 'violet'
  },
  {
    value: 3, // Changed to numeric ID
    title: 'Advanced',
    subtitle: 'Full migration support',
    price: '10% of annual salary',
    period: 'per hire',
    description: 'Complete visa processing, migration support, accommodation, and travel assistance',
    features: ['Everything in Professional', 'Visa processing support', 'Migration assistance', 'Accommodation arrangements', 'Travel coordination', 'Dedicated account manager', 'Legal compliance support'],
    popular: false,
    color: 'orange'
  },
];

// Section wrapper component - moved outside to prevent re-creation
const Section = React.memo(({ title, children }) => (
  <div className="mb-8 bg-white rounded-2xl shadow-sm border border-primary-100 p-6">
    <h2 className="text-lg font-semibold text-primary-600 mb-4 tracking-tight">{title}</h2>
    <div className="space-y-4">{children}</div>
  </div>
));

// Priority Card Component
const PriorityCard = React.memo(({ option, isSelected, onSelect }) => (
  <div
    className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
      isSelected 
        ? `${option.selectedBg} ${option.selectedBorder} shadow-md` 
        : `${option.bgColor} ${option.borderColor} hover:${option.selectedBg}`
    }`}
    onClick={() => onSelect(option.value)}
  >
    <div className="flex flex-col items-center text-center space-y-3">
      <div className={option.color}>
        {option.icon}
      </div>
      <div>
        <h3 className="font-semibold text-gray-900">{option.label}</h3>
        <p className="text-sm text-gray-600 mt-1">{option.description}</p>
      </div>
    </div>
    {isSelected && (
      <div className="absolute top-3 right-3">
        <CheckCircle className="w-5 h-5 text-primary-600" />
      </div>
    )}
  </div>
));

export default function CreateJobPage() {
  const { t } = useTranslation('employer');
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if we're editing an existing job
  const editJob = location.state?.editJob;
  const isEditMode = !!editJob;

  // Local form state - Initialize with editJob data if available
  const [formData, setFormData] = useState(() => {
    if (isEditMode && editJob) {
      return {
        title: editJob.title || '',
        description: editJob.description || '',
        requirements: editJob.requirements || '',
        responsibilities: editJob.responsibilities || '',
        location: editJob.location || '',
        featureImageUrl: editJob.feature_image_url || '',
        isRemote: editJob.is_remote || false,
        isHybrid: editJob.is_hybrid || false,
        jobType: editJob.job_type || 'internship',
        experienceLevel: editJob.experience_level || 'entry',
        salaryMin: editJob.salary_range?.min || '',
        salaryMax: editJob.salary_range?.max || '',
        salaryCurrency: editJob.salary_range?.currency || 'EUR',
        skillsRequired: editJob.skills_required || [],
        benefits: editJob.benefits || [],
        applicationDeadline: editJob.application_deadline || '',
        startDate: editJob.start_date || '',
        supportTierId: 1, // Default to basic tier (disabled)
        driversLicense: editJob.drivers_license || 'preferred',
        additionalQuestions: editJob.additional_questions || [],
        preferredLanguage: editJob.preferred_language || 'german',
        priority: editJob.priority || 'medium',
      };
    }
    
    // Default form state for new job
    return {
      title: '',
      description: '',
      requirements: '',
      responsibilities: '',
      location: '',
      featureImageUrl: '',
      isRemote: false,
      isHybrid: false,
      jobType: 'internship',
      experienceLevel: 'entry',
      salaryMin: '',
      salaryMax: '',
      salaryCurrency: 'EUR',
      skillsRequired: [],
      benefits: [],
      applicationDeadline: '',
      startDate: new Date().toISOString().split('T')[0], // Default to current date
      supportTierId: 1, // Default to basic tier (disabled)
      driversLicense: 'preferred',
      additionalQuestions: [],
      preferredLanguage: 'german',
      priority: 'medium',
    };
  });

  // Raw input state for array fields
  const [rawInputs, setRawInputs] = useState(() => {
    if (isEditMode && editJob) {
      return {
        benefits: (editJob.benefits || []).join(', '),
        additionalQuestions: (editJob.additional_questions || []).join(', ')
      };
    }
    return {
      benefits: '',
      additionalQuestions: ''
    };
  });

  // Skills input state
  const [skillInput, setSkillInput] = useState('');

  // AI Chat integration
  const {
    sendJobCreationMessage,
    sendJobCreationMessageStream,
    isLoading: aiLoading,
    error: aiError,
    messages: aiMessages,
    clearConversation,
    clearError
  } = useJobCreationAI();

  // Job posting integration
  const { createJob, updateJob, loading: jobLoading, error: jobError } = useJobPost();
  const { addJob, updateJob: updateJobInStore } = useJobsStore();
  const { success, error: showError } = useToast();
  
  // Email notifications
  const { sendJobPostedNotification, isLoading: emailLoading, error: emailError } = useEmailNotifications();
  const { user } = useAuth();

  // Chat state
  const [inputValue, setInputValue] = useState('');
  const [streamingContent, setStreamingContent] = useState('');
  const [isGeneratingJobData, setIsGeneratingJobData] = useState(false);
  const messagesEndRef = useRef(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showAIUpdateNotification, setShowAIUpdateNotification] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Validation state
  const [validationErrors, setValidationErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Scroll to last message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [aiMessages, streamingContent]);

  // Generic handler for form field updates - using useCallback to prevent re-creation
  const handleFieldChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear validation error for this field when user updates it
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [validationErrors]);

  // Handlers for array fields - using useCallback
  const handleArrayChange = useCallback((field, value) => {
    // For real-time input, just store the raw string value
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Process array fields when user finishes editing
  const handleArrayBlur = useCallback((field, value) => {
    // Split by comma and trim each item, filter out empty strings
    const arrayValue = value.split(',').map((v) => v.trim()).filter(Boolean);
    setFormData(prev => ({
      ...prev,
      [field]: arrayValue
    }));
  }, []);

  // Skills handlers
  const handleAddSkill = useCallback(() => {
    if (skillInput.trim() && !formData.skillsRequired.includes(skillInput.trim())) {
      setFormData(prev => ({
        ...prev,
        skillsRequired: [...prev.skillsRequired, skillInput.trim()]
      }));
      setSkillInput('');
    }
  }, [skillInput, formData.skillsRequired]);

  const handleRemoveSkill = useCallback((skillToRemove) => {
    setFormData(prev => ({
      ...prev,
      skillsRequired: prev.skillsRequired.filter(skill => skill !== skillToRemove)
    }));
  }, []);

  const handleSkillKeyPress = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSkill();
    }
  }, [handleAddSkill]);

  // Handler for boolean fields - using useCallback
  const handleBooleanChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value === 'true'
    }));
  }, []);

  // Update form data from AI response
  const updateFormFromAI = useCallback((aiData) => {
    setFormData(prev => {
      const updated = { ...prev };
      
      // Update all fields that are provided by AI
      Object.keys(aiData).forEach(key => {
        if (aiData[key] !== undefined && aiData[key] !== null && aiData[key] !== '') {
          updated[key] = aiData[key];
        }
      });
      
      return updated;
    });
    
    // Show notification
    setShowAIUpdateNotification(true);
    
    // Hide notification after 3 seconds
    setTimeout(() => {
      setShowAIUpdateNotification(false);
    }, 3000);
  }, []);

  // Chat send handler with streaming AI integration
  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || aiLoading) return;
    
    const userMessage = inputValue;
    setInputValue('');
    setStreamingContent('');
    setIsGeneratingJobData(false);
    clearError();

    try {
      // Use streaming for real-time response
      const response = await sendJobCreationMessageStream(
        userMessage, 
        formData,
        (chunk, fullContent, hasJobData) => {
          setStreamingContent(fullContent);
          // Show job data generation indicator as soon as we detect data
          if (hasJobData && !isGeneratingJobData) {
            setIsGeneratingJobData(true);
          }
        }
      );
      
      // Clear streaming content when done
      setStreamingContent('');
      
      // Update form data if we have it
      if (response.data && Object.keys(response.data).length > 0) {
        // If we're already showing the job data indicator, add a delay
        // Otherwise, show it briefly and then update
        if (isGeneratingJobData) {
          setTimeout(() => {
            updateFormFromAI(response.data);
            setIsGeneratingJobData(false);
          }, 1000);
        } else {
          setIsGeneratingJobData(true);
          setTimeout(() => {
            updateFormFromAI(response.data);
            setIsGeneratingJobData(false);
          }, 1500);
        }
      } else if (isGeneratingJobData) {
        // No data received but indicator is showing, hide it
        setIsGeneratingJobData(false);
      }
    } catch (error) {
      console.error('Failed to send streaming message:', error);
      setStreamingContent('');
      setIsGeneratingJobData(false);
    }
  }, [inputValue, aiLoading, sendJobCreationMessageStream, formData, updateFormFromAI, clearError, isGeneratingJobData]);

  // Reset form
  const handleReset = useCallback(() => {
    setShowResetConfirm(true);
  }, []);
  
  const confirmReset = useCallback(() => {
    setFormData({
      title: '',
      description: '',
      requirements: '',
      responsibilities: '',
      location: '',
      featureImageUrl: '',
      isRemote: false,
      isHybrid: false,
      jobType: 'internship',
      experienceLevel: 'entry',
      salaryMin: '',
      salaryMax: '',
      salaryCurrency: 'EUR',
      skillsRequired: [],
      benefits: [],
      applicationDeadline: '',
      startDate: '',
      supportTierId: 1, // Default to basic tier (disabled)
      driversLicense: 'preferred',
      additionalQuestions: [],
      preferredLanguage: 'german',
      priority: 'medium',
    });
    clearConversation();
    setStreamingContent('');
    setIsGeneratingJobData(false);
    setShowResetConfirm(false);
  }, [clearConversation]);
  
  const cancelReset = useCallback(() => {
    setShowResetConfirm(false);
  }, []);

  // Form validation function
  const validateForm = useCallback(() => {
    const errors = {};
    
    // Required fields validation
    if (!formData.title.trim()) {
      errors.title = t('createJobPage.notifications.validationErrors.title');
    }
    
    if (!formData.description.trim()) {
      errors.description = t('createJobPage.notifications.validationErrors.description');
    }
    
    // Salary validation - if one field is filled, both should be filled
    if ((formData.salaryMin && !formData.salaryMax) || (!formData.salaryMin && formData.salaryMax)) {
      errors.salary = t('createJobPage.notifications.validationErrors.salary');
    }
    
    // Salary range logical validation
    if (formData.salaryMin && formData.salaryMax) {
      const min = parseFloat(formData.salaryMin);
      const max = parseFloat(formData.salaryMax);
      if (min >= max) {
        errors.salary = t('createJobPage.notifications.validationErrors.salaryLogic');
      }
    }
    
    // Date validation
    if (formData.applicationDeadline && formData.startDate) {
      const deadlineDate = new Date(formData.applicationDeadline);
      const startDate = new Date(formData.startDate);
      if (deadlineDate <= startDate) {
        errors.dates = t('createJobPage.notifications.validationErrors.dates');
      }
    }
    
    // URL validation for feature image
    if (formData.featureImageUrl && formData.featureImageUrl.trim()) {
      try {
        new URL(formData.featureImageUrl);
      } catch {
        errors.featureImageUrl = t('createJobPage.notifications.validationErrors.featureImageUrl');
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData, t]);

  // Handle job creation/editing
  const handleCreateJob = useCallback(async () => {
    if (!validateForm()) {
      showError(t('createJobPage.toasts.validationError'));
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Prepare job data for backend
      const jobPayload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        requirements: formData.requirements.trim(),
        responsibilities: formData.responsibilities.trim(),
        location: formData.location.trim(),
        feature_image_url: formData.featureImageUrl.trim() || null,
        is_remote: formData.isRemote,
        is_hybrid: formData.isHybrid,
        job_type: formData.jobType,
        experience_level: formData.experienceLevel,
        skills_required: formData.skillsRequired,
        benefits: rawInputs.benefits.split(',').map(s => s.trim()).filter(Boolean),
        application_deadline: formData.applicationDeadline || null,
        start_date: formData.startDate || null,
        drivers_license: formData.driversLicense,
        additional_questions: rawInputs.additionalQuestions.split(',').map(s => s.trim()).filter(Boolean),
        preferred_language: formData.preferredLanguage,
        priority: formData.priority,
        status: isEditMode ? editJob.status : 'active', // Keep existing status when editing
        
        // Handle salary data
        salary_type: (formData.salaryMin && formData.salaryMax) ? 'range' : 'negotiable',
        salary_currency: formData.salaryCurrency,
        salary_period: 'annually', // Default to annually
        ...(formData.salaryMin && formData.salaryMax && {
          salary_min: parseFloat(formData.salaryMin),
          salary_max: parseFloat(formData.salaryMax)
        }),
        
        // Support tier ID (1, 2, or 3)
        support_tier_id: formData.supportTierId
      };
      
      let result;
      if (isEditMode) {
        // Update existing job
        result = await updateJob(editJob.id, jobPayload);
        updateJobInStore(editJob.id, result);
        success(t('createJobPage.toasts.updateSuccess'));
      } else {
        // Create new job
        result = await createJob(jobPayload);
        addJob(result);
        success(t('createJobPage.toasts.createSuccess'));
        
        // Send email notification for new job posting
        if (user?.email && result) {
          try {
            await sendJobPostedNotification({
              to: user.email,
              jobData: result,
              urls: {
                jobUrl: `${window.location.origin}/jobs/${result.id}`,
                dashboardUrl: `${window.location.origin}/dashboard/jobs`
              }
            });
            console.log('Job posting notification email sent successfully');
          } catch (emailErr) {
            console.error('Failed to send job posting notification email:', emailErr);
            // Don't fail the entire job creation process if email fails
            // Just log the error silently
          }
        }
      }
      
      // Show success celebration
      setShowConfetti(true);
      
      // Navigate to jobs page after a short delay to show confetti
      setTimeout(() => {
        navigate('/dashboard/jobs', { state: { fromCreateJob: true } });
      }, 2000);
      
    } catch (error) {
      console.error(`Failed to ${isEditMode ? 'update' : 'create'} job:`, error);
      showError(error.message || t(isEditMode ? 'createJobPage.toasts.updateError' : 'createJobPage.toasts.createError'));
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm, createJob, updateJob, showError, navigate, addJob, updateJobInStore, isEditMode, editJob, rawInputs, t, user, sendJobPostedNotification]);

  return (
    <div className="w-full min-h-screen bg-white flex flex-col overflow-hidden">
      {/* Close Button with Back Navigation */}
      <button
        className="absolute top-6 right-8 z-20 p-2 rounded-full hover:bg-primary-100 transition"
        onClick={() => navigate(-1)}
        aria-label={t('createJobPage.form.backAriaLabel')}
      >
        <X className="w-6 h-6 text-primary-600" />
      </button>
      <div className="flex flex-1 min-h-0 h-[100vh]">
        {/* Left: AI Chatbot */}
        <aside className="hidden md:flex flex-col w-2/5 max-w-lg bg-primary-50 border-r border-primary-100 p-0 min-h-full relative">
          <div className="flex items-center gap-2 px-8 pt-8 pb-4">
            <Bot className="text-primary-600" />
            <span className="font-semibold text-primary-600 text-lg">{t('createJobPage.ai.title')}</span>
            {aiLoading && <Loader className="w-4 h-4 animate-spin text-primary-600" />}
          </div>
          
          {/* Error display */}
          {aiError && (
            <div className="mx-8 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-700 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{t('createJobPage.ai.errorPrefix')}: {aiError}</span>
              </div>
            </div>
          )}

          {/* Chat messages area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto px-8 pb-4" style={{ maxHeight: 'calc(100vh - 180px)' }}>
              {aiMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 text-center pt-16">
                  <Sparkles className="w-12 h-12 mb-4 text-primary-300" />
                  <span className="mb-2 font-medium">{t('createJobPage.ai.readyTitle')}</span>
                  <span className="text-sm max-w-xs mb-6">{t('createJobPage.ai.readySubtitle')}</span>
                  
                  {/* Quick starter prompts */}
                  <div className="space-y-2 max-w-xs">
                    <p className="text-xs text-gray-500 mb-3">{t('createJobPage.ai.examplesTitle')}</p>
                    {[
                      t('createJobPage.ai.prompt1'),
                      t('createJobPage.ai.prompt2'),
                      t('createJobPage.ai.prompt3')
                    ].map((prompt, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setInputValue(prompt);
                          // Auto-send the message with streaming
                          setTimeout(async () => {
                            if (!aiLoading) {
                              // Manually call the streaming handler
                              const userMessage = prompt;
                              setInputValue('');
                              setStreamingContent('');
                              clearError();

                              try {
                                const response = await sendJobCreationMessageStream(
                                  userMessage, 
                                  formData,
                                  (chunk, fullContent) => {
                                    setStreamingContent(fullContent);
                                  }
                                );
                                
                                setStreamingContent('');
                                
                                if (response.data && Object.keys(response.data).length > 0) {
                                  updateFormFromAI(response.data);
                                }
                              } catch (error) {
                                console.error('Failed to send streaming message:', error);
                                setStreamingContent('');
                              }
                            }
                          }, 100);
                        }}
                        className="block w-full text-left p-2 rounded-lg border border-primary-200 bg-white text-gray-700 text-xs hover:bg-primary-50 hover:border-primary-300 transition-colors"
                      >
                        "{prompt}"
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  {aiMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`group flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex max-w-[85%] ${msg.type === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start gap-3`}>
                        {msg.type === 'ai' && (
                          <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center flex-shrink-0 shadow-sm border border-gray-200">
                            <img src={iconmark} alt="Velai" className="w-6 h-6 object-contain" />
                          </div>
                        )}
                        <div className="flex-1">
                          {msg.type === 'ai' && (
                            <div className="font-bold text-gray-900 text-sm mb-2">{t('createJobPage.ai.assistantName')}</div>
                          )}
                          <div className={`${
                            msg.type === 'user'
                              ? 'rounded-2xl px-5 py-4 bg-white border border-gray-200 text-gray-900 shadow-sm'
                              : 'text-gray-900' // No background for AI messages
                          }`}>
                            {/* Message content */}
                            <div className="text-sm leading-relaxed">
                              {msg.type === 'ai' ? (
                                formatMessage(msg.content)
                              ) : (
                                msg.content
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Show streaming content if available */}
                  {(aiLoading || streamingContent) && (
                    <div className="flex justify-start">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center flex-shrink-0 shadow-sm border border-gray-200">
                          <img src={iconmark} alt="Velai" className="w-6 h-6 object-contain" />
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-gray-900 text-sm mb-2">{t('createJobPage.ai.assistantName')}</div>
                          <div className="text-gray-900 text-sm leading-relaxed">
                            {streamingContent && streamingContent.trim() ? formatMessage(streamingContent) : (
                              <div className="text-gray-500 italic">
                                <StreamingDots />
                              </div>
                            )}
                            {streamingContent && streamingContent.trim() && (
                              <span className="text-gray-400 ml-1">...</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Show job data generation indicator */}
                  {isGeneratingJobData && (
                    <div className="flex justify-start mt-4">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 bg-primary-50 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm border border-primary-200">
                          <Sparkles className="w-5 h-5 text-primary-600 animate-pulse" />
                        </div>
                        <div className="flex-1">
                          <div className="bg-primary-50 border border-primary-200 rounded-lg p-3">
                            <div className="flex items-center gap-2">
                              <Loader className="w-4 h-4 animate-spin text-primary-600" />
                              <span className="text-sm font-medium text-primary-700">{t('createJobPage.ai.generatingData')}</span>
                            </div>
                            <p className="text-xs text-primary-600 mt-1">
                              {t('createJobPage.ai.processing')}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
            {/* Input at bottom */}
            <form
              className="flex items-center gap-2 px-8 py-4 border-t border-primary-100 bg-primary-50"
              onSubmit={e => { e.preventDefault(); handleSendMessage(); }}
            >
              <input
                type="text"
                className="flex-1 rounded-lg border border-primary-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200 bg-white disabled:opacity-50"
                placeholder={t('createJobPage.ai.inputPlaceholder')}
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                disabled={aiLoading}
              />
              
              {/* Clear conversation button */}
              {aiMessages.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={clearConversation}
                  className="text-xs"
                  disabled={aiLoading}
                >
                  {t('createJobPage.ai.clear')}
                </Button>
              )}
              
              {/* Send button */}
              <Button
                type="submit"
                variant="primary"
                size="md"
                icon={aiLoading ? <Loader className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                iconPosition="right"
                className="!rounded-full"
                aria-label={t('createJobPage.ai.send')}
                disabled={aiLoading || !inputValue.trim()}
              >
              </Button>
            </form>
          </div>
        </aside>
        {/* Right: Job Form (scrollable) */}
        <main className="flex-1 flex flex-col items-center p-8 overflow-y-auto h-screen" style={{ maxHeight: '100vh' }}>
          <div className="w-full max-w-2xl">
            <h1 className="text-2xl font-bold text-primary-600 mb-8">
              {isEditMode ? t('createJobPage.form.editTitle') : t('createJobPage.form.createTitle')}
            </h1>
            
            {/* AI Update Notification */}
            {showAIUpdateNotification && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg animate-fade-in">
                <div className="flex items-center gap-2 text-green-700">
                  <Sparkles className="w-5 h-5" />
                  <span className="font-medium">{t('createJobPage.notifications.aiUpdateTitle')}</span>
                </div>
                <p className="text-sm text-green-600 mt-1">
                  {t('createJobPage.notifications.aiUpdateMessage')}
                </p>
              </div>
            )}
            
            {/* Validation Errors */}
            {Object.keys(validationErrors).length > 0 && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-700 mb-2">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">{t('createJobPage.notifications.validationTitle')}</span>
                </div>
                <ul className="text-sm text-red-600 list-disc list-inside space-y-1">
                  {Object.entries(validationErrors).map(([field, error]) => (
                    <li key={field}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Job Error from Backend */}
            {jobError && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">{t('createJobPage.notifications.backendErrorTitle')}</span>
                </div>
                <p className="text-sm text-red-600 mt-1">{jobError}</p>
              </div>
            )}
            
            {/* Priority Selection - At the top */}
            <Section title={t('createJobPage.sections.priority')}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {PRIORITY_OPTIONS.map((option) => (
                  <PriorityCard
                    key={option.value}
                    option={option}
                    isSelected={formData.priority === option.value}
                    onSelect={(value) => handleFieldChange('priority', value)}
                  />
                ))}
              </div>
            </Section>

            {/* Section 1: Basic Info */}
            <Section title={t('createJobPage.sections.basicInfo')}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block font-semibold mb-1">{FIELD_LABELS.title} *</label>
                  <input
                    type="text"
                    className={`w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200 ${
                      validationErrors.title ? 'border-red-300 focus:ring-red-200' : 'border-primary-100'
                    }`}
                    value={formData.title}
                    onChange={e => handleFieldChange('title', e.target.value)}
                    required
                  />
                  {validationErrors.title && (
                    <p className="text-red-600 text-xs mt-1">{validationErrors.title}</p>
                  )}
                </div>
                <div>
                  <label className="block font-semibold mb-1">{FIELD_LABELS.location}</label>
                  <input
                    type="text"
                    className="w-full border border-primary-100 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200"
                    value={formData.location}
                    onChange={e => handleFieldChange('location', e.target.value)}
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block font-semibold mb-1">{FIELD_LABELS.description} *</label>
                <textarea
                  className={`w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 min-h-[100px] ${
                    validationErrors.description ? 'border-red-300 focus:ring-red-200' : 'border-primary-100 focus:ring-primary-200'
                  }`}
                  value={formData.description}
                  onChange={e => handleFieldChange('description', e.target.value)}
                  required
                />
                {validationErrors.description && (
                  <p className="text-red-600 text-xs mt-1">{validationErrors.description}</p>
                )}
              </div>
            </Section>
            {/* Section 2: Details */}
            <Section title={t('createJobPage.sections.jobDetails')}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block font-semibold mb-1">{FIELD_LABELS.jobType}</label>
                  <select
                    className="w-full border border-primary-100 rounded-lg px-4 py-2"
                    value={formData.jobType}
                    onChange={e => handleFieldChange('jobType', e.target.value)}
                  >
                    {JOB_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">{FIELD_LABELS.experienceLevel}</label>
                  <select
                    className="w-full border border-primary-100 rounded-lg px-4 py-2"
                    value={formData.experienceLevel}
                    onChange={e => handleFieldChange('experienceLevel', e.target.value)}
                  >
                    {EXPERIENCE_LEVEL_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">{FIELD_LABELS.isRemote}</label>
                  <select
                    className="w-full border border-primary-100 rounded-lg px-4 py-2"
                    value={formData.isRemote ? 'true' : 'false'}
                    onChange={e => handleBooleanChange('isRemote', e.target.value)}
                  >
                    <option value="false">{t('createJobPage.form.no')}</option>
                    <option value="true">{t('createJobPage.form.yes')}</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">{FIELD_LABELS.isHybrid}</label>
                  <select
                    className="w-full border border-primary-100 rounded-lg px-4 py-2"
                    value={formData.isHybrid ? 'true' : 'false'}
                    onChange={e => handleBooleanChange('isHybrid', e.target.value)}
                  >
                    <option value="false">{t('createJobPage.form.no')}</option>
                    <option value="true">{t('createJobPage.form.yes')}</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div>
                  <label className="block font-semibold mb-1">{FIELD_LABELS.startDate}</label>
                  <input
                    type="date"
                    className="w-full border border-primary-100 rounded-lg px-4 py-2"
                    value={formData.startDate}
                    onChange={e => handleFieldChange('startDate', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">{FIELD_LABELS.applicationDeadline}</label>
                  <input
                    type="date"
                    className="w-full border border-primary-100 rounded-lg px-4 py-2"
                    value={formData.applicationDeadline}
                    onChange={e => handleFieldChange('applicationDeadline', e.target.value)}
                  />
                </div>
              </div>
            </Section>
            {/* Section 3: Compensation & Skills */}
            <Section title={t('createJobPage.sections.compensation')}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block font-semibold mb-1">{t('createJobPage.form.minSalary')}</label>
                  <input
                    type="number"
                    placeholder="Min"
                    className="w-full border border-primary-100 rounded-lg px-4 py-2"
                    value={formData.salaryMin}
                    onChange={e => handleFieldChange('salaryMin', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">{t('createJobPage.form.maxSalary')}</label>
                  <input
                    type="number"
                    placeholder="Max"
                    className="w-full border border-primary-100 rounded-lg px-4 py-2"
                    value={formData.salaryMax}
                    onChange={e => handleFieldChange('salaryMax', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">{t('createJobPage.form.currency')}</label>
                  <input
                    type="text"
                    placeholder="Currency"
                    className="w-full border border-primary-100 rounded-lg px-4 py-2"
                    value={formData.salaryCurrency}
                    onChange={e => handleFieldChange('salaryCurrency', e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div>
                  <label className="block font-semibold mb-1">{FIELD_LABELS.skillsRequired}</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      className="flex-1 border border-primary-100 rounded-lg px-4 py-2"
                      placeholder={t('createJobPage.form.skillsPlaceholder')}
                      value={skillInput}
                      onChange={e => setSkillInput(e.target.value)}
                      onKeyPress={handleSkillKeyPress}
                    />
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={handleAddSkill}
                      disabled={!skillInput.trim()}
                      className="px-4"
                    >
                      Add
                    </Button>
                  </div>
                  
                  {/* Skills tags */}
                  {formData.skillsRequired.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.skillsRequired.map((skill, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-1 bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm"
                        >
                          <span>{skill}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSkill(skill)}
                            className="ml-1 hover:text-primary-900 transition-colors"
                            aria-label={`Remove ${skill}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <p className="text-xs text-gray-500 mt-2">{t('createJobPage.form.skillsHelper')}</p>
                </div>
                <div>
                  <label className="block font-semibold mb-1">{FIELD_LABELS.benefits}</label>
                  <input
                    type="text"
                    className="w-full border border-primary-100 rounded-lg px-4 py-2"
                    placeholder={t('createJobPage.form.benefitsPlaceholder')}
                    value={rawInputs.benefits}
                    onChange={e => setRawInputs({ ...rawInputs, benefits: e.target.value })}
                  />
                  <p className="text-xs text-gray-500 mt-1">{t('createJobPage.form.benefitsHelper')}</p>
                </div>
              </div>
            </Section>
            {/* Section 4: Description & Requirements */}
            <Section title={t('createJobPage.sections.description')}>
              <div className="mb-4">
                <label className="block font-semibold mb-1">{FIELD_LABELS.requirements}</label>
                <textarea
                  className="w-full border border-primary-100 rounded-lg px-4 py-2 min-h-[60px]"
                  value={formData.requirements}
                  onChange={e => handleFieldChange('requirements', e.target.value)}
                />
              </div>
              <div className="mb-4">
                <label className="block font-semibold mb-1">{FIELD_LABELS.responsibilities}</label>
                <textarea
                  className="w-full border border-primary-100 rounded-lg px-4 py-2 min-h-[60px]"
                  value={formData.responsibilities}
                  onChange={e => handleFieldChange('responsibilities', e.target.value)}
                />
              </div>
              <div className="mb-4">
                <label className="block font-semibold mb-1">{FIELD_LABELS.featureImageUrl}</label>
                <input
                  type="url"
                  className="w-full border border-primary-100 rounded-lg px-4 py-2"
                  value={formData.featureImageUrl}
                  onChange={e => handleFieldChange('featureImageUrl', e.target.value)}
                />
              </div>
            </Section>
            {/* Section 5: Other Details */}
            <Section title={t('createJobPage.sections.other')}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block font-semibold mb-1">{FIELD_LABELS.driversLicense}</label>
                  <select
                    className="w-full border border-primary-100 rounded-lg px-4 py-2"
                    value={formData.driversLicense}
                    onChange={e => handleFieldChange('driversLicense', e.target.value)}
                  >
                    {DRIVERS_LICENSE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">{FIELD_LABELS.additionalQuestions}</label>
                  <input
                    type="text"
                    className="w-full border border-primary-100 rounded-lg px-4 py-2"
                    placeholder={t('createJobPage.form.questionsPlaceholder')}
                    value={rawInputs.additionalQuestions}
                    onChange={e => setRawInputs({ ...rawInputs, additionalQuestions: e.target.value })}
                  />
                  <p className="text-xs text-gray-500 mt-1">{t('createJobPage.form.questionsHelper')}</p>
                </div>
                <div>
                  <label className="block font-semibold mb-1">{FIELD_LABELS.preferredLanguage}</label>
                  <select
                    className="w-full border border-primary-100 rounded-lg px-4 py-2"
                    value={formData.preferredLanguage}
                    onChange={e => handleFieldChange('preferredLanguage', e.target.value)}
                  >
                    {LANGUAGE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </Section>

            {/* Support Tier Selection - DISABLED */}
            {/* <Section title={t('createJobPage.sections.support')}>
              <div className="space-y-4">
                {SUPPORT_TIERS.map((tier) => (
                  <SupportTierCard
                    key={tier.value}
                    tier={tier}
                    isSelected={formData.supportTierId === tier.value}
                    onSelect={(value) => handleFieldChange('supportTierId', value)}
                  />
                ))}
              </div>
            </Section> */}

            {/* Bottom Bar: Reset & Create/Update Job */}
            <div className="flex items-center justify-between mt-8 gap-4">
              <Button
                variant="outline"
                size="md"
                onClick={handleReset}
                className=""
              >
                {t('createJobPage.form.reset')}
              </Button>
              <Button
                variant="primary"
                size="md"
                className="ml-auto"
                onClick={handleCreateJob}
                disabled={isSubmitting || jobLoading}
                icon={isSubmitting || jobLoading ? <Loader className="w-5 h-5 animate-spin" /> : null}
                iconPosition="left"
              >
                {isSubmitting || jobLoading 
                  ? (isEditMode ? t('createJobPage.form.updating') : t('createJobPage.form.creating'))
                  : (isEditMode ? t('createJobPage.form.update') : t('createJobPage.form.create'))
                }
              </Button>
            </div>
            {/* Reset Confirmation Modal */}
            {showResetConfirm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full border border-primary-100">
                  <h3 className="text-lg font-bold mb-4 text-primary-600">{t('createJobPage.resetModal.title')}</h3>
                  <p className="mb-6 text-gray-700">{t('createJobPage.resetModal.message')}</p>
                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={cancelReset}>{t('createJobPage.resetModal.cancel')}</Button>
                    <Button variant="danger" onClick={confirmReset}>{t('createJobPage.resetModal.confirm')}</Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
      
      {/* Confetti for success celebration */}
      {showConfetti && (
        <Confetti
          onComplete={() => setShowConfetti(false)}
        />
      )}
    </div>
  );
}
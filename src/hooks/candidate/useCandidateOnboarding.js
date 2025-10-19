import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../common';
import { useDocumentUpload } from './useDocumentUpload';
import { supabase } from '../../clients/supabaseClient';
import useEmailNotifications from '../common/useEmailNotifications';

// Basic summary generation function
const generateBasicSummary = (formData) => {
  const { firstName, lastName, currentTitle, experience, skills } = formData;
  
  const experienceText = experience === '0' ? 'entry-level' : 
                        experience === '1' ? '1 year' : 
                        `${experience} years`;
  
  const skillsText = skills.length > 0 ? 
    skills.slice(0, 3).join(', ') + (skills.length > 3 ? `, and ${skills.length - 3} other skills` : '') : 
    'various technical skills';
  
  return `${firstName} ${lastName} is a ${experienceText} ${currentTitle || 'professional'} with expertise in ${skillsText}.`;
};

// Professional summary generation function
const generateProfessionalSummary = (formData) => {
  const {
    firstName,
    lastName,
    currentTitle,
    experience,
    skills,
    education,
    languages,
    currentLocation,
    preferredLocation,
    workType,
    relocatable,
    visaStatus,
    salaryExpectation
  } = formData;

  // Format experience text
  const experienceText = experience === '0' ? 'entry-level' : 
                        experience === '1' ? '1 year' : 
                        `${experience} years`;
  
  // Format skills section (not used in current summary)
  
  // Format languages section
  const languagesText = languages.length > 0 ? 
    languages.map(lang => `${lang.language} (${lang.proficiency})`).join(', ') : 
    'English';
  
  // Format location preferences
  const locationText = preferredLocation && preferredLocation !== 'other' ? 
    `seeking opportunities in ${preferredLocation}` : 
    relocatable ? 'open to relocation opportunities' : 'preferring local opportunities';
  
  // Format work type
  const workTypeText = workType ? 
    workType.charAt(0).toUpperCase() + workType.slice(1).replace('-', ' ') : 
    'full-time';
  
  // Format visa status
  const visaText = visaStatus === 'citizen' ? 'EU citizen with full work authorization' :
                   visaStatus === 'permit' ? 'work permit holder with authorization to work' :
                   visaStatus === 'student' ? 'student visa holder seeking work opportunities' :
                   visaStatus === 'applying' ? 'visa application in progress for work authorization' :
                   'actively seeking work authorization';
  
  // Format salary expectation
  const salaryText = salaryExpectation ? 
    `with salary expectations of ${salaryExpectation}` : 
    'with competitive salary expectations';

  // Generate concise professional summary with skills and job details
  const skillsText = skills.length > 0 ? 
    skills.slice(0, 3).join(', ') + (skills.length > 3 ? `, and ${skills.length - 3} other skills` : '') : 
    'various technical skills';
  
  const jobTypeText = workType ? 
    workType.charAt(0).toUpperCase() + workType.slice(1).replace('-', ' ') : 
    'full-time';
  
  const targetTitle = formData.desiredPosition?.trim() || currentTitle || 'professional';
  const summary = `${firstName} ${lastName} is an ${experienceText} professional seeking a ${targetTitle} ${jobTypeText} position. Skilled in ${skillsText}.`;

  return summary;
};

export const useCandidateOnboarding = () => {
  const { completeOnboarding, user } = useAuth();
  const { uploadDocument, uploading, uploadError, uploadProgress } = useDocumentUpload();
  const { sendOnboardingCompletedNotification } = useEmailNotifications();
  const navigate = useNavigate();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    // Step 1: Personal Information (pre-filled from signup)
    firstName: '',
    lastName: '',
    email: '',
    currentLocation: '',
    dateOfBirth: '',
    visaStatus: '',
    
    // Step 2: Professional Experience
    currentTitle: '',
    experience: '',
    skills: [],
    education: '',
    languages: [],
    
    // Step 3: Resume Upload
    resume: null,
    coverLetter: null,
    portfolio: null,
    
    // Step 4: Preferences
    desiredPosition: '',
    preferredLocation: '',
    customCity: '',
    salaryExpectation: '',
    workType: '',
    availability: '',
    relocatable: false,
  });

  // Pre-fill form data with user information from signup
  useEffect(() => {
    if (user) {
      const nameParts = user.full_name ? user.full_name.trim().split(' ') : [];
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      setFormData(prev => ({
        ...prev,
        firstName,
        lastName,
        email: user.email || '',
      }));
    }
  }, [user]);

  const [uploadedDocuments, setUploadedDocuments] = useState({
    resume: null,
    coverLetter: null,
    portfolio: null,
  });

  const steps = [
    { id: 1, title: 'Personal Info' },
    { id: 2, title: 'Experience' },
    { id: 3, title: 'Documents' },
    { id: 4, title: 'Preferences' },
  ];

  const experienceOptions = [
    { value: '0', label: '0 years' },
    { value: '1', label: '1 year' },
    { value: '2', label: '2 years' },
    { value: '3', label: '3 years' },
    { value: '4', label: '4 years' },
    { value: '5', label: '5 years' },
    { value: '6', label: '6 years' },
    { value: '7', label: '7 years' },
    { value: '8', label: '8 years' },
    { value: '9', label: '9 years' },
    { value: '10', label: '10 years' },
    { value: '11', label: '11 years' },
    { value: '12', label: '12 years' },
    { value: '13', label: '13 years' },
    { value: '14', label: '14 years' },
    { value: '15', label: '15 years' },
    { value: '16', label: '16 years' },
    { value: '17', label: '17 years' },
    { value: '18', label: '18 years' },
    { value: '19', label: '19 years' },
    { value: '20', label: '20+ years' },
  ];

  const workTypeOptions = [
    { value: 'full-time', label: 'Full-time' },
    { value: 'part-time', label: 'Part-time' },
    { value: 'contract', label: 'Contract' },
    { value: 'freelance', label: 'Freelance' },
  ];

  const availabilityOptions = [
    { value: 'immediate', label: 'Immediately' },
    { value: '2-weeks', label: 'Within 2 weeks' },
    { value: '1-month', label: 'Within 1 month' },
    { value: '2-months', label: 'Within 2 months' },
    { value: '3-months', label: 'Within 3 months' },
  ];

  const visaStatusOptions = [
    // EU Options
    { value: 'eu_citizen', label: 'EU Citizen' },
    { value: 'eu_permit', label: 'EU Work Permit Holder' },
    
    // Indian Options
    { value: 'indian_citizen', label: 'Indian Citizen' },
    { value: 'indian_oci', label: 'Overseas Citizen of India (OCI)' },
    { value: 'indian_employment', label: 'Indian Employment Visa (E Visa)' },
    
    // US Options
    { value: 'us_citizen', label: 'US Citizen/Permanent Resident' },
    { value: 'us_h1b', label: 'US H-1B Visa Holder' },
    { value: 'us_l1', label: 'US L-1 Visa Holder' },
    
    // UK Options
    { value: 'uk_citizen', label: 'UK Citizen/Settled Status' },
    { value: 'uk_skilled_worker', label: 'UK Skilled Worker Visa' },
    
    // Canada Options
    { value: 'canada_citizen', label: 'Canadian Citizen/PR' },
    { value: 'canada_work_permit', label: 'Canadian Work Permit' },
    
    // Australia/NZ Options
    { value: 'aus_nz_citizen', label: 'Australian/NZ Citizen' },
    { value: 'aus_nz_work_visa', label: 'Australian/NZ Work Visa' },
    
    // General Options
    { value: 'student', label: 'Student Visa' },
    { value: 'none', label: 'No Work Authorization' },
    { value: 'applying', label: 'Visa Application in Progress' },
    { value: 'other', label: 'Other Work Authorization' }
  ];

  const countryOptions = [
    { value: 'usa', label: 'United States' },
    { value: 'uk', label: 'United Kingdom' },
    { value: 'canada', label: 'Canada' },
    { value: 'australia', label: 'Australia' },
    { value: 'germany', label: 'Germany' },
    { value: 'france', label: 'France' },
    { value: 'spain', label: 'Spain' },
    { value: 'italy', label: 'Italy' },
    { value: 'netherlands', label: 'Netherlands' },
    { value: 'sweden', label: 'Sweden' },
    { value: 'norway', label: 'Norway' },
    { value: 'denmark', label: 'Denmark' },
    { value: 'finland', label: 'Finland' },
    { value: 'ireland', label: 'Ireland' },
    { value: 'switzerland', label: 'Switzerland' },
    { value: 'austria', label: 'Austria' },
    { value: 'belgium', label: 'Belgium' },
    { value: 'portugal', label: 'Portugal' },
    { value: 'greece', label: 'Greece' },
    { value: 'poland', label: 'Poland' },
    { value: 'czech_republic', label: 'Czech Republic' },
    { value: 'hungary', label: 'Hungary' },
    { value: 'romania', label: 'Romania' },
    { value: 'bulgaria', label: 'Bulgaria' },
    { value: 'croatia', label: 'Croatia' },
    { value: 'slovakia', label: 'Slovakia' },
    { value: 'slovenia', label: 'Slovenia' },
    { value: 'estonia', label: 'Estonia' },
    { value: 'latvia', label: 'Latvia' },
    { value: 'lithuania', label: 'Lithuania' },
    { value: 'india', label: 'India' },
    { value: 'china', label: 'China' },
    { value: 'japan', label: 'Japan' },
    { value: 'south_korea', label: 'South Korea' },
    { value: 'singapore', label: 'Singapore' },
    { value: 'malaysia', label: 'Malaysia' },
    { value: 'indonesia', label: 'Indonesia' },
    { value: 'thailand', label: 'Thailand' },
    { value: 'vietnam', label: 'Vietnam' },
    { value: 'philippines', label: 'Philippines' },
    { value: 'brazil', label: 'Brazil' },
    { value: 'mexico', label: 'Mexico' },
    { value: 'argentina', label: 'Argentina' },
    { value: 'chile', label: 'Chile' },
    { value: 'colombia', label: 'Colombia' },
    { value: 'peru', label: 'Peru' },
    { value: 'south_africa', label: 'South Africa' },
    { value: 'nigeria', label: 'Nigeria' },
    { value: 'egypt', label: 'Egypt' },
    { value: 'israel', label: 'Israel' },
    { value: 'uae', label: 'United Arab Emirates' },
    { value: 'saudi_arabia', label: 'Saudi Arabia' },
    { value: 'qatar', label: 'Qatar' },
    { value: 'new_zealand', label: 'New Zealand' },
    { value: 'other', label: 'Other Country' },
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (file, documentType) => {
    if (!user?.id) return;

    // Handle document removal
    if (!file) {
      setUploadedDocuments(prev => ({
        ...prev,
        [documentType]: null
      }));
      setFormData(prev => ({
        ...prev,
        [documentType]: null
      }));
      return;
    }

    try {
      const documentData = await uploadDocument(
        file,
        user.id,
        documentType,
        {
          onboarding_step: 3,
          document_category: 'candidate_profile',
        }
      );

      setUploadedDocuments(prev => ({
        ...prev,
        [documentType]: documentData
      }));

      setFormData(prev => ({
        ...prev,
        [documentType]: file
      }));

      return documentData;
    } catch (error) {
      console.error(`Error uploading ${documentType}:`, error);
      throw error;
    }
  };

  const handleCompleteOnboarding = async () => {
    if (!user?.id) {
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Parse experience years from the experience field (now exact values)
      const experienceYears = parseInt(formData.experience) || 0;
      
      // Parse salary expectation
      const salaryMatch = formData.salaryExpectation?.match(/(\d+)/g);
      const targetSalaryRange = salaryMatch ? {
        min: parseInt(salaryMatch[0]) || 0,
        max: parseInt(salaryMatch[1]) || 0,
        currency: 'EUR' // Default to EUR based on the example
      } : null;

      // Format languages as JSONB array (already in correct format)
      const formattedLanguages = formData.languages.map(lang => ({
        language: typeof lang === 'string' ? lang.trim() : lang.language,
        proficiency: typeof lang === 'string' ? 'Fluent' : lang.proficiency
      }));

      // Prepare job seeker profile data
      const profileData = {
        id: user.id,
        headline: formData.currentTitle || `${formData.firstName} ${formData.lastName}`,
        summary: generateProfessionalSummary(formData),
        experience_years: experienceYears,
        current_location: formData.currentLocation,
        preferred_locations: formData.preferredLocation && formData.preferredLocation !== 'other' ? [formData.preferredLocation] : 
                           formData.preferredLocation === 'other' && formData.customCity ? [formData.customCity] : [],
        willing_to_relocate: formData.relocatable,
        preferred_job_types: formData.workType ? [formData.workType] : [],
        target_salary_range: targetSalaryRange,
        skills: formData.skills,
        languages: formattedLanguages,
        cultural_preferences: {
          work_environment: 'Collaborative',
          company_size: 'Medium',
          values: []
        },
        relocation_timeline: formData.availability,
        visa_status: formData.visaStatus,
        onboarding_completed: true,
        onboarding_step: 4,
        ai_match_data: {
          enabled: true,
          job_match_threshold: 80,
          receive_insights: true
        },
        ai_generated_summary: generateProfessionalSummary(formData),
        ai_career_insights: {
          suggested_skills: [],
          growth_areas: [],
          industry_trends: []
        }
      };

      // Insert into job_seeker_profiles table
      const { data: profile, error: profileError } = await supabase
        .from('job_seeker_profiles')
        .upsert(profileData)
        .select()
        .single();

      if (profileError) {
        throw new Error(`Failed to create job seeker profile: ${profileError.message}`);
      }

      // Update basic profile information
      const { error: basicProfileError } = await supabase
        .from('profiles')
        .update({
          full_name: `${formData.firstName} ${formData.lastName}`,
          onboarding_complete: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (basicProfileError) {
        throw new Error(`Failed to update basic profile: ${basicProfileError.message}`);
      }

      // Call the completeOnboarding function from auth context
      await completeOnboarding();

      // Send onboarding completion notification email
      try {
        await sendOnboardingCompletedNotification({
          to: user.email,
          fullName: `${formData.firstName} ${formData.lastName}`,
          accountType: 'candidate',
          profession: formData.currentTitle,
          dashboardUrl: `${window.location.origin}/dashboard`
        });
        console.log('Candidate onboarding completion notification email sent successfully');
      } catch (emailError) {
        console.error('Failed to send candidate onboarding completion notification email:', emailError);
        // Don't fail the onboarding completion if email fails
        // Just log the error silently
      }

      console.log('Onboarding completed successfully:', profile);
      
      // Navigate to dashboard after successful completion
      navigate('/dashboard');
      
      return { success: true, profile };
      
    } catch (err) {
      console.error('Error completing onboarding:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    // Guard: prevent advancing if current step is invalid
    if (!isStepValid(currentStep)) {
      // Provide specific error messages per step
      if (currentStep === 1) {
        setError('Please complete all required personal information fields.');
      } else if (currentStep === 2) {
        setError('Please provide your current title, years of experience, at least one skill, your education, and at least one language.');
      } else if (currentStep === 3) {
        setError('Please upload your resume to proceed.');
      } else if (currentStep === 4) {
        setError('Please complete your job preferences to finish.');
      }
      return;
    }

    setError(null);

    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      handleCompleteOnboarding();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const resetOnboarding = () => {
    setCurrentStep(1);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      currentLocation: '',
      dateOfBirth: '',
      visaStatus: '',
      currentTitle: '',
      experience: '',
      skills: [],
      education: '',
      languages: [],
      resume: null,
      coverLetter: null,
      portfolio: null,
      desiredPosition: '',
      preferredLocation: '',
      customCity: '',
      salaryExpectation: '',
      workType: '',
      availability: '',
      relocatable: false,
    });
    setUploadedDocuments({
      resume: null,
      coverLetter: null,
      portfolio: null,
    });
    setError(null);
  };

  const isStepValid = (step) => {
    switch (step) {
      case 1:
        return formData.firstName && formData.lastName && formData.email && formData.currentLocation && formData.visaStatus;
      case 2:
        return (
          formData.currentTitle &&
          formData.experience &&
          formData.skills.length > 0 &&
          (formData.education && String(formData.education).trim().length > 0) &&
          Array.isArray(formData.languages) && formData.languages.length > 0
        );
      case 3:
        return uploadedDocuments.resume; // Resume is required
      case 4:
        return formData.preferredLocation && 
               (formData.preferredLocation !== 'other' || formData.customCity) && 
               formData.workType && 
               formData.availability;
      default:
        return false;
    }
  };

  const getStepProgress = () => {
    return (currentStep / steps.length) * 100;
  };

  return {
    // State
    currentStep,
    formData,
    uploadedDocuments,
    steps,
    experienceOptions,
    workTypeOptions,
    availabilityOptions,
    countryOptions,
    visaStatusOptions,
    
    // Status
    loading,
    uploading,
    uploadError,
    uploadProgress,
    error,
    
    // Actions
    handleInputChange,
    handleFileUpload,
    handleNext,
    handleBack,
    handleCompleteOnboarding,
    resetOnboarding,
    
    // Utilities
    isStepValid,
    getStepProgress,
    
    // Validation
    canProceed: isStepValid(currentStep),
    canComplete: currentStep === 4 && isStepValid(4),
  };
};
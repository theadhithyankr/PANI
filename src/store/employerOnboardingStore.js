import { create } from 'zustand';
import { supabase } from '../clients/supabaseClient';

// Initial form data structure
const initialFormData = {
  // Step 1: Company Information
  companyName: '',
  industry: '',
  companySize: '',
  location: '',
  website: '',
  description: '',
  foundedYear: '',
  averageSalary: '',
  
  // Step 2: Culture DNA
  workLifeBalance: '',
  innovation: '',
  collaboration: '',
  flexibility: '',
  growth: '',
  diversity: '',
  
  // Step 3: Compliance
  dataProtection: false,
  equalOpportunity: false,
  workPermits: false,
  salaryTransparency: false,
  healthSafety: false,
  
  // Step 4: Employer Profile
  position: '',
  department: '',
  managementStyle: '',
  hiringPreferences: '',
};

// Step definitions
const steps = [
  { id: 1, title: 'Company Info', completed: false },
  { id: 2, title: 'Culture DNA', completed: false },
  { id: 3, title: 'Compliance', completed: false },
  { id: 4, title: 'Your Profile', completed: false },
  { id: 5, title: 'Review', completed: false },
];

// Options for dropdowns
const options = {
  industryOptions: [
    { value: 'technology', label: 'Technology' },
    { value: 'finance', label: 'Finance' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'manufacturing', label: 'Manufacturing' },
    { value: 'consulting', label: 'Consulting' },
    { value: 'retail', label: 'Retail' },
    { value: 'education', label: 'Education' },
    { value: 'other', label: 'Other' },
  ],
  
  companySizeOptions: [
    { value: '1-10', label: '1-10 employees' },
    { value: '11-50', label: '11-50 employees' },
    { value: '51-200', label: '51-200 employees' },
    { value: '201-1000', label: '201-1000 employees' },
    { value: '1000+', label: '1000+ employees' },
  ],
  
  cultureOptions: [
    { value: '1', label: 'Not Important' },
    { value: '2', label: 'Somewhat Important' },
    { value: '3', label: 'Important' },
    { value: '4', label: 'Very Important' },
    { value: '5', label: 'Extremely Important' },
  ],
  
  complianceOptions: [
    { 
      key: 'dataProtection', 
      label: 'GDPR Data Protection Compliance', 
      description: 'Your company complies with GDPR data protection regulations' 
    },
    { 
      key: 'equalOpportunity', 
      label: 'Equal Opportunity Employment', 
      description: 'Your company provides equal opportunities regardless of background' 
    },
    { 
      key: 'workPermits', 
      label: 'Work Permit Support', 
      description: 'Your company can sponsor work permits for international candidates' 
    },
    { 
      key: 'salaryTransparency', 
      label: 'Salary Transparency', 
      description: 'Your company is transparent about salary ranges' 
    },
    { 
      key: 'healthSafety', 
      label: 'Health & Safety Standards', 
      description: 'Your company meets all health and safety requirements' 
    },
  ],
};

// Validation functions
const validateStep1 = (formData) => {
  const errors = [];
  if (!formData.companyName?.trim()) errors.push('Company name is required');
  if (!formData.industry) errors.push('Industry is required');
  if (!formData.companySize) errors.push('Company size is required');
  if (!formData.location?.trim()) errors.push('Location is required');
  return errors;
};

const validateStep4 = (formData) => {
  const errors = [];
  if (!formData.position?.trim()) errors.push('Position is required');
  if (!formData.department?.trim()) errors.push('Department is required');
  return errors;
};

const validateAllData = (formData) => {
  const errors = [];
  
  // Required company fields
  if (!formData.companyName?.trim()) errors.push('Company name is required');
  if (!formData.industry) errors.push('Industry is required');
  if (!formData.companySize) errors.push('Company size is required');
  if (!formData.location?.trim()) errors.push('Location is required');
  
  // Required employer profile fields
  if (!formData.position?.trim()) errors.push('Position is required');
  if (!formData.department?.trim()) errors.push('Department is required');
  
  // Optional validation for website format
  if (formData.website && !isValidUrl(formData.website)) {
    errors.push('Please enter a valid website URL');
  }
  
  // Optional validation for founded year
  if (formData.foundedYear) {
    const year = parseInt(formData.foundedYear);
    const currentYear = new Date().getFullYear();
    if (isNaN(year) || year < 1800 || year > currentYear) {
      errors.push('Please enter a valid founded year');
    }
  }
  
  // Optional validation for average salary
  if (formData.averageSalary) {
    const salary = parseFloat(formData.averageSalary);
    if (isNaN(salary) || salary < 0) {
      errors.push('Please enter a valid average salary');
    }
  }
  
  return errors;
};

// Helper function to validate URL format
const isValidUrl = (string) => {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
};

// Generate AI summary for employer profile
const generateAISummary = (formData) => {
  const summaryParts = [];
  
  if (formData.position && formData.department) {
    summaryParts.push(`${formData.position} in ${formData.department}`);
  }
  
  if (formData.companyName) {
    summaryParts.push(`at ${formData.companyName}`);
  }
  
  if (formData.industry) {
    summaryParts.push(`in the ${formData.industry} industry`);
  }
  
  if (formData.companySize) {
    summaryParts.push(`(${formData.companySize} employees)`);
  }
  
  if (formData.managementStyle) {
    summaryParts.push(`with ${formData.managementStyle.toLowerCase()} management style`);
  }
  
  if (formData.hiringPreferences) {
    summaryParts.push(`preferring ${formData.hiringPreferences.toLowerCase()} candidates`);
  }
  
  return summaryParts.length > 0 ? summaryParts.join(' ') : 'Employer profile';
};

// Create the Zustand store
export const useEmployerOnboardingStore = create((set, get) => ({
  // Form state
  formData: { ...initialFormData },
  currentStep: 1,
  steps: [...steps],
  validationErrors: [],
  
  // Loading and error states
  loading: false,
  error: '',
  
  // Options for dropdowns
  options,
  
  // Actions to update form data
  updateField: (field, value) => {
    set(state => ({
      formData: {
        ...state.formData,
        [field]: value
      }
    }));
  },
  
  updateMultipleFields: (updates) => {
    set(state => ({
      formData: {
        ...state.formData,
        ...updates
      }
    }));
  },
  
  // Step management
  setCurrentStep: (step) => {
    set({ currentStep: step });
  },
  
  nextStep: () => {
    const { currentStep, validateCurrentStep } = get();
    
    // Validate current step
    const errors = validateCurrentStep();
    if (errors.length > 0) {
      set({ validationErrors: errors });
      return false;
    }
    
    // Clear errors and move to next step
    set({ 
      validationErrors: [],
      currentStep: Math.min(currentStep + 1, 5)
    });
    return true;
  },
  
  previousStep: () => {
    const { currentStep } = get();
    set({ 
      currentStep: Math.max(currentStep - 1, 1),
      validationErrors: []
    });
  },
  
  // Validation functions
  validateCurrentStep: () => {
    const { currentStep, formData } = get();
    
    switch (currentStep) {
      case 1:
        return validateStep1(formData);
      case 2:
        return []; // Culture DNA is optional
      case 3:
        return []; // Compliance is optional
      case 4:
        return validateStep4(formData);
      case 5:
        return validateAllData(formData);
      default:
        return [];
    }
  },
  
  validateAllFields: () => {
    const { formData } = get();
    return validateAllData(formData);
  },
  
  // Clear validation errors
  clearValidationErrors: () => {
    set({ validationErrors: [] });
  },
  
  // Clear general error
  clearError: () => {
    set({ error: '' });
  },
  
  // Complete onboarding flow
  completeOnboarding: async (user, globalStoreActions) => {
    const { formData } = get();
    
    set({ loading: true, error: '' });
    
    // Validate user parameter
    if (!user || !user.id) {
      const errorMsg = 'User information is required to complete onboarding';
      set({ error: errorMsg, loading: false });
      throw new Error(errorMsg);
    }
    
    try {
      // Final validation
      const errors = validateAllData(formData);
      if (errors.length > 0) {
        set({ validationErrors: errors, loading: false });
        throw new Error('Please fix all validation errors before completing onboarding');
      }
      
      // 1. Create company record
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: formData.companyName,
          industry: formData.industry,
          size: formData.companySize,
          website: formData.website,
          description: formData.description,
          headquarters_location: formData.location,
          founded_year: formData.foundedYear ? parseInt(formData.foundedYear) : null,
          average_salary: formData.averageSalary ? parseFloat(formData.averageSalary) : null,
          created_by: user.id,
        })
        .select()
        .single();

      if (companyError) {
        console.error('Company creation error:', companyError);
        throw new Error(`Failed to create company: ${companyError.message}`);
      }

      if (!company) {
        throw new Error('Company creation failed - no data returned');
      }

      // Store company in global state if actions provided
      if (globalStoreActions?.setUser && globalStoreActions?.setProfile) {
        const currentUser = globalStoreActions.getUser();
        if (currentUser) {
          const updatedUser = {
            ...currentUser,
            company: company
          };
          globalStoreActions.setUser(updatedUser);
          globalStoreActions.setProfile(updatedUser);
        }
      }

      // 2. Update employer profile with company_id and other details
      const employerProfileData = {
        company_id: company.id,
        position: formData.position,
        department: formData.department,
        is_admin: true, // First user from company is admin
        management_style: formData.managementStyle ? { 
          style: formData.managementStyle 
        } : null,
        hiring_preferences: formData.hiringPreferences ? { 
          preferences: formData.hiringPreferences 
        } : null,
        // Generate AI summary based on company and profile data
        ai_generated_summary: generateAISummary(formData),
      };

      const { data: employerProfile, error: empError } = await supabase
        .from('employer_profiles')
        .update(employerProfileData)
        .eq('id', user.id)
        .select()
        .single();

      if (empError) {
        console.error('Employer profile update error:', empError);
        throw new Error(`Failed to update employer profile: ${empError.message}`);
      }

      if (!employerProfile) {
        throw new Error('Employer profile update failed - no data returned');
      }

      // Store employer profile in global state if actions provided
      if (globalStoreActions?.setUser && globalStoreActions?.setProfile) {
        const currentUser = globalStoreActions.getUser();
        if (currentUser) {
          const updatedUser = {
            ...currentUser,
            ...employerProfile
          };
          globalStoreActions.setUser(updatedUser);
          globalStoreActions.setProfile(updatedUser);
        }
      }

      // 3. Update user profile to mark onboarding as complete
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ onboarding_complete: true })
        .eq('id', user.id);

      if (profileError) {
        console.error('Profile update error:', profileError);
        throw new Error(`Failed to update user profile: ${profileError.message}`);
      }

      set({ loading: false });

      return {
        company,
        employerProfile,
        success: true
      };

    } catch (err) {
      console.error('Employer onboarding error:', err);
      set({ 
        error: err.message || 'An unexpected error occurred during onboarding',
        loading: false 
      });
      throw err;
    }
  },
  
  // Reset store to initial state
  reset: () => {
    set({
      formData: { ...initialFormData },
      currentStep: 1,
      steps: [...steps],
      validationErrors: [],
      loading: false,
      error: '',
    });
  },
  
  // Load data from existing state (useful for editing)
  loadData: (data) => {
    set({
      formData: {
        ...initialFormData,
        ...data
      }
    });
  },
  
  // Get formatted data for review/display
  getFormattedData: () => {
    const { formData } = get();
    const { industryOptions, companySizeOptions } = get().options;
    
    return {
      companyInfo: {
        name: formData.companyName,
        industry: industryOptions.find(o => o.value === formData.industry)?.label || formData.industry,
        size: companySizeOptions.find(o => o.value === formData.companySize)?.label || formData.companySize,
        location: formData.location,
        website: formData.website,
        foundedYear: formData.foundedYear,
        averageSalary: formData.averageSalary,
        description: formData.description,
      },
      cultureDNA: {
        workLifeBalance: formData.workLifeBalance,
        innovation: formData.innovation,
        collaboration: formData.collaboration,
        flexibility: formData.flexibility,
        growth: formData.growth,
        diversity: formData.diversity,
      },
      compliance: {
        dataProtection: formData.dataProtection,
        equalOpportunity: formData.equalOpportunity,
        workPermits: formData.workPermits,
        salaryTransparency: formData.salaryTransparency,
        healthSafety: formData.healthSafety,
      },
      employerProfile: {
        position: formData.position,
        department: formData.department,
        managementStyle: formData.managementStyle,
        hiringPreferences: formData.hiringPreferences,
      }
    };
  },
  
  // Check if step is valid (for stepper display)
  isStepValid: (stepNumber) => {
    const { formData } = get();
    
    switch (stepNumber) {
      case 1:
        return validateStep1(formData).length === 0;
      case 2:
        return true; // Culture DNA is optional
      case 3:
        return true; // Compliance is optional
      case 4:
        return validateStep4(formData).length === 0;
      case 5:
        return validateAllData(formData).length === 0;
      default:
        return false;
    }
  },
  
  // Get completion percentage
  getCompletionPercentage: () => {
    const { formData } = get();
    const totalFields = Object.keys(initialFormData).length;
    const completedFields = Object.values(formData).filter(value => {
      if (typeof value === 'string') return value.trim() !== '';
      if (typeof value === 'boolean') return value === true;
      return value !== null && value !== undefined;
    }).length;
    
    return Math.round((completedFields / totalFields) * 100);
  },
})); 
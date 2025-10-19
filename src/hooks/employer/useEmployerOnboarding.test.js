// Example usage of useEmployerOnboarding hook
// This is a demonstration file showing how to use the hook

import { useEmployerOnboarding } from './useEmployerOnboarding';

// Example component using the hook
const ExampleEmployerOnboarding = () => {
  const {
    loading,
    error,
    completeEmployerOnboarding,
    validateOnboardingData,
    getEmployerProfile,
    updateEmployerProfile,
    clearError
  } = useEmployerOnboarding();

  // Example form data structure
  const exampleFormData = {
    // Company Information
    companyName: 'TechCorp Solutions',
    industry: 'technology',
    companySize: '51-200',
    location: 'Berlin, Germany',
    website: 'https://techcorp.com',
    description: 'Leading software development company',
    foundedYear: '2015',
    averageSalary: '65000',
    
    // Employer Profile
    position: 'Head of HR',
    department: 'Human Resources',
    managementStyle: 'Collaborative',
    hiringPreferences: 'Fast-paced, Diversity-focused'
  };

  // Example usage functions
  const handleCompleteOnboarding = async (user) => {
    try {
      // Validate form data first
      const validationErrors = validateOnboardingData(exampleFormData);
      if (validationErrors.length > 0) {
        console.error('Validation errors:', validationErrors);
        return;
      }

      // Complete onboarding
      const result = await completeEmployerOnboarding(exampleFormData, user);
      console.log('Onboarding completed:', result);
    } catch (err) {
      console.error('Onboarding failed:', err);
    }
  };

  const handleGetProfile = async (userId) => {
    try {
      const profile = await getEmployerProfile(userId);
      console.log('Employer profile:', profile);
    } catch (err) {
      console.error('Failed to get profile:', err);
    }
  };

  const handleUpdateProfile = async (userId) => {
    try {
      const updates = {
        position: 'Senior HR Manager',
        management_style: { style: 'Democratic' }
      };
      
      const updatedProfile = await updateEmployerProfile(userId, updates);
      console.log('Profile updated:', updatedProfile);
    } catch (err) {
      console.error('Failed to update profile:', err);
    }
  };

  return {
    loading,
    error,
    handleCompleteOnboarding,
    handleGetProfile,
    handleUpdateProfile,
    clearError
  };
};

export default ExampleEmployerOnboarding; 
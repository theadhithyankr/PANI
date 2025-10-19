import { useState } from 'react';
import { supabase } from '../../clients/supabaseClient';
import useGlobalStore from '../../stores/globalStore';

export const useEmployerOnboarding = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const setGlobalUser = useGlobalStore((state) => state.setUser);
  const setGlobalProfile = useGlobalStore((state) => state.setProfile);

  // Create company and update employer profile
  const completeEmployerOnboarding = async (formData, user) => {
    setLoading(true);
    setError('');
    
    // Validate user parameter
    if (!user || !user.id) {
      const errorMsg = 'User information is required to complete onboarding';
      setError(errorMsg);
      setLoading(false);
      throw new Error(errorMsg);
    }
    
    try {
      // 1. Check if company already exists for this user, if so update it, otherwise create new one
      console.log('Checking for existing employer profile for user:', user.id);
      const { data: existingEmployerProfile } = await supabase
        .from('employer_profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      console.log('Existing employer profile:', existingEmployerProfile);
      
      let company;
      
      if (existingEmployerProfile?.company_id) {
        console.log('Updating existing company:', existingEmployerProfile.company_id);
        // Update existing company
        const { data: updatedCompany, error: companyError } = await supabase
          .from('companies')
          .update({
            name: formData.companyName,
            industry: formData.industry,
            size: formData.companySize,
            website: formData.website,
            description: formData.description,
            headquarters_location: formData.location,
            founded_year: formData.foundedYear ? parseInt(formData.foundedYear) : null,
            average_salary: formData.averageSalary ? parseFloat(formData.averageSalary) : null,
          })
          .eq('id', existingEmployerProfile.company_id)
          .select()
          .single();

        if (companyError) {
          console.error('Company update error:', companyError);
          throw new Error(`Failed to update company: ${companyError.message}`);
        }
        
                 company = updatedCompany;
       } else {
         console.log('Creating new company for user:', user.id);
         // Create new company
        const { data: newCompany, error: companyError } = await supabase
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
        
        company = newCompany;
      }

      if (!company) {
        throw new Error('Company operation failed - no data returned');
      }

      console.log('Company operation completed successfully:', company);

      // Store company in global state
      // Update global store with company data
      const currentUserForCompany = useGlobalStore.getState().user;
      if (currentUserForCompany) {
        const updatedUser = {
          ...currentUserForCompany,
          company: company
        };
        setGlobalUser(updatedUser);
        setGlobalProfile(updatedUser);
      }

      // 2. Update employer profile with company_id and other details
      const employerProfileData = {
        company_id: company.id,
        position: formData.position || '',
        department: formData.department || '',
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
      
      console.log('Updating employer profile with data:', employerProfileData);

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

      // Store employer profile in global state
      // Update global store with employer profile data
      const currentUserForProfile = useGlobalStore.getState().user;
      if (currentUserForProfile) {
        const updatedUser = {
          ...currentUserForProfile,
          ...employerProfile
        };
        setGlobalUser(updatedUser);
        setGlobalProfile(updatedUser);
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

      return {
        company,
        employerProfile,
        success: true
      };

    } catch (err) {
      console.error('Employer onboarding error:', err);
      setError(err.message || 'An unexpected error occurred during onboarding');
      throw err;
    } finally {
      setLoading(false);
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

  // Validate form data before submission
  const validateOnboardingData = (formData) => {
    const errors = [];

    // Required company fields
    if (!formData.companyName?.trim()) {
      errors.push('Company name is required');
    }
    if (!formData.industry) {
      errors.push('Industry is required');
    }
    if (!formData.companySize) {
      errors.push('Company size is required');
    }
    if (!formData.location?.trim()) {
      errors.push('Location is required');
    }

    // Required employer profile fields
    if (!formData.position?.trim()) {
      errors.push('Position is required');
    }
    if (!formData.department?.trim()) {
      errors.push('Department is required');
    }

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

  // Get employer profile by user ID
  const getEmployerProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('employer_profiles')
        .select(`
          *,
          companies (*)
        `)
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching employer profile:', error);
        throw error;
      }

      return data;
    } catch (err) {
      console.error('Failed to fetch employer profile:', err);
      throw err;
    }
  };

  // Update employer profile
  const updateEmployerProfile = async (userId, updates) => {
    try {
      const { data, error } = await supabase
        .from('employer_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating employer profile:', error);
        throw error;
      }

      // Update global state
      // Update global store with employer profile data
      const currentUserForUpdate = useGlobalStore.getState().user;
      if (currentUserForUpdate) {
        const updatedUser = {
          ...currentUserForUpdate,
          ...data
        };
        setGlobalUser(updatedUser);
        setGlobalProfile(updatedUser);
      }
      return data;
    } catch (err) {
      console.error('Failed to update employer profile:', err);
      throw err;
    }
  };

  return {
    loading,
    error,
    completeEmployerOnboarding,
    validateOnboardingData,
    getEmployerProfile,
    updateEmployerProfile,
    clearError: () => setError('')
  };
}; 
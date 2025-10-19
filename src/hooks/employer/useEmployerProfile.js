import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../clients/supabaseClient';
import useGlobalStore from '../../stores/globalStore';

export const useEmployerProfile = (userId) => {
  const [profile, setProfile] = useState(null);
  const [basicProfile, setBasicProfile] = useState(null);
  const [company, setCompanyData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isUpdatingBasicProfile, setIsUpdatingBasicProfile] = useState(false);

  // Global store actions
  const setGlobalUser = useGlobalStore((state) => state.setUser);
  const setGlobalProfile = useGlobalStore((state) => state.setProfile);

  // Default employer profile structure
  const defaultProfile = {
    id: userId,
    company_id: null,
    position: '',
    department: '',
    is_admin: false,
    ai_generated_summary: '',
    management_style: {
      style: '',
      approach: '',
      communication: ''
    },
    hiring_preferences: {
      experience_level: [],
      skills_priority: [],
      cultural_fit: [],
      interview_process: ''
    }
  };

  const defaultBasicProfile = {
    full_name: '',
    avatar_url: '',
    phone: '',
    email_verified: false,
    phone_verified: false,
    user_type: 'employer',
    onboarding_complete: false
  };

  const defaultCompany = {
    name: '',
    logo_url: '',
    cover_image_url: '',
    website: '',
    industry: '',
    size: '',
    description: '',
    headquarters_location: '',
    founded_year: null,
    average_salary: null
  };

  // Fetch all profile data
  const fetchProfiles = useCallback(async (userId) => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      // Fetch basic profile
      const { data: basicProfileData, error: basicError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (basicError) throw basicError;

      // Fetch employer profile
      const { data: employerProfileData, error: employerError } = await supabase
        .from('employer_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (employerError && employerError.code !== 'PGRST116') {
        throw employerError;
      }

      // Fetch company data if employer has company_id
      let companyData = null;
      if (employerProfileData?.company_id) {
        const { data: companyResult, error: companyError } = await supabase
          .from('companies')
          .select('*')
          .eq('id', employerProfileData.company_id)
          .maybeSingle();

        if (companyError && companyError.code !== 'PGRST116') {
          throw companyError;
        }
        companyData = companyResult;
      }

      // Set state
      setBasicProfile(basicProfileData || defaultBasicProfile);
      setProfile(employerProfileData || defaultProfile);
      setCompanyData(companyData || defaultCompany);

      // Update global store
      if (employerProfileData || companyData) {
        const currentUser = useGlobalStore.getState().user;
        if (currentUser) {
          const updatedUser = {
            ...currentUser,
            ...employerProfileData,
            company: companyData
          };
          setGlobalUser(updatedUser);
          setGlobalProfile(updatedUser);
        }
      }

    } catch (err) {
      console.error('Error fetching employer profiles:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [setGlobalUser, setGlobalProfile]);

  // Update basic profile
  const updateBasicProfile = async (userId, updates) => {
    setIsUpdatingBasicProfile(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .maybeSingle();

      if (error) throw error;

      setBasicProfile(data);
      return data;
    } catch (err) {
      console.error('Error updating basic profile:', err);
      throw err;
    } finally {
      setIsUpdatingBasicProfile(false);
    }
  };

  // Update employer profile
  const updateEmployerProfile = async (updates) => {
    setSaving(true);
    try {
        const { data, error } = await supabase
        .from('employer_profiles')
        .upsert({
          id: userId,
          ...updates,
          updated_at: new Date().toISOString()
        })
        .select()
        .maybeSingle();

      if (error) throw error;

      setProfile(data);
      // Update global store
      const currentUser = useGlobalStore.getState().user;
      if (currentUser) {
        const updatedUser = {
          ...currentUser,
          ...data
        };
        setGlobalUser(updatedUser);
        setGlobalProfile(updatedUser);
      }
      setHasUnsavedChanges(false);
      return data;
    } catch (err) {
      console.error('Error updating employer profile:', err);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  // Update company
  const updateCompany = async (updates) => {
    setSaving(true);
    try {
      let companyData;
      
      if (company?.id) {
        // Update existing company
        const { data, error } = await supabase
          .from('companies')
          .update({
            ...updates,
            updated_at: new Date().toISOString()
          })
          .eq('id', company.id)
          .select()
          .maybeSingle();

        if (error) throw error;
        companyData = data;
      } else {
        // Create new company
        const { data, error } = await supabase
          .from('companies')
          .insert({
            ...updates,
            created_by: userId
          })
          .select()
          .maybeSingle();

        if (error) throw error;
        companyData = data;

        // Update employer profile with company_id
        await updateEmployerProfile({ company_id: companyData.id });
      }

      setCompanyData(companyData);
      // Update global store with company data
      const currentUser = useGlobalStore.getState().user;
      if (currentUser) {
        const updatedUser = {
          ...currentUser,
          company: companyData
        };
        setGlobalUser(updatedUser);
        setGlobalProfile(updatedUser);
      }
      return companyData;
    } catch (err) {
      console.error('Error updating company:', err);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  // Upload profile photo
  const uploadProfilePhoto = async (file) => {
    setIsUpdatingBasicProfile(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/avatar.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      await updateBasicProfile(userId, { avatar_url: publicUrl });
      
      // Update local state with new avatar URL
      setBasicProfile(prev => ({
        ...prev,
        avatar_url: publicUrl
      }));
      
      // Update global store
      const currentUser = useGlobalStore.getState().user;
      if (currentUser) {
        const updatedUser = {
          ...currentUser,
          avatar_url: publicUrl
        };
        setGlobalUser(updatedUser);
        setGlobalProfile(updatedUser);
      }
      
      return publicUrl;
    } catch (err) {
      console.error('Error uploading profile photo:', err);
      throw err;
    } finally {
      setIsUpdatingBasicProfile(false);
    }
  };

  // Local profile updates (for unsaved changes)
  const updateLocalProfile = (updates) => {
    setProfile(prev => ({ ...prev, ...updates }));
    setHasUnsavedChanges(true);
  };

  const updateLocalCompany = (updates) => {
    setCompanyData(prev => ({ ...prev, ...updates }));
    setHasUnsavedChanges(true);
  };

  // Save all changes
  const saveProfile = async () => {
    try {
      if (hasUnsavedChanges) {
        await updateEmployerProfile(profile);
        if (company && Object.keys(company).length > 1) {
          await updateCompany(company);
        }
      }
    } catch (err) {
      throw err;
    }
  };

  // Initialize on mount
  useEffect(() => {
    if (userId) {
      fetchProfiles(userId);
    }
  }, [userId, fetchProfiles]);

  return {
    // Profile data
    profile,
    basicProfile,
    company,
    
    // Status flags
    isLoading,
    error,
    saving,
    hasUnsavedChanges,
    isUpdatingBasicProfile,
    
    // Basic profile operations
    updateBasicProfile: (updates) => updateBasicProfile(userId, updates),
    uploadProfilePhoto,
    
    // Employer profile operations
    updateEmployerProfile,
    updateCompany,
    updateLocalProfile,
    updateLocalCompany,
    saveProfile,
    
    // Refresh data
    refreshProfiles: () => fetchProfiles(userId)
  };
}; 
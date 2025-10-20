/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export const useJobSeekerProfile = (userId) => {
  const defaultProfile = {
    profile_id: userId,
    headline: '',
    summary: '',
    experience_years: null,
    current_location: '',
    preferred_locations: [],
    willing_to_relocate: true,
    preferred_job_types: [],
    visa_status: '',
    skills: [],
    languages: [],
    cultural_preferences: {
      work_environment: 'Collaborative',
      company_size: 'Medium',
      values: []
    },
    relocation_timeline: '3-6 months',
    ai_match_data: {
      enabled: true,
      job_match_threshold: 80,
      receive_insights: true
    },
    ai_generated_summary: '',
    ai_career_insights: {
      suggested_skills: [],
      growth_areas: [],
      industry_trends: []
    },

  };

  // Add state for basic profile
  const [basicProfile, setBasicProfile] = useState({
    full_name: '',
    avatar_url: '',
    phone: '',
    email_verified: false,
    phone_verified: false,
    user_type: 'job_seeker',
    onboarding_complete: false
  });
  const [isUpdatingBasicProfile, setIsUpdatingBasicProfile] = useState(false);

  const [profile, setProfile] = useState(defaultProfile);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [lastRefreshTime, setLastRefreshTime] = useState(0);
  const REFRESH_COOLDOWN = 30000; // 30 seconds cooldown

  // Fetch both basic profile and job seeker profile data
  useEffect(() => {
    const fetchProfiles = async () => {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Fetch basic profile
        const { data: basicData, error: basicError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (basicError && basicError.code !== 'PGRST116') {
          throw basicError;
        }

        if (basicData) {
          setBasicProfile({
            full_name: basicData.full_name || '',
            avatar_url: basicData.avatar_url || '',
            phone: basicData.phone || '',
            email_verified: basicData.email_verified || false,
            phone_verified: basicData.phone_verified || false,
            user_type: basicData.user_type || 'job_seeker',
            onboarding_complete: basicData.onboarding_complete || false
          });
        }

        // Fetch job seeker profile
        const { data: seekerData, error: seekerError } = await supabase
          .from('job_seeker_profiles')
          .select('*')
          .eq('profile_id', userId)
          .single();

        if (seekerError && seekerError.code !== 'PGRST116') {
          throw seekerError;
        }

        setProfile({
          ...defaultProfile,
          ...(seekerData || {})
        });
      } catch (err) {
        console.error('Error fetching profiles:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
        setHasUnsavedChanges(false);
      }
    };

    fetchProfiles();
  }, [userId]);

  // Function to update basic profile
  const updateBasicProfile = async (updates) => {
    setIsUpdatingBasicProfile(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);

      if (error) throw error;

      setBasicProfile(prev => ({ ...prev, ...updates }));
      return { success: true };
    } catch (error) {
      console.error('Error updating basic profile:', error);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setIsUpdatingBasicProfile(false);
    }
  };

  // Add a refresh function
  const refreshProfile = async () => {
    if (!userId) return;
    
    // Check if enough time has passed since last refresh
    const now = Date.now();
    if (now - lastRefreshTime < REFRESH_COOLDOWN) {
      return;
    }
    
    try {
      // Fetch basic profile
      const { data: basicData, error: basicError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (basicError && basicError.code !== 'PGRST116') {
        throw basicError;
      }

      if (basicData) {
        setBasicProfile({
          full_name: basicData.full_name || '',
          avatar_url: basicData.avatar_url || '',
          phone: basicData.phone || '',
          email_verified: basicData.email_verified || false,
          phone_verified: basicData.phone_verified || false,
          user_type: basicData.user_type || 'job_seeker',
          onboarding_complete: basicData.onboarding_complete || false
        });
        setLastRefreshTime(now);
      }
    } catch (err) {
      console.error('Error refreshing profile:', err);
      setError(err.message);
    }
  };

  // Function to handle profile photo upload
  const uploadProfilePhoto = async (file) => {
    if (!userId) return { success: false, error: 'User not authenticated' };

    try {
      // Validate file size (max 2MB)
      const fileSizeInMB = file.size / (1024 * 1024);
      if (fileSizeInMB > 2) {
        return { success: false, error: 'File size exceeds 2MB limit' };
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        return { success: false, error: 'Only JPEG, PNG, and GIF files are allowed' };
      }

      setIsUpdatingBasicProfile(true);

      // Upload file to avatars bucket
      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          upsert: true,
          cacheControl: '3600'
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profiles table with proper error handling
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (profileError) {
        console.error('Error updating profile:', profileError);
        throw profileError;
      }

      if (!profileData) {
        throw new Error('Profile not found');
      }

      // Update user metadata
      const { error: userError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl }
      });

      if (userError) throw userError;

      // Update local state with the new profile data
      setBasicProfile(prev => ({
        ...prev,
        avatar_url: publicUrl
      }));

      return { success: true, url: publicUrl };
    } catch (err) {
      console.error('Error uploading profile photo:', err);
      return { 
        success: false, 
        error: err.message || 'Failed to upload profile photo'
      };
    } finally {
      setIsUpdatingBasicProfile(false);
    }
  };

  const updateLocalProfile = (updatedFields) => {
    setProfile(prev => {
      // Handle nested updates for objects like cultural_preferences
      if (updatedFields.cultural_preferences && prev.cultural_preferences) {
        return {
          ...prev,
          ...updatedFields,
          cultural_preferences: {
            ...prev.cultural_preferences,
            ...updatedFields.cultural_preferences
          }
        };
      }

      // Handle nested updates for target_salary_range
      if (updatedFields.target_salary_range && prev.target_salary_range) {
        return {
          ...prev,
          ...updatedFields,
          target_salary_range: {
            ...prev.target_salary_range,
            ...updatedFields.target_salary_range
          }
        };
      }

      // Handle nested updates for ai_match_data
      if (updatedFields.ai_match_data && prev.ai_match_data) {
        return {
          ...prev,
          ...updatedFields,
          ai_match_data: {
            ...prev.ai_match_data,
            ...updatedFields.ai_match_data
          }
        };
      }

      // Default case for simple updates
      return {
        ...prev,
        ...updatedFields
      };
    });
    setHasUnsavedChanges(true);
  };

  const saveProfile = async () => {
    if (!userId || !hasUnsavedChanges) return;
    
    setSaving(true);
    setError(null);
    
    try {
      const { data, error: updateError } = await supabase
        .from('job_seeker_profiles')
        .upsert({ ...profile, profile_id: userId, updated_at: new Date() })
        .select()
        .single();
      
      if (updateError) throw updateError;
      
      setProfile(data || profile);
      setHasUnsavedChanges(false);
      
      
      return data;
    } catch (error) {
      console.error('Error saving profile:', error);
      setError(error.message);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  // Function to handle field updates with automatic saving
  const updateProfile = (updatedFields) => {
    updateLocalProfile(updatedFields);
  };

  // Handle adding a new skill
  const addSkill = (skill) => {
    if (skill && !profile.skills.includes(skill)) {
      updateLocalProfile({
        skills: [...profile.skills, skill]
      });
    }
  };

  // Handle removing a skill
  const removeSkill = (skillToRemove) => {
    updateLocalProfile({
      skills: profile.skills.filter(skill => skill !== skillToRemove)
    });
  };

  // Handle adding a new language
  const addLanguage = (language) => {
    if (language.language && !profile.languages.some(l => l.language === language.language)) {
      updateLocalProfile({
        languages: [...profile.languages, language]
      });
    }
  };

  // Handle removing a language
  const removeLanguage = (languageToRemove) => {
    updateLocalProfile({
      languages: profile.languages.filter(lang => lang.language !== languageToRemove)
    });
  };

  // Handle adding a new location
  const addLocation = (location) => {
    if (location && !profile.preferred_locations.includes(location)) {
      updateLocalProfile({
        preferred_locations: [...profile.preferred_locations, location]
      });
    }
  };

  // Handle removing a location
  const removeLocation = (locationToRemove) => {
    updateLocalProfile({
      preferred_locations: profile.preferred_locations.filter(loc => loc !== locationToRemove)
    });
  };

  // Handle adding a new job type
  const addJobType = (jobType) => {
    if (jobType && !profile.preferred_job_types.includes(jobType)) {
      updateLocalProfile({
        preferred_job_types: [...profile.preferred_job_types, jobType]
      });
    }
  };

  // Handle removing a job type
  const removeJobType = (jobTypeToRemove) => {
    updateLocalProfile({
      preferred_job_types: profile.preferred_job_types.filter(type => type !== jobTypeToRemove)
    });
  };

  // Handle adding a new cultural value
  const addCulturalValue = (value) => {
    if (value && !profile.cultural_preferences.values.includes(value)) {
      updateLocalProfile({
        cultural_preferences: {
          ...profile.cultural_preferences,
          values: [...profile.cultural_preferences.values, value]
        }
      });
    }
  };

  // Handle removing a cultural value
  const removeCulturalValue = (valueToRemove) => {
    updateLocalProfile({
      cultural_preferences: {
        ...profile.cultural_preferences,
        values: profile.cultural_preferences.values.filter(value => value !== valueToRemove)
      }
    });
  };

  return {
    profile,
    basicProfile,
    saving,
    error,
    hasUnsavedChanges,
    isLoading,
    isUpdatingBasicProfile,
    updateLocalProfile,
    saveProfile,
    updateProfile,
    updateBasicProfile,
    uploadProfilePhoto,
    refreshProfile,
    addSkill,
    removeSkill,
    addLanguage,
    removeLanguage,
    addLocation,
    removeLocation,
    addJobType,
    removeJobType,
    addCulturalValue,
    removeCulturalValue
  };
};

export default useJobSeekerProfile;
import { useState, useCallback } from 'react';
import { supabase } from '../../clients/supabaseClient';

export const useJobSeekerProfileViewer = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [profileData, setProfileData] = useState(null);

  const fetchJobSeekerProfile = useCallback(async (applicantId) => {
    if (!applicantId) return null;

    setLoading(true);
    setError(null);

    try {
      // Fetch job seeker profile data
      const { data: profile, error: profileError } = await supabase
        .from('job_seeker_profiles')
        .select(`
          *,
          profiles!inner(
            id,
            full_name,
            avatar_url,
            phone
          )
        `)
        .eq('id', applicantId)
        .single();

      if (profileError && profileError.code !== 'PGRST116') throw profileError;
      if (!profile) {
        setError('Profile not found');
        return null;
      }

      // Resume data fetching removed - table not available

      // Fetch resume documents from documents table
      const { data: resumeDocuments } = await supabase
        .from('documents')
        .select('*')
        .eq('owner_id', applicantId)
        .in('document_type', ['cv', 'resume'])
        .order('created_at', { ascending: false });

      const transformedProfile = {
        ...profile,
        fullName: profile.profiles.full_name,
        avatar: profile.profiles.avatar_url,
        phone: profile.profiles.phone,
        resumeDocuments: resumeDocuments || []
      };

      setProfileData(transformedProfile);
      return transformedProfile;
    } catch (err) {
      setError(err.message);
      console.error('Error fetching job seeker profile:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const downloadResume = useCallback(async (document) => {
    try {
      // Create a signed URL for the document
      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(document.file_path, 300); // 5 minutes expiry

      if (error) throw error;

      // Open the document in a new tab
      window.open(data.signedUrl, '_blank');
    } catch (err) {
      console.error('Error downloading resume:', err);
      throw new Error('Failed to download resume');
    }
  }, []);

  return {
    profileData,
    loading,
    error,
    fetchJobSeekerProfile,
    downloadResume,
    clearProfile: () => setProfileData(null)
  };
}; 
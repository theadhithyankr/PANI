import { useState, useEffect } from 'react';
import { supabase } from '../../clients/supabaseClient';

const useAvailableInterviewers = (companyId = null) => {
  const [interviewers, setInterviewers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchInterviewers = async (companyId = null) => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          avatar_url,
          user_type,
          created_at,
          employer_profiles!inner (
            id,
            company_id,
            position,
            department
          )
        `)
        .eq('user_type', 'employer'); // Only fetch employer profiles

      // If companyId is provided, filter by company
      if (companyId) {
        query = query.eq('employer_profiles.company_id', companyId);
      }

      const { data, error } = await query.order('full_name', { ascending: true });

      if (error) {
        throw error;
      }

      // Transform the data to match the expected format
      const transformedInterviewers = data.map(interviewer => ({
        id: interviewer.id,
        name: interviewer.full_name,
        role: interviewer.employer_profiles?.position || 'Interviewer',
        department: interviewer.employer_profiles?.department || '',
        avatar: interviewer.avatar_url || `https://ui-avatars.com/api/?name=${interviewer.full_name}&size=40`,
        user_type: interviewer.user_type,
        created_at: interviewer.created_at
      }));

      setInterviewers(transformedInterviewers);
      return transformedInterviewers;
    } catch (err) {
      console.error('Error fetching interviewers:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviewers(companyId);
  }, [companyId]);

  return {
    interviewers,
    loading,
    error,
    fetchInterviewers: () => fetchInterviewers(companyId)
  };
};

export default useAvailableInterviewers; 
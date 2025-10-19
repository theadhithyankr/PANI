import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../clients/supabaseClient';

export const useApplicationManagement = () => {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchApplications = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const { data, error: queryError } = await supabase
                .from('job_applications_v2')
                .select(`
                    *,
                    applicant:profiles!job_applications_v2_applicant_id_fkey (*),
                    job:jobs (
                        *,
                        company:companies (name, logo_url)
                    )
                `);

            if (queryError) {
                throw queryError;
            }
            
            setApplications(data);
        } catch (err) {
            console.error("Error fetching applications:", err);
            setError(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchApplications();
    }, [fetchApplications]);

    return { applications, loading, error, refetch: fetchApplications };
}; 
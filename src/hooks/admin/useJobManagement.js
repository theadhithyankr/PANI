import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../clients/supabaseClient';

export const useJobManagement = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchJobs = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const { data, error: queryError } = await supabase
                .from('jobs')
                .select(`
                    *,
                    company:companies (name, logo_url),
                    created_by_profile:profiles!jobs_created_by_fkey (full_name),
                    job_applications_v2 (count)
                `);

            if (queryError) throw queryError;

            const formattedJobs = data.map(job => {
                const responsibilities = job.responsibilities ? job.responsibilities.split('\n').filter(r => r.trim() !== '') : [];
                const requirements = job.requirements ? job.requirements.split('\n').filter(r => r.trim() !== '') : [];

                return {
                    ...job,
                    company: job.company,
                    created_by: job.created_by_profile,
                    applicants_count: job.job_applications_v2[0]?.count || 0,
                    employment_type: job.job_type,
                    responsibilities,
                    requirements,
                }
            });

            setJobs(formattedJobs);
        } catch (err) {
            console.error("Error fetching jobs:", err);
            setError(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchJobs();
    }, [fetchJobs]);

    return { jobs, loading, error, refetch: fetchJobs };
}; 
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../clients/supabaseClient';

export const useCompanyManagement = () => {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchCompanies = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase
                .from('companies')
                .select(`
                    *,
                    profiles!companies_created_by_fkey (
                        full_name
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) {
                throw error;
            }

            const formattedData = data.map(company => {
                const { profiles, ...rest } = company;
                return {
                    ...rest,
                    created_by: profiles ? { full_name: profiles.full_name } : { full_name: 'Unknown' },
                };
            });

            setCompanies(formattedData);
        } catch (err) {
            console.error("Error fetching companies:", err);
            setError(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCompanies();
    }, [fetchCompanies]);

    const updateCompanyStatus = useCallback(async (companyId, is_approved) => {
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase
                .from('companies')
                .update({ is_approved, updated_at: new Date().toISOString() })
                .eq('id', companyId)
                .select(`
                    *,
                    profiles!companies_created_by_fkey (
                        full_name
                    )
                `)
                .maybeSingle();

            if (error) {
                throw error;
            }
            
            // If no row is returned (e.g., no rows updated or RLS hides the row),
            // refresh the list to get the latest server state and avoid PGRST116.
            if (!data) {
                await fetchCompanies();
                return;
            }
            
            const { profiles, ...rest } = data;
            const updatedCompany = {
                ...rest,
                created_by: profiles ? { full_name: profiles.full_name } : { full_name: 'Unknown' },
            };

            setCompanies(prevCompanies =>
                prevCompanies.map(c => c.id === companyId ? updatedCompany : c)
            );
        } catch (err) {
            console.error("Error updating company status:", err);
            setError(err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [fetchCompanies]);

    return { companies, loading, error, refetch: fetchCompanies, updateCompanyStatus };
}; 
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../clients/supabaseClient';

export const useUserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const { data, error: queryError } = await supabase
                .from('profiles')
                .select(`
                    id,
                    full_name,
                    avatar_url,
                    user_type,
                    onboarding_complete,
                    created_at,
                    phone,
                    email_verified,
                    employer_profiles (
                        position,
                        companies (
                            name
                        )
                    ),
                    job_seeker_profiles (
                        headline,
                        current_location,
                        skills
                    )
                `);

            if (queryError) {
                throw queryError;
            }

            // Flatten the data
            const formattedUsers = data.map(user => ({
                id: user.id,
                full_name: user.full_name,
                avatar_url: user.avatar_url,
                user_type: user.user_type,
                onboarding_complete: user.onboarding_complete,
                created_at: user.created_at,
                phone: user.phone,
                email_verified: user.email_verified,
                position: user.employer_profiles?.position || null,
                company_name: user.employer_profiles?.companies?.name || null,
                headline: user.job_seeker_profiles?.headline || null,
                location: user.job_seeker_profiles?.current_location || null,
                skills: user.job_seeker_profiles?.skills || [],
                // We can't get the email from this query
                email: 'Email not available' 
            }));

            setUsers(formattedUsers);
        } catch (err) {
            console.error("Error fetching users:", err);
            setError(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const updateUser = useCallback(async (userData) => {
        setLoading(true);
        setError(null);
        try {
            // Update profiles table
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    full_name: userData.full_name,
                    phone: userData.phone,
                })
                .eq('id', userData.id);

            if (profileError) throw profileError;

            // Update employer_profiles if it exists
            if (userData.user_type === 'employer') {
                const { error: employerError } = await supabase
                    .from('employer_profiles')
                    .update({
                        position: userData.position,
                    })
                    .eq('id', userData.id);
                if (employerError) throw employerError;
            }

            // Update job_seeker_profiles if it exists
            if (userData.user_type === 'job_seeker') {
                const { error: seekerError } = await supabase
                    .from('job_seeker_profiles')
                    .update({
                        headline: userData.headline,
                        current_location: userData.location,
                    })
                    .eq('id', userData.id);
                if (seekerError) throw seekerError;
            }

        } catch (err) {
            console.error("Error updating user:", err);
            setError(err);
            throw err; // Re-throw to be caught in the UI
        } finally {
            await fetchUsers(); // Refetch users to get the latest data
            setLoading(false);
        }
    }, [fetchUsers]);

    const deleteUser = useCallback(async (userId) => {
        setLoading(true);
        setError(null);
        try {
            // Delete from related tables first (due to foreign key constraints)
            // Order matters - delete child tables before parent tables
            
            // Note: candidate_documents and interview_notifications tables have been removed

            // Delete from interviews (interviewer_id references profiles)
            const { error: interviewsError } = await supabase
                .from('interviews_v2')
                .delete()
                .eq('interviewer_id', userId);
            
            if (interviewsError && interviewsError.code !== 'PGRST116') {
                throw interviewsError;
            }

            // Delete from messages (sender_id references profiles)
            const { error: messagesError } = await supabase
                .from('messages')
                .delete()
                .eq('sender_id', userId);
            
            if (messagesError && messagesError.code !== 'PGRST116') {
                throw messagesError;
            }

            // Delete from conversation_participants (user_id references profiles)
            const { error: participantsError } = await supabase
                .from('conversation_participants')
                .delete()
                .eq('user_id', userId);
            
            if (participantsError && participantsError.code !== 'PGRST116') {
                throw participantsError;
            }

            // Note: ai_conversations table has been removed

            // Delete from resume_data (user_id references profiles)
            const { error: resumeDataError } = await supabase
                .from('resume_data')
                .delete()
                .eq('user_id', userId);
            
            if (resumeDataError && resumeDataError.code !== 'PGRST116') {
                throw resumeDataError;
            }

            // Delete from team_members (user_id and created_by references profiles)
            const { error: teamMembersError } = await supabase
                .from('team_members')
                .delete()
                .or(`user_id.eq.${userId},created_by.eq.${userId}`);
            
            if (teamMembersError && teamMembersError.code !== 'PGRST116') {
                throw teamMembersError;
            }

            // Delete from company_photos (uploaded_by references profiles)
            const { error: companyPhotosError } = await supabase
                .from('company_photos')
                .delete()
                .eq('uploaded_by', userId);
            
            if (companyPhotosError && companyPhotosError.code !== 'PGRST116') {
                throw companyPhotosError;
            }

            // Delete from job_applications (applicant_id references profiles)
            const { error: applicationsError } = await supabase
                .from('job_applications_v2')
                .delete()
                .eq('applicant_id', userId);
            
            if (applicationsError && applicationsError.code !== 'PGRST116') {
                throw applicationsError;
            }

            // Delete from jobs (created_by references profiles)
            const { error: jobsError } = await supabase
                .from('jobs')
                .delete()
                .eq('created_by', userId);
            
            if (jobsError && jobsError.code !== 'PGRST116') {
                throw jobsError;
            }

            // Delete from employer_profiles BEFORE companies (employer_profiles.company_id references companies)
            const { error: employerError } = await supabase
                .from('employer_profiles')
                .delete()
                .eq('id', userId);
            
            if (employerError && employerError.code !== 'PGRST116') {
                throw employerError;
            }

            // Delete from companies (created_by references profiles) - AFTER employer_profiles
            const { error: companiesError } = await supabase
                .from('companies')
                .delete()
                .eq('created_by', userId);
            
            if (companiesError && companiesError.code !== 'PGRST116') {
                throw companiesError;
            }

            // Delete from transactions (created_by references profiles)
            const { error: transactionsError } = await supabase
                .from('transactions')
                .delete()
                .eq('created_by', userId);
            
            if (transactionsError && transactionsError.code !== 'PGRST116') {
                throw transactionsError;
            }

            // Delete from documents (owner_id references profiles)
            const { error: documentsError } = await supabase
                .from('documents')
                .delete()
                .eq('owner_id', userId);
            
            if (documentsError && documentsError.code !== 'PGRST116') {
                throw documentsError;
            }

            // Delete from job_seeker_profiles if exists
            const { error: seekerError } = await supabase
                .from('job_seeker_profiles')
                .delete()
                .eq('id', userId);
            
            if (seekerError && seekerError.code !== 'PGRST116') {
                throw seekerError;
            }

            // Finally, delete from profiles table
            const { error: profileError } = await supabase
                .from('profiles')
                .delete()
                .eq('id', userId);

            if (profileError) throw profileError;

            // Remove user from local state
            setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));

        } catch (err) {
            console.error("Error deleting user:", err);
            setError(err);
            throw err; // Re-throw to be caught in the UI
        } finally {
            setLoading(false);
        }
    }, []);

    return { users, loading, error, refetch: fetchUsers, updateUser, deleteUser };
}; 
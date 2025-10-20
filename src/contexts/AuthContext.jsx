import React, { createContext, useState, useEffect } from 'react';
import { supabase } from '../clients/supabaseClient';
import useGlobalStore from '../stores/globalStore';

export const AuthContext = createContext();

// Helper function to convert Supabase auth errors to user-friendly messages
const getAuthErrorMessage = (error) => {
  if (!error) return 'An unexpected error occurred';

  // Extract error code and message
  const errorCode = error.code || error.error_code;
  const errorMessage = error.message || error.error_description || '';

  console.log('Auth Error Details:', { errorCode, errorMessage, fullError: error });

  // Map specific error codes to user-friendly messages
  switch (errorCode) {
    // Login errors
    case 'invalid_credentials':
    case 'email_not_confirmed':
      if (errorMessage.toLowerCase().includes('email not confirmed')) {
        return 'Please check your email and click the confirmation link before signing in.';
      }
      return 'Invalid email or password. Please check your credentials and try again.';
    
    case 'too_many_requests':
      return 'Too many login attempts. Please wait a few minutes before trying again.';
    
    case 'user_not_found':
      return 'No account found with this email address. Please check your email or sign up for a new account.';

    // Signup errors
    case 'user_already_registered':
    case 'email_address_not_authorized':
      if (errorMessage.toLowerCase().includes('already registered')) {
        return 'An account with this email already exists. Please sign in instead or use a different email.';
      }
      return 'This email is not authorized to create an account.';
    
    case 'signup_disabled':
      return 'Account registration is currently disabled. Please contact support.';
    
    case 'weak_password':
      return 'Password is too weak. Please use at least 8 characters with a mix of letters, numbers, and symbols.';

    // Password reset errors
    case 'email_change_confirm_fail':
      return 'Email confirmation failed. Please try again or contact support.';
    
    case 'flow_state_not_found':
      return 'Password reset link has expired or is invalid. Please request a new one.';

    // Network and general errors
    case 'network_error':
    case 'fetch_error':
      return 'Network connection error. Please check your internet connection and try again.';
    
    case 'internal_server_error':
      return 'Server error occurred. Please try again in a few moments.';

    // Generic validation errors
    default:
      // Check for specific message patterns
      if (errorMessage.toLowerCase().includes('invalid email')) {
        return 'Please enter a valid email address.';
      }
      if (errorMessage.toLowerCase().includes('password')) {
        if (errorMessage.toLowerCase().includes('weak') || errorMessage.toLowerCase().includes('strength')) {
          return 'Password is too weak. Please use at least 8 characters with a mix of letters, numbers, and symbols.';
        }
        if (errorMessage.toLowerCase().includes('short')) {
          return 'Password is too short. Please use at least 8 characters.';
        }
        return 'Password does not meet requirements. Please use at least 8 characters with a mix of letters, numbers, and symbols.';
      }
      if (errorMessage.toLowerCase().includes('email') && errorMessage.toLowerCase().includes('already')) {
        return 'An account with this email already exists. Please sign in instead.';
      }
      if (errorMessage.toLowerCase().includes('not found')) {
        return 'Account not found. Please check your email or sign up for a new account.';
      }
      if (errorMessage.toLowerCase().includes('confirmed')) {
        return 'Please confirm your email address before signing in.';
      }
      if (errorMessage.toLowerCase().includes('rate limit')) {
        return 'Too many attempts. Please wait a few minutes before trying again.';
      }

      // Return the original message if it's user-friendly, otherwise a generic message
      if (errorMessage && errorMessage.length < 100 && !errorMessage.includes('Error:')) {
        return errorMessage;
      }
      
      return 'An error occurred during authentication. Please try again or contact support if the problem persists.';
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const setGlobalUser = useGlobalStore((state) => state.setUser);
  const setGlobalProfile = useGlobalStore((state) => state.setProfile);

  // Helper function to update both local and global state
  const updateUserState = (userData) => {
    setUser(userData);
    setGlobalUser(userData);
    console.log('=== User Data Updated ===');
    console.log('AuthContext user:', userData);
    console.log('Global store user:', useGlobalStore.getState().user);
    console.log('=====================');
  };

  // Helper function to log company data
  const logCompanyData = (company) => {
    console.log('=== Company Data ===');
    console.log('Company Name:', company.name);
    console.log('Industry:', company.industry);
    console.log('Size:', company.size);
    console.log('Location:', company.headquarters_location);
    console.log('Website:', company.website);
    console.log('Founded Year:', company.founded_year);
    console.log('Description:', company.description);
    console.log('Average Salary:', company.average_salary);
    console.log('Created By:', company.created_by);
    console.log('Created At:', new Date(company.created_at).toLocaleString());
    console.log('Updated At:', new Date(company.updated_at).toLocaleString());
    console.log('Full Company Object:', company);
    console.log('=====================');
  };

  // Check for session on mount
  useEffect(() => {
    const getSession = async () => {
      setLoading(true);
      console.log('=== Session Check Started ===');
      const { data, error } = await supabase.auth.getUser();
      if (data?.user) {
        console.log('Session found for user:', data.user.email);
        // Fetch profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .maybeSingle();
        
        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Error fetching profile:', profileError);
        }
        
        if (profile) {
          console.log('=== Profile Data ===');
          console.log('User Type:', profile.user_type);
          console.log('Full Name:', profile.full_name);
          console.log('Onboarding Complete:', profile.onboarding_complete);
          console.log('Full Profile:', profile);
          console.log('=====================');

          const enrichedUser = {
            ...profile,
            email: data.user.email,
            is_email_verified: !!data.user.email_confirmed_at,
          };

          // If user is an employer, fetch company and employer profile data
          if (profile.user_type === 'employer') {
            console.log('Employer user detected, fetching additional data...');
            // Fetch employer profile to get company_id
            const { data: employerProfile, error: empError } = await supabase
              .from('employer_profiles')
              .select('*')
              .eq('id', data.user.id)
              .maybeSingle();
            
            if (empError && empError.code !== 'PGRST116') {
              console.error('Failed to fetch employer profile:', empError);
            } else if (employerProfile) {
              console.log('=== Employer Profile Data ===');
              console.log('Company ID:', employerProfile.company_id);
              console.log('Position:', employerProfile.position);
              console.log('Department:', employerProfile.department);
              console.log('Full Employer Profile:', employerProfile);
              console.log('=====================');

              // Combine user and employer profile data
              const combinedProfile = {
                ...enrichedUser,
                ...employerProfile
              };
              setGlobalUser(combinedProfile);
              setGlobalProfile(combinedProfile);

              // If employer has a company, fetch company data
              if (employerProfile.company_id) {
                console.log('Company ID found:', employerProfile.company_id);
                const { data: company, error: companyError } = await supabase
                  .from('companies')
                  .select('*')
                  .eq('id', employerProfile.company_id)
                  .maybeSingle();
                
                if (companyError && companyError.code !== 'PGRST116') {
                  console.error('Failed to fetch company data:', companyError);
                } else if (company) {
                  // Use existing logCompanyData helper function
                  logCompanyData(company);
                  // Store company data in the profile
                  const updatedProfile = {
                    ...combinedProfile,
                    company: company
                  };
                  setGlobalUser(updatedProfile);
                  setGlobalProfile(updatedProfile);
                }
              } else {
                console.log('No company associated with this employer yet');
              }
            }
          } else {
            console.log('Non-employer user, updating user data only');
            updateUserState(enrichedUser);
          }

          // Log final state
          console.log('=== Final Global Store State ===');
          const globalState = useGlobalStore.getState();
          console.log('User:', globalState.user);
          console.log('Profile:', globalState.profile);
          console.log('=====================');
        }
      } else {
        console.log('No active session found');
      }
      setLoading(false);
      console.log('=== Session Check Completed ===');
    };
    getSession();
    // Listen for auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_OUT") {
          updateUserState(null);
          setGlobalProfile(null);
        }
        if (event === "SIGNED_IN" && session?.user) {
          supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .maybeSingle()
            .then(async ({ data: profile, error }) => {
              if (error && error.code !== "PGRST116") {
                console.error(
                  "Error fetching profile in auth state change:",
                  error
                );
                return;
              }

              // If profile is missing, create it now using user metadata
              if (!profile) {
                const meta = session.user.user_metadata || {};
                const derivedUserType = meta.initial_user_type || 'job_seeker';
                const derivedFullName = meta.full_name || session.user.email?.split('@')[0] || 'New User';
                const companyName = meta.company_name || null;

                // Create basic profile
                const { error: createProfileError } = await supabase
                  .from('profiles')
                  .insert({
                    id: session.user.id,
                    user_type: derivedUserType,
                    full_name: derivedFullName,
                    email: session.user.email,
                    // onboarding_complete intentionally omitted to avoid schema mismatch
                  });

                if (createProfileError) {
                  console.error('Failed to auto-create profile on SIGNED_IN:', {
                    message: createProfileError?.message,
                    details: createProfileError?.details,
                    hint: createProfileError?.hint,
                    code: createProfileError?.code,
                  });
                  return;
                }

                // If employer, create company and employer profile
                if (derivedUserType === 'employer' && companyName) {
                  const { data: companyData, error: companyError } = await supabase
                    .from('companies')
                    .insert({ name: companyName, created_by: session.user.id, is_approved: false })
                    .select()
                    .single();

                  if (companyError) {
                    console.error('Failed to auto-create company on SIGNED_IN:', companyError);
                  } else {
                    const { error: employerProfileError } = await supabase
                      .from('employer_profiles')
                      .insert({ id: session.user.id, company_id: companyData.id });

                    if (employerProfileError) {
                      console.error('Failed to auto-create employer profile on SIGNED_IN:', employerProfileError);
                    }
                  }
                }

                // Refetch the profile after creation
                const { data: newProfile } = await supabase
                  .from('profiles')
                  .select('*')
                  .eq('id', session.user.id)
                  .maybeSingle();

                if (newProfile) {
                  const enrichedUser = {
                    ...newProfile,
                    email: session.user.email,
                    is_email_verified: !!session.user.email_confirmed_at,
                  };
                  updateUserState(enrichedUser);
                  setGlobalUser(enrichedUser);
                  setGlobalProfile(enrichedUser);
                }
                return;
              }

              if (profile) {
                const enrichedUser = {
                  ...profile,
                  email: session.user.email,
                  is_email_verified: !!session.user.email_confirmed_at,
                };
                
                if (profile.user_type === 'employer') {
                  const { data: employerProfile, error: empError } = await supabase
                    .from('employer_profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .maybeSingle();

                  if (empError && empError.code !== 'PGRST116') {
                    console.error('Failed to fetch employer profile in auth state change:', empError);
                  } else if (employerProfile) {
                    const combinedProfile = {
                      ...enrichedUser,
                      ...employerProfile
                    };
                    
                    if (employerProfile.company_id) {
                      const { data: company, error: companyError } = await supabase
                        .from('companies')
                        .select('*')
                        .eq('id', employerProfile.company_id)
                        .maybeSingle();
                      if (companyError && companyError.code !== 'PGRST116') {
                        console.error('Failed to fetch company data in auth state change:', companyError);
                      } else if (company) {
                        combinedProfile.company = company;
                      }
                    }
                    
                    setGlobalUser(combinedProfile);
                    setGlobalProfile(combinedProfile);
                  }
                }
                updateUserState(enrichedUser);
              }
            });
        }
      }
    );
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  // Signup function
  const signup = async ({ type, email, password, name, company }) => {
    try {
      // 1. Create user in Supabase Auth
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/email-verified`,
          data: {
            initial_user_type: type === 'candidate' ? 'job_seeker' : 'employer',
            full_name: name,
            company_name: type === 'employer' ? company : null,
          },
        },
      });

      if (signUpError) {
        console.error("Error during Supabase signup:", signUpError);
        throw new Error(getAuthErrorMessage(signUpError));
      }

      const userId = signUpData?.user?.id;
      if (!userId) {
        console.error("Signup succeeded but no user ID was returned.");
        throw new Error("An unexpected error occurred during signup.");
      }

      const hasSession = !!signUpData?.session;

      // 2. Insert into profiles only if we already have a session (email confirmations disabled)
      if (hasSession) {
        const { error: profileError } = await supabase.from('profiles').insert({
          id: userId,
          user_type: type === 'candidate' ? 'job_seeker' : 'employer',
          full_name: name,
          // onboarding_complete intentionally omitted to avoid schema mismatch
        });

        if (profileError) {
          console.error("Error creating user profile:", {
            message: profileError?.message,
            details: profileError?.details,
            hint: profileError?.hint,
            code: profileError?.code,
          });
          throw new Error("Failed to create your user profile.");
        }

        // 3. If employer and session exists, create company and employer profile immediately
        if (type === 'employer') {
          const { data: companyData, error: companyError } = await supabase
            .from('companies')
            .insert({ name: company, created_by: userId, is_approved: false })
            .select()
            .single();

          if (companyError) {
            console.error("Error creating company:", {
              message: companyError?.message,
              details: companyError?.details,
              hint: companyError?.hint,
              code: companyError?.code,
            });
            throw new Error("Failed to create your company profile.");
          }

          const { error: employerProfileError } = await supabase
            .from('employer_profiles')
            .insert({ id: userId, company_id: companyData.id });

          if (employerProfileError) {
            console.error("Error creating employer profile:", {
              message: employerProfileError?.message,
              details: employerProfileError?.details,
              hint: employerProfileError?.hint,
              code: employerProfileError?.code,
            });
            throw new Error("Failed to create your employer profile.");
          }
        }
      } else {
        // No session yet (likely email confirmation is enabled). We defer profile creation
        // until the user verifies email and signs in (handled in onAuthStateChange).
        console.log('Signup complete without session; deferring profile creation until SIGNED_IN.');
      }

      return signUpData;

    } catch (error) {
      console.error('Signup process failed:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("An unknown error occurred during signup.");
    }
  };

  // Login function
  const login = async (email, password) => {
    console.log('=== Login Process Started ===');
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        const friendlyMessage = getAuthErrorMessage(error);
        throw new Error(friendlyMessage);
      }
      
      console.log('Auth successful:', data.user.email);
      
      // Fetch profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();
        
      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Profile fetch error:', profileError);
        throw new Error('Failed to load your profile. Please try signing in again.');
      }
      
      if (!profile) {
        throw new Error('Your account profile was not found. Please contact support for assistance.');
      }
      
      console.log('Profile fetched:', profile);

      const enrichedUser = {
        ...profile,
        email: data.user.email,
        is_email_verified: !!data.user.email_confirmed_at,
      };

      // If user is an employer, fetch company and employer profile data
      if (profile.user_type === 'employer') {
        console.log('Employer user detected, fetching additional data...');
        
        // Fetch employer profile to get company_id
        const { data: employerProfile, error: empError } = await supabase
          .from('employer_profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();
        
        if (empError && empError.code !== 'PGRST116') {
          console.error('Employer profile fetch error:', empError);
          throw new Error('Failed to load your employer profile. Please try again.');
        }
        
        if (!employerProfile) {
          throw new Error('Your employer profile was not found. Please contact support for assistance.');
        }
        
        console.log('Employer profile fetched:', employerProfile);

        // Combine user and employer profile data
        const combinedProfile = {
          ...enrichedUser,
          ...employerProfile
        };
        setGlobalUser(combinedProfile);
        setGlobalProfile(combinedProfile);

        // If employer has a company, fetch company data
        if (employerProfile.company_id) {
          console.log('Company ID found:', employerProfile.company_id);
          const { data: company, error: companyError } = await supabase
            .from('companies')
            .select('*')
            .eq('id', employerProfile.company_id)
            .single();
          
          if (companyError && companyError.code !== 'PGRST116') {
            // Don't fail login for company fetch errors, just log
            console.error('Company fetch error:', companyError);
          } else if (company) {
            logCompanyData(company);
            // Store company data in the profile
            const updatedProfile = {
              ...combinedProfile,
              company: company
            };
            setGlobalUser(updatedProfile);
            setGlobalProfile(updatedProfile);
            console.log('Company data stored in global state');
          }
        } else {
          console.log('No company associated with this employer yet');
        }

        // Log final state
        console.log('=== Final Global Store State ===');
        const globalState = useGlobalStore.getState();
        console.log('User:', globalState.user);
        console.log('Profile:', globalState.profile);
        console.log('=====================');
      } else {
        // For non-employer users, just update user data
        console.log('Non-employer user, updating user data only');
        updateUserState(enrichedUser);
      }
      
      console.log('=== Login Process Completed ===');
      return enrichedUser;
    } catch (error) {
      throw error; // Re-throw the error with friendly message
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    updateUserState(null);
    setGlobalProfile(null);
    // Ensure any locally persisted login hints are cleared on logout
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('login-password');
        if (localStorage.getItem('remember-login') !== 'true') {
          localStorage.removeItem('login-email');
        }
        // Admin keys cleanup as well
        localStorage.removeItem('admin-login-password');
        if (localStorage.getItem('remember-login-admin') !== 'true') {
          localStorage.removeItem('admin-login-email');
        }
      } catch (_) {
        // ignore storage errors
      }
    }
  };

  const updateUser = (updates) => {
    updateUserState((prev) => ({ ...prev, ...updates }));
  };

  const completeOnboarding = async () => {
    if (!user) return;
    await supabase.from('profiles').update({ onboarding_complete: true }).eq('id', user.id);
    updateUser({ onboarding_complete: true });
  };

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    updateUser,
    completeOnboarding,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

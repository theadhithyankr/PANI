-- =====================================================
-- FIX RLS POLICIES FOR SIGNUP PROCESS
-- =====================================================
-- This script fixes the Row Level Security policies to allow
-- profile creation during the signup process

-- Drop existing policies and recreate them with proper permissions
-- for the signup process

-- =====================================================
-- PROFILES TABLE POLICIES
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- CRITICAL FIX: Allow profile creation during signup
-- This policy allows inserting a profile if the user ID matches the authenticated user
-- OR if the user is not yet authenticated (during signup process)
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (
    auth.uid() = id OR 
    (auth.uid() IS NULL AND id IS NOT NULL)
  );

-- Alternative approach: Allow service role to insert profiles
-- This is more secure and is the recommended approach
DROP POLICY IF EXISTS "Service role can insert profiles" ON public.profiles;
CREATE POLICY "Service role can insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (
    auth.uid() = id OR 
    auth.jwt() ->> 'role' = 'service_role'
  );

-- =====================================================
-- JOB SEEKER PROFILES POLICIES
-- =====================================================

-- Update job seeker profiles policy to allow creation during signup
DROP POLICY IF EXISTS "Users can manage own job seeker profile" ON public.job_seeker_profiles;
CREATE POLICY "Users can manage own job seeker profile" ON public.job_seeker_profiles
  FOR ALL USING (
    auth.uid() = id OR 
    auth.jwt() ->> 'role' = 'service_role'
  );

-- =====================================================
-- EMPLOYER PROFILES POLICIES  
-- =====================================================

-- Update employer profiles policy to allow creation during signup
DROP POLICY IF EXISTS "Users can manage own employer profile" ON public.employer_profiles;
CREATE POLICY "Users can manage own employer profile" ON public.employer_profiles
  FOR ALL USING (
    auth.uid() = id OR 
    auth.jwt() ->> 'role' = 'service_role'
  );

-- =====================================================
-- COMPANIES POLICIES
-- =====================================================

-- Update companies policy to allow creation during signup
DROP POLICY IF EXISTS "Users can manage own companies" ON public.companies;
CREATE POLICY "Users can manage own companies" ON public.companies
  FOR ALL USING (
    auth.uid() = created_by OR 
    auth.jwt() ->> 'role' = 'service_role'
  );

-- Allow inserting companies during signup
DROP POLICY IF EXISTS "Users can create companies" ON public.companies;
CREATE POLICY "Users can create companies" ON public.companies
  FOR INSERT WITH CHECK (
    auth.uid() = created_by OR 
    auth.jwt() ->> 'role' = 'service_role'
  );

-- =====================================================
-- ALTERNATIVE: DISABLE RLS TEMPORARILY FOR SIGNUP
-- =====================================================
-- If the above policies don't work, we can temporarily disable RLS
-- for the signup process by creating a function that bypasses RLS

-- Create a function to handle signup with elevated privileges
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  -- This function runs with the security context of the function definer
  -- Insert profile for new user
  INSERT INTO public.profiles (id, user_type, full_name, onboarding_complete)
  VALUES (NEW.id, 'job_seeker', COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'), false);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.profiles TO anon, authenticated;
GRANT ALL ON public.job_seeker_profiles TO anon, authenticated;
GRANT ALL ON public.employer_profiles TO anon, authenticated;
GRANT ALL ON public.companies TO anon, authenticated;
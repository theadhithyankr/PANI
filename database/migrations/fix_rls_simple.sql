-- =====================================================
-- SIMPLE RLS FIX FOR LOGIN/SIGNUP ISSUES
-- =====================================================
-- This script fixes the Row Level Security policies that are
-- causing HTTP 406 errors during login and signup

-- =====================================================
-- 1. FIX PROFILES TABLE POLICIES
-- =====================================================

-- Drop all existing policies for profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON public.profiles;

-- Create simple, working policies
CREATE POLICY "Enable read access for users based on user_id" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Enable insert for authenticated users only" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable update for users based on user_id" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- =====================================================
-- 2. FIX JOB SEEKER PROFILES POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can manage own job seeker profile" ON public.job_seeker_profiles;

CREATE POLICY "Enable all operations for job seeker profiles" ON public.job_seeker_profiles
  FOR ALL USING (auth.uid() = id);

-- =====================================================
-- 3. FIX EMPLOYER PROFILES POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can manage own employer profile" ON public.employer_profiles;

CREATE POLICY "Enable all operations for employer profiles" ON public.employer_profiles
  FOR ALL USING (auth.uid() = id);

-- =====================================================
-- 4. FIX COMPANIES POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view companies" ON public.companies;
DROP POLICY IF EXISTS "Users can manage own companies" ON public.companies;
DROP POLICY IF EXISTS "Users can create companies" ON public.companies;

-- Allow everyone to view companies (public data)
CREATE POLICY "Enable read access for all users" ON public.companies
  FOR SELECT USING (true);

-- Allow users to manage their own companies
CREATE POLICY "Enable all operations for company creators" ON public.companies
  FOR ALL USING (auth.uid() = created_by);

-- =====================================================
-- 5. GRANT NECESSARY PERMISSIONS
-- =====================================================

-- Ensure authenticated users have the necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_seeker_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employer_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.companies TO authenticated;

-- Also grant to anon for signup process
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT, INSERT ON public.profiles TO anon;
GRANT SELECT, INSERT ON public.job_seeker_profiles TO anon;
GRANT SELECT, INSERT ON public.employer_profiles TO anon;
GRANT SELECT, INSERT ON public.companies TO anon;
-- =====================================================
-- FORCE FIX RLS POLICIES - HANDLES EXISTING POLICIES
-- =====================================================
-- This script FORCES the recreation of RLS policies by
-- dropping ALL existing policies first, then creating new ones

-- =====================================================
-- 1. FORCE DROP ALL EXISTING POLICIES
-- =====================================================

-- Drop ALL possible existing policies for profiles
DROP POLICY IF EXISTS "Enable read access for users based on user_id" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;

-- Drop ALL possible existing policies for job_seeker_profiles
DROP POLICY IF EXISTS "Enable all operations for job seeker profiles" ON public.job_seeker_profiles;
DROP POLICY IF EXISTS "Users can manage own job seeker profile" ON public.job_seeker_profiles;
DROP POLICY IF EXISTS "job_seeker_profiles_policy" ON public.job_seeker_profiles;

-- Drop ALL possible existing policies for employer_profiles
DROP POLICY IF EXISTS "Enable all operations for employer profiles" ON public.employer_profiles;
DROP POLICY IF EXISTS "Users can manage own employer profile" ON public.employer_profiles;
DROP POLICY IF EXISTS "employer_profiles_policy" ON public.employer_profiles;

-- Drop ALL possible existing policies for companies
DROP POLICY IF EXISTS "Enable read access for all users" ON public.companies;
DROP POLICY IF EXISTS "Enable all operations for company creators" ON public.companies;
DROP POLICY IF EXISTS "Users can view companies" ON public.companies;
DROP POLICY IF EXISTS "Users can manage own companies" ON public.companies;
DROP POLICY IF EXISTS "Users can create companies" ON public.companies;
DROP POLICY IF EXISTS "companies_select_policy" ON public.companies;
DROP POLICY IF EXISTS "companies_insert_policy" ON public.companies;

-- =====================================================
-- 2. CREATE NEW WORKING POLICIES
-- =====================================================

-- Profiles policies - SIMPLE AND WORKING
CREATE POLICY "profiles_read_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Job seeker profiles - SIMPLE AND WORKING
CREATE POLICY "job_seeker_all_own" ON public.job_seeker_profiles
  FOR ALL USING (auth.uid() = id);

-- Employer profiles - SIMPLE AND WORKING
CREATE POLICY "employer_all_own" ON public.employer_profiles
  FOR ALL USING (auth.uid() = id);

-- Companies policies - PUBLIC READ, OWN MANAGE
CREATE POLICY "companies_read_all" ON public.companies
  FOR SELECT USING (true);

CREATE POLICY "companies_manage_own" ON public.companies
  FOR ALL USING (auth.uid() = created_by);

-- =====================================================
-- 3. FORCE GRANT PERMISSIONS
-- =====================================================

-- Revoke all first, then grant fresh
REVOKE ALL ON public.profiles FROM authenticated, anon;
REVOKE ALL ON public.job_seeker_profiles FROM authenticated, anon;
REVOKE ALL ON public.employer_profiles FROM authenticated, anon;
REVOKE ALL ON public.companies FROM authenticated, anon;

-- Grant fresh permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;

-- For authenticated users (logged in)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_seeker_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employer_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.companies TO authenticated;

-- For anonymous users (signup process)
GRANT SELECT, INSERT ON public.profiles TO anon;
GRANT SELECT, INSERT ON public.job_seeker_profiles TO anon;
GRANT SELECT, INSERT ON public.employer_profiles TO anon;
GRANT SELECT, INSERT ON public.companies TO anon;

-- =====================================================
-- 4. VERIFY SETUP
-- =====================================================

-- Show all policies to confirm they're created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'job_seeker_profiles', 'employer_profiles', 'companies')
ORDER BY tablename, policyname;
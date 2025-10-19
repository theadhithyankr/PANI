-- =====================================================
-- DROP ALL EXISTING TABLES - CLEAN SLATE
-- =====================================================
-- This script safely removes all existing tables to prepare for clean migration
-- Run this BEFORE running the main migration file

-- Disable foreign key checks temporarily by dropping in reverse dependency order

-- Drop tables that depend on other tables first
DROP TABLE IF EXISTS public.resume_data CASCADE;
DROP TABLE IF EXISTS public.ai_conversations CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.conversation_participants CASCADE;
DROP TABLE IF EXISTS public.conversations CASCADE;
DROP TABLE IF EXISTS public.job_offers CASCADE;
DROP TABLE IF EXISTS public.interviews CASCADE;
DROP TABLE IF EXISTS public.application_events CASCADE;
DROP TABLE IF EXISTS public.job_applications CASCADE;
DROP TABLE IF EXISTS public.jobs CASCADE;
DROP TABLE IF EXISTS public.support_tiers CASCADE;
DROP TABLE IF EXISTS public.documents CASCADE;
DROP TABLE IF EXISTS public.company_photos CASCADE;
DROP TABLE IF EXISTS public.team_members CASCADE;
DROP TABLE IF EXISTS public.companies CASCADE;
DROP TABLE IF EXISTS public.employer_profiles CASCADE;
DROP TABLE IF EXISTS public.job_seeker_profiles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop any other tables that might exist from previous attempts
DROP TABLE IF EXISTS public.invitations CASCADE;
DROP TABLE IF EXISTS public.direct_interviews CASCADE;
DROP TABLE IF EXISTS public.candidate_invitations CASCADE;
DROP TABLE IF EXISTS public.employer_onboarding CASCADE;
DROP TABLE IF EXISTS public.job_seeker_onboarding CASCADE;

-- Drop any views that might exist
DROP VIEW IF EXISTS public.application_summary CASCADE;
DROP VIEW IF EXISTS public.job_stats CASCADE;

-- Drop any functions that might exist
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

-- Drop any triggers that might exist
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles CASCADE;
DROP TRIGGER IF EXISTS update_companies_updated_at ON public.companies CASCADE;
DROP TRIGGER IF EXISTS update_jobs_updated_at ON public.jobs CASCADE;

-- Clean up any sequences that might be left over
DROP SEQUENCE IF EXISTS public.support_tiers_id_seq CASCADE;

-- Note: This script uses CASCADE to ensure all dependent objects are also dropped
-- After running this script, run the main migration file to recreate all tables
-- Disable RLS for Demo - Remove all Row Level Security policies and disable RLS
-- This script removes all RLS policies and disables RLS on all tables for demo purposes

-- First, drop all existing policies on all tables
-- Profiles table
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for users based on user_id" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_read_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

-- Job Seeker Profiles
DROP POLICY IF EXISTS "Users can manage own job seeker profile" ON public.job_seeker_profiles;
DROP POLICY IF EXISTS "Enable all operations for job seeker profiles" ON public.job_seeker_profiles;
DROP POLICY IF EXISTS "job_seeker_profiles_policy" ON public.job_seeker_profiles;
DROP POLICY IF EXISTS "job_seeker_all_own" ON public.job_seeker_profiles;

-- Employer Profiles
DROP POLICY IF EXISTS "Users can manage own employer profile" ON public.employer_profiles;
DROP POLICY IF EXISTS "Enable all operations for employer profiles" ON public.employer_profiles;
DROP POLICY IF EXISTS "employer_profiles_policy" ON public.employer_profiles;
DROP POLICY IF EXISTS "employer_all_own" ON public.employer_profiles;

-- Companies
DROP POLICY IF EXISTS "Users can view companies" ON public.companies;
DROP POLICY IF EXISTS "Users can manage own companies" ON public.companies;
DROP POLICY IF EXISTS "Users can create companies" ON public.companies;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.companies;
DROP POLICY IF EXISTS "Enable all operations for company creators" ON public.companies;
DROP POLICY IF EXISTS "companies_select_policy" ON public.companies;
DROP POLICY IF EXISTS "companies_insert_policy" ON public.companies;
DROP POLICY IF EXISTS "companies_read_all" ON public.companies;
DROP POLICY IF EXISTS "companies_manage_own" ON public.companies;

-- Jobs
DROP POLICY IF EXISTS "Users can view active jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can manage own jobs" ON public.jobs;

-- Job Applications
DROP POLICY IF EXISTS "Users can view own applications" ON public.job_applications;
DROP POLICY IF EXISTS "Users can view applications for their jobs" ON public.job_applications;
DROP POLICY IF EXISTS "Users can create applications" ON public.job_applications;
DROP POLICY IF EXISTS "Users can update own applications" ON public.job_applications;

-- Job Applications V2
DROP POLICY IF EXISTS "Employers can view applications for their jobs" ON public.job_applications_v2;
DROP POLICY IF EXISTS "Employers can create applications for their jobs" ON public.job_applications_v2;
DROP POLICY IF EXISTS "Employers can update applications for their jobs" ON public.job_applications_v2;
DROP POLICY IF EXISTS "Candidates can view their applications" ON public.job_applications_v2;
DROP POLICY IF EXISTS "Candidates can create applications" ON public.job_applications_v2;
DROP POLICY IF EXISTS "Candidates can update their applications" ON public.job_applications_v2;

-- Interviews
DROP POLICY IF EXISTS "Users can view interviews they're involved in" ON public.interviews;

-- Interviews V2
DROP POLICY IF EXISTS "Employers can view their company interviews" ON public.interviews_v2;
DROP POLICY IF EXISTS "Employers can create interviews for their company" ON public.interviews_v2;
DROP POLICY IF EXISTS "Employers can update their company interviews" ON public.interviews_v2;
DROP POLICY IF EXISTS "Candidates can view their interviews" ON public.interviews_v2;
DROP POLICY IF EXISTS "Candidates can update their interviews" ON public.interviews_v2;
DROP POLICY IF EXISTS "Employers can delete their company interviews" ON public.interviews_v2;

-- Interview Invitations
DROP POLICY IF EXISTS "Employers can manage their invitations" ON public.interview_invitations;

-- Documents
DROP POLICY IF EXISTS "Users can view their own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can insert their own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can update their own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can delete their own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can manage own documents" ON public.documents;

-- Conversations
DROP POLICY IF EXISTS "Enable read access for participants" ON public.conversations;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.conversations;
DROP POLICY IF EXISTS "Enable update for participants" ON public.conversations;
DROP POLICY IF EXISTS "Enable delete for participants" ON public.conversations;

-- Conversations V2
DROP POLICY IF EXISTS "Enable read access for participants" ON public.conversations_v2;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.conversations_v2;
DROP POLICY IF EXISTS "Enable update for participants" ON public.conversations_v2;
DROP POLICY IF EXISTS "Enable delete for participants" ON public.conversations_v2;

-- Messages
DROP POLICY IF EXISTS "Enable read access for conversation participants" ON public.messages;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.messages;
DROP POLICY IF EXISTS "Enable update for sender" ON public.messages;
DROP POLICY IF EXISTS "Enable delete for sender" ON public.messages;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can create messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;

-- Messages V2
DROP POLICY IF EXISTS "Enable read access for conversation participants" ON public.messages_v2;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.messages_v2;
DROP POLICY IF EXISTS "Enable update for sender" ON public.messages_v2;
DROP POLICY IF EXISTS "Enable delete for sender" ON public.messages_v2;

-- Messages V3
DROP POLICY IF EXISTS "Users can view messages from their conversations" ON public.messages_v3;
DROP POLICY IF EXISTS "Users can insert messages to their conversations" ON public.messages_v3;
DROP POLICY IF EXISTS "Users can update messages in their conversations" ON public.messages_v3;

-- Conversation Participants
DROP POLICY IF EXISTS "Enable read access for self" ON public.conversation_participants;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.conversation_participants;
DROP POLICY IF EXISTS "Enable delete for self" ON public.conversation_participants;

-- Storage policies (for documents bucket)
DROP POLICY IF EXISTS "Users can upload their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can read their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own documents" ON storage.objects;

-- Now disable RLS on all tables
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_seeker_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.employer_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications_v2 DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.interviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.interviews_v2 DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_invitations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_offers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations_v2 DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages_v2 DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages_v3 DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_data DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations DISABLE ROW LEVEL SECURITY;

-- Disable RLS on storage.objects if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'objects') THEN
        ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
    END IF;
END $$;

COMMIT;
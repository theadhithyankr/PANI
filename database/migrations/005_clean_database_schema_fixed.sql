-- =====================================================
-- CLEAN DATABASE SCHEMA FOR VELAI V3 (FIXED VERSION)
-- =====================================================
-- This migration creates a clean, scalable database structure
-- with proper dependency ordering to avoid foreign key errors

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 1. CORE USER TABLES
-- =====================================================

-- Main profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL,
  user_type text NOT NULL CHECK (user_type IN ('job_seeker', 'employer', 'admin', 'hr_manager')),
  full_name text NOT NULL,
  avatar_url text,
  phone text,
  email_verified boolean DEFAULT false,
  phone_verified boolean DEFAULT false,
  onboarding_complete boolean DEFAULT false,
  last_active_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Job seeker profiles (detailed info for candidates)
CREATE TABLE IF NOT EXISTS public.job_seeker_profiles (
  id uuid NOT NULL,
  headline text,
  summary text,
  experience_years integer,
  current_location text,
  preferred_locations text[],
  willing_to_relocate boolean DEFAULT true,
  preferred_job_types text[],
  target_salary_range jsonb,
  skills text[],
  languages jsonb,
  cultural_preferences jsonb,
  relocation_timeline text,
  ai_match_data jsonb,
  ai_generated_summary text,
  ai_career_insights jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT job_seeker_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT job_seeker_profiles_id_fkey FOREIGN KEY (id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- =====================================================
-- 2. COMPANY & ORGANIZATION TABLES
-- =====================================================

-- Companies table
CREATE TABLE IF NOT EXISTS public.companies (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  logo_url text,
  cover_image_url text,
  website text,
  industry text,
  size text,
  description text,
  ai_generated_summary text,
  headquarters_location text,
  founded_year integer,
  average_salary numeric,
  is_approved boolean DEFAULT true,
  created_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT companies_pkey PRIMARY KEY (id),
  CONSTRAINT companies_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);

-- Employer profiles (detailed info for employers) - moved after companies
CREATE TABLE IF NOT EXISTS public.employer_profiles (
  id uuid NOT NULL,
  company_id uuid,
  position text,
  department text,
  is_admin boolean DEFAULT false,
  ai_generated_summary text,
  management_style jsonb,
  hiring_preferences jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT employer_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT employer_profiles_id_fkey FOREIGN KEY (id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT employer_profiles_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE SET NULL
);

-- =====================================================
-- 3. DOCUMENTS & FILES (MOVED UP)
-- =====================================================

-- Documents table (for all user documents) - moved before job_applications
CREATE TABLE IF NOT EXISTS public.documents (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  owner_id uuid NOT NULL,
  document_type text NOT NULL CHECK (document_type IN ('resume', 'cover_letter', 'portfolio', 'certificate', 'other')),
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size integer NOT NULL,
  file_type text NOT NULL,
  is_verified boolean DEFAULT false,
  verify_notes text,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT documents_pkey PRIMARY KEY (id),
  CONSTRAINT documents_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- =====================================================
-- 4. SUPPORT TIERS & JOBS
-- =====================================================

-- Support tiers for job posting
CREATE TABLE IF NOT EXISTS public.support_tiers (
  id bigint NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  features jsonb NOT NULL,
  pricing_model text NOT NULL,
  pricing_details jsonb NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT support_tiers_pkey PRIMARY KEY (id)
);

-- Jobs table
CREATE TABLE IF NOT EXISTS public.jobs (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  company_id uuid NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  requirements text,
  responsibilities text,
  location text,
  feature_image_url text,
  is_remote boolean DEFAULT false,
  is_hybrid boolean DEFAULT false,
  job_type text,
  experience_level text,
  salary_range jsonb,
  skills_required text[],
  benefits text[],
  application_deadline timestamp with time zone,
  start_date timestamp with time zone,
  support_tier_id bigint NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'closed', 'archived')),
  created_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  drivers_license text,
  additional_questions text[],
  preferred_language text,
  priority text,
  visa_sponsorship boolean DEFAULT false,
  relocation boolean DEFAULT false,
  equity text,
  CONSTRAINT jobs_pkey PRIMARY KEY (id),
  CONSTRAINT jobs_support_tier_id_fkey FOREIGN KEY (support_tier_id) REFERENCES public.support_tiers(id),
  CONSTRAINT jobs_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id),
  CONSTRAINT jobs_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE
);

-- =====================================================
-- 5. APPLICATIONS SYSTEM
-- =====================================================

-- Main applications table - now documents table exists
CREATE TABLE IF NOT EXISTS public.job_applications (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  job_id uuid NOT NULL,
  applicant_id uuid NOT NULL,
  
  -- Application details
  cover_note text,
  ai_match_score numeric,
  status text NOT NULL DEFAULT 'applied' CHECK (status IN (
    'applied', 'invited', 'accepted', 'reviewing', 'shortlisted', 
    'interviewing', 'offered', 'hired', 'rejected', 'withdrawn', 'expired'
  )),
  
  -- Documents
  resume_id uuid,
  cover_letter_id uuid,
  additional_document_ids uuid[],
  
  -- Application-specific data
  availability_date date,
  salary_expectation text,
  visa_status text,
  motivation text,
  custom_questions jsonb DEFAULT '{}',
  
  -- Employer notes
  employer_notes text,
  internal_rating integer CHECK (internal_rating >= 1 AND internal_rating <= 5),
  
  -- Timestamps
  application_date timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT job_applications_pkey PRIMARY KEY (id),
  CONSTRAINT job_applications_applicant_id_fkey FOREIGN KEY (applicant_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT job_applications_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE,
  CONSTRAINT job_applications_resume_id_fkey FOREIGN KEY (resume_id) REFERENCES public.documents(id),
  CONSTRAINT job_applications_cover_letter_id_fkey FOREIGN KEY (cover_letter_id) REFERENCES public.documents(id),
  UNIQUE(job_id, applicant_id)
);

-- Insert default support tier
INSERT INTO public.support_tiers (id, name, description, features, pricing_model, pricing_details) 
VALUES (1, 'Basic', 'Basic job posting', '{"basic_posting": true}', 'free', '{"price": 0}')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 6. INDEXES FOR PERFORMANCE
-- =====================================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS profiles_user_type_idx ON public.profiles(user_type);
CREATE INDEX IF NOT EXISTS profiles_onboarding_complete_idx ON public.profiles(onboarding_complete);

-- Job applications indexes
CREATE INDEX IF NOT EXISTS job_applications_job_id_idx ON public.job_applications(job_id);
CREATE INDEX IF NOT EXISTS job_applications_applicant_id_idx ON public.job_applications(applicant_id);
CREATE INDEX IF NOT EXISTS job_applications_status_idx ON public.job_applications(status);

-- Jobs indexes
CREATE INDEX IF NOT EXISTS jobs_company_id_idx ON public.jobs(company_id);
CREATE INDEX IF NOT EXISTS jobs_status_idx ON public.jobs(status);

-- Documents indexes
CREATE INDEX IF NOT EXISTS documents_owner_id_idx ON public.documents(owner_id);
CREATE INDEX IF NOT EXISTS documents_document_type_idx ON public.documents(document_type);

-- =====================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_seeker_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Job seeker profiles policies
DROP POLICY IF EXISTS "Users can manage own job seeker profile" ON public.job_seeker_profiles;
CREATE POLICY "Users can manage own job seeker profile" ON public.job_seeker_profiles
  FOR ALL USING (auth.uid() = id);

-- Employer profiles policies
DROP POLICY IF EXISTS "Users can manage own employer profile" ON public.employer_profiles;
CREATE POLICY "Users can manage own employer profile" ON public.employer_profiles
  FOR ALL USING (auth.uid() = id);

-- Companies policies
DROP POLICY IF EXISTS "Users can view companies" ON public.companies;
CREATE POLICY "Users can view companies" ON public.companies
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage own companies" ON public.companies;
CREATE POLICY "Users can manage own companies" ON public.companies
  FOR ALL USING (auth.uid() = created_by);

-- Jobs policies
DROP POLICY IF EXISTS "Users can view active jobs" ON public.jobs;
CREATE POLICY "Users can view active jobs" ON public.jobs
  FOR SELECT USING (status = 'active' OR auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can manage own jobs" ON public.jobs;
CREATE POLICY "Users can manage own jobs" ON public.jobs
  FOR ALL USING (auth.uid() = created_by);

-- Job applications policies
DROP POLICY IF EXISTS "Users can view own applications" ON public.job_applications;
CREATE POLICY "Users can view own applications" ON public.job_applications
  FOR SELECT USING (
    auth.uid() = applicant_id OR 
    auth.uid() IN (SELECT created_by FROM public.jobs WHERE id = job_id)
  );

DROP POLICY IF EXISTS "Users can create applications" ON public.job_applications;
CREATE POLICY "Users can create applications" ON public.job_applications
  FOR INSERT WITH CHECK (auth.uid() = applicant_id);

DROP POLICY IF EXISTS "Users can update own applications" ON public.job_applications;
CREATE POLICY "Users can update own applications" ON public.job_applications
  FOR UPDATE USING (
    auth.uid() = applicant_id OR 
    auth.uid() IN (SELECT created_by FROM public.jobs WHERE id = job_id)
  );

-- Documents policies
DROP POLICY IF EXISTS "Users can manage own documents" ON public.documents;
CREATE POLICY "Users can manage own documents" ON public.documents
  FOR ALL USING (auth.uid() = owner_id);
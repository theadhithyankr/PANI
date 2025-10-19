-- =====================================================
-- CLEAN DATABASE SCHEMA FOR VELAI V3
-- =====================================================
-- This migration creates a clean, scalable database structure
-- that eliminates confusion between interviews, invitations, and applications

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

-- Employer profiles (detailed info for employers)
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
  CONSTRAINT employer_profiles_id_fkey FOREIGN KEY (id) REFERENCES public.profiles(id) ON DELETE CASCADE
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

-- Team members (company employees)
CREATE TABLE IF NOT EXISTS public.team_members (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  company_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text NOT NULL,
  permissions jsonb,
  is_active boolean DEFAULT true,
  created_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT team_members_pkey PRIMARY KEY (id),
  CONSTRAINT team_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT team_members_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id),
  CONSTRAINT team_members_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE,
  UNIQUE(company_id, user_id)
);

-- Company photos
CREATE TABLE IF NOT EXISTS public.company_photos (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  company_id uuid NOT NULL,
  photo_url text NOT NULL,
  caption text,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  uploaded_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT company_photos_pkey PRIMARY KEY (id),
  CONSTRAINT company_photos_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.profiles(id),
  CONSTRAINT company_photos_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE
);

-- =====================================================
-- 3. JOBS & APPLICATIONS (SIMPLIFIED)
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
-- 4. UNIFIED APPLICATION SYSTEM (CLEAN APPROACH)
-- =====================================================

-- Main applications table - SINGLE SOURCE OF TRUTH
CREATE TABLE IF NOT EXISTS public.job_applications (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  job_id uuid NOT NULL,
  applicant_id uuid NOT NULL,
  
  -- Application details
  cover_note text,
  ai_match_score numeric,
  status text NOT NULL DEFAULT 'applied' CHECK (status IN (
    'applied',           -- Initial application
    'invited',           -- Employer invited candidate
    'accepted',          -- Candidate accepted invitation
    'reviewing',         -- Under review
    'shortlisted',       -- Shortlisted
    'interviewing',      -- In interview process
    'offered',           -- Job offer made
    'hired',             -- Successfully hired
    'rejected',          -- Rejected
    'withdrawn',         -- Candidate withdrew
    'expired'            -- Application expired
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
  UNIQUE(job_id, applicant_id) -- Prevent duplicate applications
);

-- Application events timeline (audit trail)
CREATE TABLE IF NOT EXISTS public.application_events (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  application_id uuid NOT NULL,
  event_type text NOT NULL CHECK (event_type IN (
    'applied', 'invited', 'accepted', 'rejected', 'shortlisted', 
    'interview_scheduled', 'interview_completed', 'offer_made', 
    'offer_accepted', 'offer_declined', 'hired', 'withdrawn'
  )),
  event_data jsonb,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT application_events_pkey PRIMARY KEY (id),
  CONSTRAINT application_events_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.job_applications(id) ON DELETE CASCADE,
  CONSTRAINT application_events_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);

-- =====================================================
-- 5. INTERVIEWS (SIMPLIFIED)
-- =====================================================

-- Interviews table (only for actual scheduled interviews)
CREATE TABLE IF NOT EXISTS public.interviews (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  application_id uuid NOT NULL,
  interview_type text NOT NULL CHECK (interview_type IN ('1st_interview', 'technical', 'hr_interview', 'final', 'phone_screen')),
  interview_format text NOT NULL CHECK (interview_format IN ('in_person', 'video', 'phone')),
  location text,
  interview_date timestamp with time zone NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 60,
  interviewer_id uuid NOT NULL,
  additional_interviewers uuid[],
  meeting_link text,
  agenda text,
  notes text,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'rescheduled')),
  feedback text,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  reminder_sent boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT interviews_pkey PRIMARY KEY (id),
  CONSTRAINT interviews_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.job_applications(id) ON DELETE CASCADE,
  CONSTRAINT interviews_interviewer_id_fkey FOREIGN KEY (interviewer_id) REFERENCES public.profiles(id)
);

-- =====================================================
-- 6. OFFERS & NEGOTIATIONS
-- =====================================================

-- Job offers table
CREATE TABLE IF NOT EXISTS public.job_offers (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  application_id uuid NOT NULL,
  offer_data jsonb NOT NULL, -- salary, benefits, start_date, etc.
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'withdrawn')),
  expires_at timestamp with time zone,
  notes text,
  created_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT job_offers_pkey PRIMARY KEY (id),
  CONSTRAINT job_offers_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.job_applications(id) ON DELETE CASCADE,
  CONSTRAINT job_offers_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);

-- =====================================================
-- 7. MESSAGING SYSTEM (SIMPLIFIED)
-- =====================================================

-- Conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  application_id uuid NOT NULL,
  title text,
  last_message_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT conversations_pkey PRIMARY KEY (id),
  CONSTRAINT conversations_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.job_applications(id) ON DELETE CASCADE
);

-- Conversation participants
CREATE TABLE IF NOT EXISTS public.conversation_participants (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  conversation_id uuid NOT NULL,
  user_id uuid NOT NULL,
  joined_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT conversation_participants_pkey PRIMARY KEY (id),
  CONSTRAINT conversation_participants_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT conversation_participants_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE,
  UNIQUE(conversation_id, user_id)
);

-- Messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  conversation_id uuid NOT NULL,
  sender_id uuid NOT NULL,
  content text NOT NULL,
  message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'system')),
  attachment_urls text[],
  read_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT messages_pkey PRIMARY KEY (id),
  CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE,
  CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id)
);

-- =====================================================
-- 8. DOCUMENTS & FILES
-- =====================================================

-- Documents table (for all user documents)
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

-- Resume data (parsed resume information)
CREATE TABLE IF NOT EXISTS public.resume_data (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  document_id uuid,
  parsed_data jsonb NOT NULL,
  education jsonb[],
  experience jsonb[],
  skills text[],
  certifications jsonb[],
  ai_analysis jsonb,
  is_primary boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT resume_data_pkey PRIMARY KEY (id),
  CONSTRAINT resume_data_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT resume_data_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE SET NULL
);

-- =====================================================
-- 9. AI & ANALYTICS
-- =====================================================

-- AI conversations
CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  conversation_type text NOT NULL,
  messages jsonb[],
  metadata jsonb,
  summary text,
  insights jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT ai_conversations_pkey PRIMARY KEY (id),
  CONSTRAINT ai_conversations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- =====================================================
-- 10. BILLING & TRANSACTIONS
-- =====================================================

-- Transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  job_id uuid NOT NULL,
  transaction_reference text NOT NULL,
  created_by uuid,
  type text NOT NULL DEFAULT 'Job Post',
  amount numeric NOT NULL,
  currency text DEFAULT 'EUR',
  gateway text NOT NULL DEFAULT 'Stripe',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  created_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT transactions_pkey PRIMARY KEY (id),
  CONSTRAINT transactions_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id),
  CONSTRAINT transactions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);

-- =====================================================
-- 11. INDEXES FOR PERFORMANCE
-- =====================================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS profiles_user_type_idx ON public.profiles(user_type);
CREATE INDEX IF NOT EXISTS profiles_onboarding_complete_idx ON public.profiles(onboarding_complete);

-- Job applications indexes
CREATE INDEX IF NOT EXISTS job_applications_job_id_idx ON public.job_applications(job_id);
CREATE INDEX IF NOT EXISTS job_applications_applicant_id_idx ON public.job_applications(applicant_id);
CREATE INDEX IF NOT EXISTS job_applications_status_idx ON public.job_applications(status);
CREATE INDEX IF NOT EXISTS job_applications_application_date_idx ON public.job_applications(application_date DESC);

-- Application events indexes
CREATE INDEX IF NOT EXISTS application_events_application_id_idx ON public.application_events(application_id);
CREATE INDEX IF NOT EXISTS application_events_event_type_idx ON public.application_events(event_type);
CREATE INDEX IF NOT EXISTS application_events_created_at_idx ON public.application_events(created_at DESC);

-- Interviews indexes
CREATE INDEX IF NOT EXISTS interviews_application_id_idx ON public.interviews(application_id);
CREATE INDEX IF NOT EXISTS interviews_interviewer_id_idx ON public.interviews(interviewer_id);
CREATE INDEX IF NOT EXISTS interviews_interview_date_idx ON public.interviews(interview_date);
CREATE INDEX IF NOT EXISTS interviews_status_idx ON public.interviews(status);

-- Jobs indexes
CREATE INDEX IF NOT EXISTS jobs_company_id_idx ON public.jobs(company_id);
CREATE INDEX IF NOT EXISTS jobs_status_idx ON public.jobs(status);
CREATE INDEX IF NOT EXISTS jobs_created_at_idx ON public.jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS jobs_location_idx ON public.jobs(location);
CREATE INDEX IF NOT EXISTS jobs_job_type_idx ON public.jobs(job_type);

-- Messages indexes
CREATE INDEX IF NOT EXISTS messages_conversation_id_idx ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS messages_sender_id_idx ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON public.messages(created_at DESC);

-- Documents indexes
CREATE INDEX IF NOT EXISTS documents_owner_id_idx ON public.documents(owner_id);
CREATE INDEX IF NOT EXISTS documents_document_type_idx ON public.documents(document_type);

-- =====================================================
-- 12. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_seeker_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Job applications policies
CREATE POLICY "Users can view their own applications" ON public.job_applications
  FOR SELECT USING (auth.uid() = applicant_id);

CREATE POLICY "Users can view applications for their jobs" ON public.job_applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.jobs 
      WHERE jobs.id = job_applications.job_id 
      AND jobs.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can create applications" ON public.job_applications
  FOR INSERT WITH CHECK (auth.uid() = applicant_id);

-- Interviews policies
CREATE POLICY "Users can view interviews they're involved in" ON public.interviews
  FOR SELECT USING (
    auth.uid() = interviewer_id OR
    EXISTS (
      SELECT 1 FROM public.job_applications 
      WHERE job_applications.id = interviews.application_id 
      AND job_applications.applicant_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.job_applications 
      JOIN public.jobs ON jobs.id = job_applications.job_id
      WHERE job_applications.id = interviews.application_id 
      AND jobs.created_by = auth.uid()
    )
  );

-- Documents policies
CREATE POLICY "Users can view their own documents" ON public.documents
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own documents" ON public.documents
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own documents" ON public.documents
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own documents" ON public.documents
  FOR DELETE USING (auth.uid() = owner_id);

-- =====================================================
-- 13. TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for all tables with updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_job_seeker_profiles_updated_at BEFORE UPDATE ON public.job_seeker_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employer_profiles_updated_at BEFORE UPDATE ON public.employer_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE ON public.team_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_job_applications_updated_at BEFORE UPDATE ON public.job_applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_interviews_updated_at BEFORE UPDATE ON public.interviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_job_offers_updated_at BEFORE UPDATE ON public.job_offers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_resume_data_updated_at BEFORE UPDATE ON public.resume_data FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_conversations_updated_at BEFORE UPDATE ON public.ai_conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 14. USEFUL VIEWS
-- =====================================================

-- View for application details with related data
CREATE OR REPLACE VIEW application_details AS
SELECT 
  ja.id,
  ja.job_id,
  ja.applicant_id,
  ja.status,
  ja.application_date,
  ja.ai_match_score,
  ja.employer_notes,
  ja.internal_rating,
  
  -- Job details
  j.title as job_title,
  j.location as job_location,
  j.job_type,
  j.experience_level,
  j.salary_range as job_salary_range,
  
  -- Company details
  c.name as company_name,
  c.logo_url as company_logo,
  c.industry as company_industry,
  
  -- Applicant details
  p.full_name as applicant_name,
  p.avatar_url as applicant_avatar,
  jsp.headline as applicant_headline,
  jsp.experience_years,
  jsp.current_location as applicant_location,
  
  -- Employer details
  ep.full_name as employer_name,
  ep.position as employer_position
  
FROM public.job_applications ja
JOIN public.jobs j ON ja.job_id = j.id
JOIN public.companies c ON j.company_id = c.id
JOIN public.profiles p ON ja.applicant_id = p.id
LEFT JOIN public.job_seeker_profiles jsp ON ja.applicant_id = jsp.id
LEFT JOIN public.profiles ep ON j.created_by = ep.id;

-- View for interview details
CREATE OR REPLACE VIEW interview_details AS
SELECT 
  i.id,
  i.application_id,
  i.interview_type,
  i.interview_format,
  i.location,
  i.interview_date,
  i.duration_minutes,
  i.status,
  i.meeting_link,
  i.agenda,
  i.notes,
  i.feedback,
  i.rating,
  
  -- Interviewer details
  interviewer.full_name as interviewer_name,
  interviewer.avatar_url as interviewer_avatar,
  
  -- Application details
  ad.job_title,
  ad.company_name,
  ad.applicant_name,
  ad.applicant_avatar
  
FROM public.interviews i
JOIN public.profiles interviewer ON i.interviewer_id = interviewer.id
JOIN application_details ad ON i.application_id = ad.id;

-- =====================================================
-- 15. SAMPLE DATA (OPTIONAL)
-- =====================================================

-- Insert default support tiers
INSERT INTO public.support_tiers (id, name, description, features, pricing_model, pricing_details) VALUES
(1, 'Basic', 'Basic job posting', '{"max_jobs": 5, "ai_matching": true}', 'monthly', '{"price": 29.99, "currency": "EUR"}'),
(2, 'Professional', 'Professional job posting', '{"max_jobs": 25, "ai_matching": true, "priority_support": true}', 'monthly', '{"price": 99.99, "currency": "EUR"}'),
(3, 'Enterprise', 'Enterprise solution', '{"max_jobs": -1, "ai_matching": true, "priority_support": true, "custom_features": true}', 'monthly', '{"price": 299.99, "currency": "EUR"}')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Grant necessary permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Comments for documentation
COMMENT ON TABLE public.job_applications IS 'Main applications table - single source of truth for all job applications';
COMMENT ON TABLE public.application_events IS 'Timeline of events for each application (audit trail)';
COMMENT ON TABLE public.interviews IS 'Scheduled interviews linked to applications';
COMMENT ON TABLE public.job_offers IS 'Job offers and negotiations';
COMMENT ON TABLE public.conversations IS 'Messaging between candidates and employers';
COMMENT ON TABLE public.documents IS 'User-uploaded documents (resumes, cover letters, etc.)';

COMMENT ON COLUMN public.job_applications.status IS 'Current status of the application: applied, invited, accepted, reviewing, shortlisted, interviewing, offered, hired, rejected, withdrawn, expired';
COMMENT ON COLUMN public.application_events.event_type IS 'Type of event: applied, invited, accepted, rejected, shortlisted, interview_scheduled, interview_completed, offer_made, offer_accepted, offer_declined, hired, withdrawn';
COMMENT ON COLUMN public.interviews.interview_type IS 'Type of interview: 1st_interview, technical, hr_interview, final, phone_screen';
COMMENT ON COLUMN public.interviews.interview_format IS 'Format of interview: in_person, video, phone';


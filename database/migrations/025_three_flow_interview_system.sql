-- Three-flow interview system:
-- 1. Direct interview scheduling (no application needed)
-- 2. Employer invitation → Candidate acceptance → Interview
-- 3. Normal application → Interview

-- First, create an interview invitations table for flow #2
CREATE TABLE IF NOT EXISTS public.interview_invitations (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    job_id uuid NOT NULL,
    candidate_id uuid NOT NULL,
    employer_id uuid NOT NULL,
    interview_type text NOT NULL DEFAULT '1st_interview',
    interview_format text NOT NULL DEFAULT 'video',
    proposed_date timestamp with time zone,
    duration_minutes integer NOT NULL DEFAULT 60,
    location text,
    message text,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone DEFAULT (now() + interval '7 days'),
    
    CONSTRAINT interview_invitations_pkey PRIMARY KEY (id),
    CONSTRAINT interview_invitations_job_id_fkey FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    CONSTRAINT interview_invitations_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES profiles(id) ON DELETE CASCADE,
    CONSTRAINT interview_invitations_employer_id_fkey FOREIGN KEY (employer_id) REFERENCES profiles(id) ON DELETE CASCADE,
    CONSTRAINT interview_invitations_interview_format_check CHECK (interview_format IN ('in_person', 'video', 'phone')),
    CONSTRAINT interview_invitations_interview_type_check CHECK (interview_type IN ('1st_interview', 'technical', 'hr_interview', 'final', 'phone_screen'))
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS interview_invitations_candidate_id_idx ON public.interview_invitations (candidate_id);
CREATE INDEX IF NOT EXISTS interview_invitations_employer_id_idx ON public.interview_invitations (employer_id);
CREATE INDEX IF NOT EXISTS interview_invitations_job_id_idx ON public.interview_invitations (job_id);
CREATE INDEX IF NOT EXISTS interview_invitations_status_idx ON public.interview_invitations (status);

-- Add invitation_id to interviews_v2 to link invitations to scheduled interviews
ALTER TABLE public.interviews_v2 
ADD COLUMN invitation_id uuid REFERENCES public.interview_invitations(id) ON DELETE SET NULL;

-- Update the constraint to support all three flows
ALTER TABLE public.interviews_v2 
DROP CONSTRAINT IF EXISTS interviews_v2_has_candidate_check;

ALTER TABLE public.interviews_v2 
ADD CONSTRAINT interviews_v2_candidate_source_check 
CHECK (
    -- Flow 1: Direct scheduling (seeker_id only)
    (seeker_id IS NOT NULL AND application_id IS NULL AND invitation_id IS NULL)
    OR
    -- Flow 2: Invitation-based (invitation_id + seeker_id)
    (invitation_id IS NOT NULL AND seeker_id IS NOT NULL)
    OR
    -- Flow 3: Application-based (application_id + seeker_id)
    (application_id IS NOT NULL AND seeker_id IS NOT NULL)
);

-- Enable RLS on interview_invitations
ALTER TABLE public.interview_invitations ENABLE ROW LEVEL SECURITY;

-- RLS policies for interview_invitations
CREATE POLICY "Employers can manage their invitations" ON public.interview_invitations
    FOR ALL
    TO authenticated
    USING (
        employer_id = auth.uid()
        OR candidate_id = auth.uid()
    );

-- Add comment explaining the three flows
COMMENT ON TABLE public.interview_invitations IS 
'Interview invitations table for flow #2: Employer invites candidate → Candidate accepts → Interview scheduled';

COMMENT ON TABLE public.interviews_v2 IS 
'Three-flow interview system: 1) Direct scheduling (seeker_id only), 2) Invitation-based (invitation_id + seeker_id), 3) Application-based (application_id + seeker_id)';

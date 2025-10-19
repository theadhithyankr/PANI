-- Fix RLS policies for interviews_v2 table
-- This migration adds proper RLS policies to allow employers to create interviews

-- Enable RLS on interviews_v2 table if not already enabled
ALTER TABLE public.interviews_v2 ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Employers can view their company interviews" ON public.interviews_v2;
DROP POLICY IF EXISTS "Employers can create interviews for their company" ON public.interviews_v2;
DROP POLICY IF EXISTS "Employers can update their company interviews" ON public.interviews_v2;
DROP POLICY IF EXISTS "Candidates can view their interviews" ON public.interviews_v2;
DROP POLICY IF EXISTS "Candidates can update their interviews" ON public.interviews_v2;

-- Create policy for employers to view interviews for their company's jobs
CREATE POLICY "Employers can view their company interviews" ON public.interviews_v2
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM jobs
            WHERE jobs.id = interviews_v2.job_id
            AND jobs.company_id IN (
                SELECT company_id FROM employer_profiles
                WHERE employer_profiles.id = auth.uid()
            )
        )
    );

-- Create policy for employers to create interviews for their company's jobs
CREATE POLICY "Employers can create interviews for their company" ON public.interviews_v2
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM jobs
            WHERE jobs.id = interviews_v2.job_id
            AND jobs.company_id IN (
                SELECT company_id FROM employer_profiles
                WHERE employer_profiles.id = auth.uid()
            )
        )
        AND interviewer_id = auth.uid()
    );

-- Create policy for employers to update interviews for their company's jobs
CREATE POLICY "Employers can update their company interviews" ON public.interviews_v2
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM jobs
            WHERE jobs.id = interviews_v2.job_id
            AND jobs.company_id IN (
                SELECT company_id FROM employer_profiles
                WHERE employer_profiles.id = auth.uid()
            )
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM jobs
            WHERE jobs.id = interviews_v2.job_id
            AND jobs.company_id IN (
                SELECT company_id FROM employer_profiles
                WHERE employer_profiles.id = auth.uid()
            )
        )
    );

-- Create policy for candidates to view their interviews
CREATE POLICY "Candidates can view their interviews" ON public.interviews_v2
    FOR SELECT
    TO authenticated
    USING (
        seeker_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM job_applications_v2
            WHERE job_applications_v2.id = interviews_v2.application_id
            AND job_applications_v2.applicant_id = auth.uid()
        )
    );

-- Create policy for candidates to update their interviews (for status updates, etc.)
CREATE POLICY "Candidates can update their interviews" ON public.interviews_v2
    FOR UPDATE
    TO authenticated
    USING (
        seeker_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM job_applications_v2
            WHERE job_applications_v2.id = interviews_v2.application_id
            AND job_applications_v2.applicant_id = auth.uid()
        )
    );

-- Create policy for deleting interviews (only employers can delete)
CREATE POLICY "Employers can delete their company interviews" ON public.interviews_v2
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM jobs
            WHERE jobs.id = interviews_v2.job_id
            AND jobs.company_id IN (
                SELECT company_id FROM employer_profiles
                WHERE employer_profiles.id = auth.uid()
            )
        )
    );

-- Also ensure job_applications_v2 has proper RLS policies
ALTER TABLE public.job_applications_v2 ENABLE ROW LEVEL SECURITY;

-- Drop existing policies for job_applications_v2 if they exist
DROP POLICY IF EXISTS "Employers can view applications for their jobs" ON public.job_applications_v2;
DROP POLICY IF EXISTS "Employers can create applications for their jobs" ON public.job_applications_v2;
DROP POLICY IF EXISTS "Employers can update applications for their jobs" ON public.job_applications_v2;
DROP POLICY IF EXISTS "Candidates can view their applications" ON public.job_applications_v2;
DROP POLICY IF EXISTS "Candidates can create applications" ON public.job_applications_v2;
DROP POLICY IF EXISTS "Candidates can update their applications" ON public.job_applications_v2;

-- Create policies for job_applications_v2
CREATE POLICY "Employers can view applications for their jobs" ON public.job_applications_v2
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM jobs
            WHERE jobs.id = job_applications_v2.job_id
            AND jobs.company_id IN (
                SELECT company_id FROM employer_profiles
                WHERE employer_profiles.id = auth.uid()
            )
        )
    );

CREATE POLICY "Employers can create applications for their jobs" ON public.job_applications_v2
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM jobs
            WHERE jobs.id = job_applications_v2.job_id
            AND jobs.company_id IN (
                SELECT company_id FROM employer_profiles
                WHERE employer_profiles.id = auth.uid()
            )
        )
    );

CREATE POLICY "Employers can update applications for their jobs" ON public.job_applications_v2
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM jobs
            WHERE jobs.id = job_applications_v2.job_id
            AND jobs.company_id IN (
                SELECT company_id FROM employer_profiles
                WHERE employer_profiles.id = auth.uid()
            )
        )
    );

CREATE POLICY "Candidates can view their applications" ON public.job_applications_v2
    FOR SELECT
    TO authenticated
    USING (applicant_id = auth.uid());

CREATE POLICY "Candidates can create applications" ON public.job_applications_v2
    FOR INSERT
    TO authenticated
    WITH CHECK (applicant_id = auth.uid());

CREATE POLICY "Candidates can update their applications" ON public.job_applications_v2
    FOR UPDATE
    TO authenticated
    USING (applicant_id = auth.uid());

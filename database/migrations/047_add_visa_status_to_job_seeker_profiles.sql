-- Add visa_status column to job_seeker_profiles table
-- This column is referenced in the application code but was missing from the schema

-- Add the visa_status column to job_seeker_profiles
ALTER TABLE public.job_seeker_profiles 
ADD COLUMN IF NOT EXISTS visa_status text;

-- Add a comment to document the column
COMMENT ON COLUMN public.job_seeker_profiles.visa_status IS 'Visa status of the job seeker (e.g., citizen, permanent_resident, work_visa, student_visa, etc.)';

-- Update the updated_at timestamp for any existing records
UPDATE public.job_seeker_profiles 
SET updated_at = now() 
WHERE visa_status IS NULL;
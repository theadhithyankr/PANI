-- Add onboarding_complete column to job_seeker_profiles table
ALTER TABLE public.job_seeker_profiles 
ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT FALSE;

-- Add onboarding_step column to job_seeker_profiles table
ALTER TABLE public.job_seeker_profiles 
ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 1;

-- Update existing profiles to have onboarding_complete set to true and onboarding_step set to 4
UPDATE public.job_seeker_profiles
SET onboarding_complete = TRUE, onboarding_step = 4
WHERE id IS NOT NULL;
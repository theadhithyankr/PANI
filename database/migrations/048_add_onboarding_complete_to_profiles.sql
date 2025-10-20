-- Add missing onboarding_complete column to profiles table
-- This column is referenced in the AuthContext but was missing from the current schema

-- Add the onboarding_complete column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT FALSE;

-- Add a comment to document the column
COMMENT ON COLUMN public.profiles.onboarding_complete IS 'Indicates whether the user has completed the onboarding process';

-- Update existing profiles to have onboarding_complete set to false by default
UPDATE public.profiles 
SET onboarding_complete = FALSE 
WHERE onboarding_complete IS NULL;

-- Verification query to check the column was added
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'onboarding_complete'
    ) THEN
        RAISE NOTICE 'SUCCESS: onboarding_complete column added to profiles table';
    ELSE
        RAISE EXCEPTION 'FAILED: onboarding_complete column was not added to profiles table';
    END IF;
END $$;
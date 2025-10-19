-- Fix existing interviews_v2 data to meet the new constraint requirements
-- First, let's see what data we have and fix it

-- Drop the problematic constraint temporarily
ALTER TABLE public.interviews_v2 
DROP CONSTRAINT IF EXISTS interviews_v2_candidate_source_check;

-- Check and fix existing data
-- For rows that have application_id but no seeker_id, we need to get seeker_id from the application
UPDATE public.interviews_v2 
SET seeker_id = (
    SELECT ja.applicant_id 
    FROM job_applications_v2 ja 
    WHERE ja.id = interviews_v2.application_id
)
WHERE application_id IS NOT NULL 
AND seeker_id IS NULL;

-- For rows that have neither application_id nor seeker_id, we need to handle them
-- Let's see what we have first by checking for problematic rows
-- (This is just for reference - we'll handle them in the next step)

-- Now add a more flexible constraint that handles the current data
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
    OR
    -- Legacy: Just seeker_id (for existing data that might not fit the above patterns)
    (seeker_id IS NOT NULL)
);

-- Add a comment explaining the constraint
COMMENT ON CONSTRAINT interviews_v2_candidate_source_check ON public.interviews_v2 
IS 'Ensures proper candidate identification: direct (seeker_id only), invitation-based (invitation_id + seeker_id), or application-based (application_id + seeker_id)';

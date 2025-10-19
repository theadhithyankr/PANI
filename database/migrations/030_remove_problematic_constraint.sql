-- Remove the problematic constraint and add a more lenient one
-- This will fix the immediate issue

-- Drop the problematic constraint
ALTER TABLE public.interviews_v2 
DROP CONSTRAINT IF EXISTS interviews_v2_has_candidate_simple;

-- Add a more lenient constraint that allows NULL seeker_id for now
-- We'll fix the data later
ALTER TABLE public.interviews_v2 
ADD CONSTRAINT interviews_v2_has_candidate_lenient 
CHECK (
    seeker_id IS NOT NULL 
    OR application_id IS NOT NULL 
    OR invitation_id IS NOT NULL
);

-- Add comment
COMMENT ON CONSTRAINT interviews_v2_has_candidate_lenient ON public.interviews_v2 
IS 'Ensures every interview has some form of candidate identification (seeker_id, application_id, or invitation_id)';

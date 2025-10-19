-- Simple fix for interviews_v2 constraint
-- Drop the problematic constraint and add a simpler one

-- Drop the problematic constraint
ALTER TABLE public.interviews_v2 
DROP CONSTRAINT IF EXISTS interviews_v2_candidate_source_check;

-- Add a simple constraint that just ensures we have a candidate
ALTER TABLE public.interviews_v2 
ADD CONSTRAINT interviews_v2_has_candidate_simple 
CHECK (seeker_id IS NOT NULL);

-- Add comment
COMMENT ON CONSTRAINT interviews_v2_has_candidate_simple ON public.interviews_v2 
IS 'Ensures every interview has a candidate (seeker_id). Application_id and invitation_id are optional.';

-- Remove the problematic constraint completely
-- This will allow the system to work while we fix the data

-- Drop all problematic constraints
ALTER TABLE public.interviews_v2 
DROP CONSTRAINT IF EXISTS interviews_v2_has_candidate_simple;

ALTER TABLE public.interviews_v2 
DROP CONSTRAINT IF EXISTS interviews_v2_has_candidate_lenient;

ALTER TABLE public.interviews_v2 
DROP CONSTRAINT IF EXISTS interviews_v2_candidate_source_check;

-- The table will now work without constraints
-- We can add proper constraints later after cleaning up the data

-- Improve direct interview scheduling by making application_id truly optional
-- and adding better constraints for data integrity

-- Make application_id nullable (if not already done)
ALTER TABLE public.interviews_v2 
ALTER COLUMN application_id DROP NOT NULL;

-- Add a check constraint to ensure we have either application_id OR seeker_id
-- This allows both flows: application-based and direct interviews
ALTER TABLE public.interviews_v2 
ADD CONSTRAINT interviews_v2_has_candidate_check 
CHECK (
    (application_id IS NOT NULL) OR (seeker_id IS NOT NULL)
);

-- Add an index for better performance on seeker_id lookups
CREATE INDEX IF NOT EXISTS interviews_v2_seeker_id_idx 
ON public.interviews_v2 (seeker_id);

-- Add a comment to document the two interview types
COMMENT ON TABLE public.interviews_v2 IS 
'Supports two interview types: 1) Application-linked (application_id + seeker_id), 2) Direct invitations (seeker_id only)';

-- Update the existing constraint comment
COMMENT ON CONSTRAINT interviews_v2_has_candidate_check ON public.interviews_v2 
IS 'Ensures either application_id (for application-linked interviews) or seeker_id (for direct invitations) is provided';

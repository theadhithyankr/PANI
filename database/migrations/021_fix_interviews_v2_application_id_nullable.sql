-- Fix interviews_v2 table to allow NULL application_id for direct interviews
-- This migration makes application_id nullable since direct interviews don't require an application

-- First, drop the NOT NULL constraint on application_id
ALTER TABLE public.interviews_v2 
ALTER COLUMN application_id DROP NOT NULL;

-- Add a check constraint to ensure that either application_id OR seeker_id is provided
-- This ensures data integrity while allowing direct interviews
ALTER TABLE public.interviews_v2 
ADD CONSTRAINT interviews_v2_application_or_seeker_check 
CHECK (
    (application_id IS NOT NULL) OR (seeker_id IS NOT NULL)
);

-- Add a comment to explain the constraint
COMMENT ON CONSTRAINT interviews_v2_application_or_seeker_check ON public.interviews_v2 
IS 'Either application_id (for application-linked interviews) or seeker_id (for direct interviews) must be provided';

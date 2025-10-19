-- Clean up existing interviews_v2 data to ensure it meets requirements

-- First, let's see what data we have
-- This query will show us any problematic rows
SELECT 
    id,
    application_id,
    seeker_id,
    invitation_id,
    job_id,
    interviewer_id,
    created_at
FROM public.interviews_v2 
WHERE seeker_id IS NULL;

-- Fix rows that have application_id but no seeker_id
UPDATE public.interviews_v2 
SET seeker_id = (
    SELECT ja.applicant_id 
    FROM job_applications_v2 ja 
    WHERE ja.id = interviews_v2.application_id
    LIMIT 1
)
WHERE application_id IS NOT NULL 
AND seeker_id IS NULL;

-- For any remaining rows without seeker_id, we need to either:
-- 1. Delete them if they're invalid, or
-- 2. Set a default seeker_id if we can determine it

-- Let's check if there are any remaining problematic rows
SELECT 
    id,
    application_id,
    seeker_id,
    invitation_id,
    job_id,
    interviewer_id,
    created_at
FROM public.interviews_v2 
WHERE seeker_id IS NULL;

-- If there are still problematic rows, we might need to delete them
-- (Uncomment the next line if needed)
-- DELETE FROM public.interviews_v2 WHERE seeker_id IS NULL;

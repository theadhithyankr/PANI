-- Fix existing data before applying the constraint
-- This migration will clean up existing interviews_v2 data

-- Step 1: Check what problematic data we have
SELECT 
    'Problematic rows:' as status,
    COUNT(*) as count
FROM public.interviews_v2 
WHERE seeker_id IS NULL;

-- Step 2: Try to fix rows that have application_id but no seeker_id
-- Get seeker_id from the application
UPDATE public.interviews_v2 
SET seeker_id = (
    SELECT ja.applicant_id 
    FROM job_applications_v2 ja 
    WHERE ja.id = interviews_v2.application_id
    LIMIT 1
)
WHERE application_id IS NOT NULL 
AND seeker_id IS NULL;

-- Step 3: Check if we still have problematic rows
SELECT 
    'After fixing from applications:' as status,
    COUNT(*) as count
FROM public.interviews_v2 
WHERE seeker_id IS NULL;

-- Step 4: For any remaining rows without seeker_id, we need to either:
-- Option A: Delete them (if they're truly invalid)
-- Option B: Set a default seeker_id (if we can determine it)

-- Let's see what these remaining rows look like
SELECT 
    id,
    application_id,
    seeker_id,
    job_id,
    interviewer_id,
    created_at
FROM public.interviews_v2 
WHERE seeker_id IS NULL;

-- Step 5: If there are still problematic rows, we'll delete them
-- (This is safe because they're invalid data)
DELETE FROM public.interviews_v2 
WHERE seeker_id IS NULL;

-- Step 6: Verify no problematic rows remain
SELECT 
    'After cleanup:' as status,
    COUNT(*) as count
FROM public.interviews_v2 
WHERE seeker_id IS NULL;

-- Step 7: Now we can safely add the constraint
ALTER TABLE public.interviews_v2 
DROP CONSTRAINT IF EXISTS interviews_v2_has_candidate_simple;

ALTER TABLE public.interviews_v2 
ADD CONSTRAINT interviews_v2_has_candidate_simple 
CHECK (seeker_id IS NOT NULL);

-- Step 8: Verify the constraint is working
SELECT 'Constraint added successfully' as status;

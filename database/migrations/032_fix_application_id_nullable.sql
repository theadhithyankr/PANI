-- Fix application_id to be nullable for direct interviews
-- This allows direct interview scheduling without requiring an application

-- Remove the NOT NULL constraint from application_id
ALTER TABLE public.interviews_v2 
ALTER COLUMN application_id DROP NOT NULL;

-- Add a comment explaining the change
COMMENT ON COLUMN public.interviews_v2.application_id IS 
'Optional: Only required for application-based interviews. NULL for direct interviews.';

-- Verify the change
SELECT 
    column_name, 
    is_nullable, 
    data_type 
FROM information_schema.columns 
WHERE table_name = 'interviews_v2' 
AND column_name = 'application_id';

-- =====================================================
-- MIGRATION: Add Unique Constraint to Prevent Duplicate Conversations
-- =====================================================
-- This script adds a unique constraint to prevent multiple conversations
-- for the same job application

-- =====================================================
-- 1. ADD UNIQUE CONSTRAINT TO CONVERSATIONS_V2
-- =====================================================

-- Add unique constraint on application_id to prevent duplicate conversations
ALTER TABLE public.conversations_v2 
ADD CONSTRAINT conversations_v2_application_id_unique 
UNIQUE (application_id);

-- =====================================================
-- 2. CLEAN UP EXISTING DUPLICATE CONVERSATIONS
-- =====================================================

-- First, let's see if there are any duplicates
WITH duplicate_conversations AS (
  SELECT 
    application_id,
    COUNT(*) as conversation_count,
    MIN(created_at) as first_created,
    ARRAY_AGG(id ORDER BY created_at) as conversation_ids
  FROM public.conversations_v2
  GROUP BY application_id
  HAVING COUNT(*) > 1
)
SELECT 
  'Duplicate conversations found' as status,
  COUNT(*) as duplicate_application_count
FROM duplicate_conversations;

-- Keep the first conversation for each application and delete the rest
WITH duplicate_conversations AS (
  SELECT 
    application_id,
    id,
    ROW_NUMBER() OVER (PARTITION BY application_id ORDER BY created_at) as rn
  FROM public.conversations_v2
),
conversations_to_delete AS (
  SELECT id
  FROM duplicate_conversations
  WHERE rn > 1
)
DELETE FROM public.conversations_v2
WHERE id IN (SELECT id FROM conversations_to_delete);

-- =====================================================
-- 3. VERIFY THE CLEANUP
-- =====================================================

-- Check that there are no more duplicates
WITH duplicate_check AS (
  SELECT 
    application_id,
    COUNT(*) as conversation_count
  FROM public.conversations_v2
  GROUP BY application_id
  HAVING COUNT(*) > 1
)
SELECT 
  'Remaining duplicates' as status,
  COUNT(*) as count
FROM duplicate_check;

-- =====================================================
-- 4. ADD COMMENTS
-- =====================================================

COMMENT ON CONSTRAINT conversations_v2_application_id_unique ON public.conversations_v2 
IS 'Ensures only one conversation per job application to prevent duplicate message threads';

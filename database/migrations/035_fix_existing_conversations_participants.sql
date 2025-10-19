-- =====================================================
-- MIGRATION: Fix Existing Conversations Participants
-- =====================================================
-- This script adds missing participants to existing conversations
-- that were created without populating conversation_participants table

-- =====================================================
-- 1. ADD MISSING PARTICIPANTS TO EXISTING CONVERSATIONS
-- =====================================================

-- Insert participants for conversations that don't have them
INSERT INTO public.conversation_participants (conversation_id, user_id, joined_at, created_at, updated_at)
SELECT DISTINCT
  c.id as conversation_id,
  ja.applicant_id as user_id,
  c.created_at as joined_at,
  NOW() as created_at,
  NOW() as updated_at
FROM public.conversations_v2 c
JOIN public.job_applications_v2 ja ON c.application_id = ja.id
LEFT JOIN public.conversation_participants cp ON c.id = cp.conversation_id AND ja.applicant_id = cp.user_id
WHERE cp.conversation_id IS NULL
ON CONFLICT (conversation_id, user_id) DO NOTHING;

-- Insert employer participants for conversations that don't have them
-- We need to get the employer from the job
INSERT INTO public.conversation_participants (conversation_id, user_id, joined_at, created_at, updated_at)
SELECT DISTINCT
  c.id as conversation_id,
  j.employer_id as user_id,
  c.created_at as joined_at,
  NOW() as created_at,
  NOW() as updated_at
FROM public.conversations_v2 c
JOIN public.job_applications_v2 ja ON c.application_id = ja.id
JOIN public.jobs j ON ja.job_id = j.id
LEFT JOIN public.conversation_participants cp ON c.id = cp.conversation_id AND j.employer_id = cp.user_id
WHERE cp.conversation_id IS NULL
  AND j.employer_id IS NOT NULL
ON CONFLICT (conversation_id, user_id) DO NOTHING;

-- =====================================================
-- 2. VERIFY THE FIX
-- =====================================================

-- Check how many conversations now have participants
SELECT 
  'Conversations with participants' as check_type,
  COUNT(DISTINCT c.id) as conversation_count,
  COUNT(cp.id) as participant_count
FROM public.conversations_v2 c
LEFT JOIN public.conversation_participants cp ON c.id = cp.conversation_id
GROUP BY c.id
HAVING COUNT(cp.id) > 0;

-- Check for conversations without participants (should be 0 after fix)
SELECT 
  'Conversations without participants' as check_type,
  COUNT(*) as count
FROM public.conversations_v2 c
LEFT JOIN public.conversation_participants cp ON c.id = cp.conversation_id
WHERE cp.conversation_id IS NULL;

-- =====================================================
-- 3. ADD COMMENTS
-- =====================================================

COMMENT ON TABLE public.conversation_participants IS 'Links users to conversations they participate in - now properly populated for all existing conversations';

-- =====================================================
-- CLEANUP: Remove Unused and Old Tables
-- =====================================================
-- This script removes tables that are no longer needed after the v2 migration

-- WARNING: This will permanently delete data from these tables
-- Make sure you have backups if needed

-- 1. Remove backup tables (created during migration)
DROP TABLE IF EXISTS public.backup_candidate_invitations CASCADE;
DROP TABLE IF EXISTS public.backup_conversations CASCADE;
DROP TABLE IF EXISTS public.backup_interviews CASCADE;
DROP TABLE IF EXISTS public.backup_job_applications CASCADE;
DROP TABLE IF EXISTS public.backup_messages CASCADE;

-- 2. Remove old tables replaced by v2 versions
DROP TABLE IF EXISTS public.candidate_invitations CASCADE;

-- 3. Remove unused tables (not referenced in frontend code)
DROP TABLE IF EXISTS public.ai_conversations CASCADE;

-- 4. Remove potentially unused tables (verify before running)
-- Uncomment these if you're sure they're not needed:

-- DROP TABLE IF EXISTS public.candidate_documents CASCADE;
-- DROP TABLE IF EXISTS public.interview_notifications CASCADE;
-- DROP TABLE IF EXISTS public.application_events CASCADE;

-- 5. Clean up any remaining views that might reference old tables
DROP VIEW IF EXISTS public.job_applications CASCADE;
DROP VIEW IF EXISTS public.interviews CASCADE;
DROP VIEW IF EXISTS public.conversations CASCADE;
DROP VIEW IF EXISTS public.messages CASCADE;

-- 6. Verify cleanup
SELECT 
    'Cleanup completed successfully' as status,
    COUNT(*) as remaining_tables
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN (
        'backup_candidate_invitations',
        'backup_conversations', 
        'backup_interviews',
        'backup_job_applications',
        'backup_messages',
        'candidate_invitations',
        'ai_conversations'
    );









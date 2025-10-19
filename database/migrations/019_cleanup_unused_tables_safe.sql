-- =====================================================
-- CLEANUP: Remove Safe Unused Tables (Conservative)
-- =====================================================
-- This script removes only the tables that are definitely safe to remove

-- 1. Remove backup tables (created during migration - definitely safe)
DROP TABLE IF EXISTS public.backup_candidate_invitations CASCADE;
DROP TABLE IF EXISTS public.backup_conversations CASCADE;
DROP TABLE IF EXISTS public.backup_interviews CASCADE;
DROP TABLE IF EXISTS public.backup_job_applications CASCADE;
DROP TABLE IF EXISTS public.backup_messages CASCADE;

-- 2. Remove old candidate_invitations table (replaced by job_applications_v2)
DROP TABLE IF EXISTS public.candidate_invitations CASCADE;

-- 3. Remove unused ai_conversations table (not used in frontend)
DROP TABLE IF EXISTS public.ai_conversations CASCADE;

-- 4. Clean up any remaining views that might reference old tables
DROP VIEW IF EXISTS public.job_applications CASCADE;
DROP VIEW IF EXISTS public.interviews CASCADE;
DROP VIEW IF EXISTS public.conversations CASCADE;
DROP VIEW IF EXISTS public.messages CASCADE;

-- 5. Verify cleanup
SELECT 
    'Safe cleanup completed successfully' as status,
    COUNT(*) as remaining_old_tables
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









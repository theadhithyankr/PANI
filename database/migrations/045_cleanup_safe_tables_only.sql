-- =====================================================
-- SAFE CLEANUP: Remove Only Definitely Unused Tables
-- =====================================================
-- This script removes only the tables that are definitely safe to remove
-- More conservative approach - only removes tables we're 100% sure are unused

-- Step 1: Remove old messages_v2 table (replaced by messages_v3)
-- This is safe since you're now using messages_v3
DROP TABLE IF EXISTS public.messages_v2 CASCADE;

-- Step 2: Remove backup tables (created during migration - definitely safe)
DROP TABLE IF EXISTS public.backup_candidate_invitations CASCADE;
DROP TABLE IF EXISTS public.backup_conversations CASCADE;
DROP TABLE IF EXISTS public.backup_interviews CASCADE;
DROP TABLE IF EXISTS public.backup_job_applications CASCADE;
DROP TABLE IF EXISTS public.backup_messages CASCADE;

-- Step 3: Remove old candidate_invitations table (replaced by job_applications_v2)
DROP TABLE IF EXISTS public.candidate_invitations CASCADE;

-- Step 4: Remove unused ai_conversations table (not used in frontend)
DROP TABLE IF EXISTS public.ai_conversations CASCADE;

-- Step 5: Clean up any remaining views that might reference old tables
DROP VIEW IF EXISTS public.job_applications CASCADE;
DROP VIEW IF EXISTS public.interviews CASCADE;
DROP VIEW IF EXISTS public.conversations CASCADE;
DROP VIEW IF EXISTS public.messages CASCADE;

-- Step 6: Verify cleanup
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
        'ai_conversations',
        'messages_v2'
    );

-- Step 7: Show remaining tables for verification
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Step 8: Show current messages_v3 status
SELECT 
    'messages_v3 status' as info,
    COUNT(*) as total_conversations,
    COUNT(CASE WHEN jsonb_array_length(messages) > 0 THEN 1 END) as conversations_with_messages,
    SUM(jsonb_array_length(messages)) as total_messages
FROM public.messages_v3;








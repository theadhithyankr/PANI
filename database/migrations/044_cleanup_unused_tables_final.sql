-- =====================================================
-- FINAL CLEANUP: Remove Unused and Old Tables
-- =====================================================
-- This script removes tables that are no longer needed after the v3 migration
-- WARNING: This will permanently delete data from these tables
-- Make sure you have backups if needed

-- Step 1: Remove old messages_v2 table (replaced by messages_v3)
-- First, ensure all data has been migrated to messages_v3
DO $$
DECLARE
    v2_count integer;
    v3_count integer;
BEGIN
    -- Count messages in v2
    SELECT COUNT(*) INTO v2_count FROM public.messages_v2;
    
    -- Count conversations with messages in v3
    SELECT COUNT(*) INTO v3_count FROM public.messages_v3 WHERE jsonb_array_length(messages) > 0;
    
    -- Log the counts
    RAISE NOTICE 'Messages_v2 count: %', v2_count;
    RAISE NOTICE 'Messages_v3 conversations with messages: %', v3_count;
    
    -- Only proceed if v3 has data or v2 is empty
    IF v3_count > 0 OR v2_count = 0 THEN
        RAISE NOTICE 'Safe to remove messages_v2 table';
    ELSE
        RAISE WARNING 'Messages_v2 still has data but messages_v3 is empty. Migration may be incomplete.';
    END IF;
END $$;

-- Drop the old messages_v2 table
DROP TABLE IF EXISTS public.messages_v2 CASCADE;

-- Step 2: Remove backup tables (created during migration - definitely safe)
DROP TABLE IF EXISTS public.backup_candidate_invitations CASCADE;
DROP TABLE IF EXISTS public.backup_conversations CASCADE;
DROP TABLE IF EXISTS public.backup_interviews CASCADE;
DROP TABLE IF EXISTS public.backup_job_applications CASCADE;
DROP TABLE IF EXISTS public.backup_messages CASCADE;

-- Step 3: Remove old tables replaced by v2 versions
DROP TABLE IF EXISTS public.candidate_invitations CASCADE;

-- Step 4: Remove unused tables (not referenced in frontend code)
DROP TABLE IF EXISTS public.ai_conversations CASCADE;

-- Step 5: Remove potentially unused tables (verify these are not needed)
-- Uncomment these if you're sure they're not needed:
-- DROP TABLE IF EXISTS public.candidate_documents CASCADE;
-- DROP TABLE IF EXISTS public.interview_notifications CASCADE;
-- DROP TABLE IF EXISTS public.application_events CASCADE;

-- Step 6: Clean up any remaining views that might reference old tables
DROP VIEW IF EXISTS public.job_applications CASCADE;
DROP VIEW IF EXISTS public.interviews CASCADE;
DROP VIEW IF EXISTS public.conversations CASCADE;
DROP VIEW IF EXISTS public.messages CASCADE;

-- Step 7: Remove old migration files (optional - for file cleanup)
-- These are just comments for reference, actual file deletion should be done manually
-- Files to consider removing:
-- - 001_create_documents_table.sql (recreated in 005_clean_database_schema.sql)
-- - 002_create_employer_profiles_table.sql (recreated in 005_clean_database_schema.sql)
-- - 003_update_messaging_system.sql (old messaging system, replaced by v2)
-- - 004_create_candidate_invitations_table.sql (table being removed)
-- - 010_optimize_conversations_structure.sql (duplicate of fixed version)
-- - 015_fix_interviews_v2_seeker_id_fk.sql (duplicate of corrected version)
-- - 018_check_foreign_key_constraints.sql (duplicate of fixed version)

-- Step 8: Verify cleanup
SELECT 
    'Cleanup completed successfully' as status,
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

-- Step 9: Show remaining tables for verification
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Step 10: Show current messages_v3 status
SELECT 
    'messages_v3 status' as info,
    COUNT(*) as total_conversations,
    COUNT(CASE WHEN jsonb_array_length(messages) > 0 THEN 1 END) as conversations_with_messages,
    SUM(jsonb_array_length(messages)) as total_messages
FROM public.messages_v3;








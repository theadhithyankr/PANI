-- NUCLEAR OPTION: Complete Database Schema Cleanup
-- WARNING: This will delete EVERYTHING in your public schema
-- Run this in Supabase SQL Editor with EXTREME CAUTION

-- First, disable all RLS policies to avoid conflicts
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Disable RLS on all tables
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'ALTER TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' DISABLE ROW LEVEL SECURITY';
    END LOOP;
END $$;

-- Drop all views first (they depend on tables)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT viewname FROM pg_views WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP VIEW IF EXISTS public.' || quote_ident(r.viewname) || ' CASCADE';
    END LOOP;
END $$;

-- Drop all materialized views
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT matviewname FROM pg_matviews WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP MATERIALIZED VIEW IF EXISTS public.' || quote_ident(r.matviewname) || ' CASCADE';
    END LOOP;
END $$;

-- Drop all functions and procedures
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT routine_name, routine_type 
        FROM information_schema.routines 
        WHERE routine_schema = 'public'
    ) LOOP
        IF r.routine_type = 'FUNCTION' THEN
            EXECUTE 'DROP FUNCTION IF EXISTS public.' || quote_ident(r.routine_name) || ' CASCADE';
        ELSIF r.routine_type = 'PROCEDURE' THEN
            EXECUTE 'DROP PROCEDURE IF EXISTS public.' || quote_ident(r.routine_name) || ' CASCADE';
        END IF;
    END LOOP;
END $$;

-- Drop all triggers
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT trigger_name, event_object_table 
        FROM information_schema.triggers 
        WHERE trigger_schema = 'public'
    ) LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(r.trigger_name) || 
                ' ON public.' || quote_ident(r.event_object_table) || ' CASCADE';
    END LOOP;
END $$;

-- Drop all tables (this is the main cleanup)
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Get all tables in public schema
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
        RAISE NOTICE 'Dropped table: %', r.tablename;
    END LOOP;
END $$;

-- Drop all sequences
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT sequence_name 
        FROM information_schema.sequences 
        WHERE sequence_schema = 'public'
    ) LOOP
        EXECUTE 'DROP SEQUENCE IF EXISTS public.' || quote_ident(r.sequence_name) || ' CASCADE';
    END LOOP;
END $$;

-- Drop all custom types (enums, composites, etc.)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT typname 
        FROM pg_type t 
        JOIN pg_namespace n ON n.oid = t.typnamespace 
        WHERE n.nspname = 'public' 
        AND t.typtype IN ('e', 'c', 'd')  -- enum, composite, domain types
    ) LOOP
        EXECUTE 'DROP TYPE IF EXISTS public.' || quote_ident(r.typname) || ' CASCADE';
    END LOOP;
END $$;

-- Drop all domains
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT domain_name 
        FROM information_schema.domains 
        WHERE domain_schema = 'public'
    ) LOOP
        EXECUTE 'DROP DOMAIN IF EXISTS public.' || quote_ident(r.domain_name) || ' CASCADE';
    END LOOP;
END $$;

-- Clean up any remaining indexes (should be auto-dropped with tables, but just in case)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT indexname 
        FROM pg_indexes 
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE 'DROP INDEX IF EXISTS public.' || quote_ident(r.indexname) || ' CASCADE';
    END LOOP;
END $$;

-- Final verification queries
DO $$
BEGIN
    RAISE NOTICE '=== CLEANUP VERIFICATION ===';
END $$;

-- Check remaining tables
SELECT 'REMAINING TABLES:' as check_type, count(*) as count 
FROM pg_tables 
WHERE schemaname = 'public';

SELECT tablename as remaining_objects
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check remaining functions
SELECT 'REMAINING FUNCTIONS:' as check_type, count(*) as count
FROM information_schema.routines 
WHERE routine_schema = 'public';

-- Check remaining types
SELECT 'REMAINING TYPES:' as check_type, count(*) as count
FROM pg_type t 
JOIN pg_namespace n ON n.oid = t.typnamespace 
WHERE n.nspname = 'public' 
AND t.typtype IN ('e', 'c', 'd');

-- Check remaining sequences
SELECT 'REMAINING SEQUENCES:' as check_type, count(*) as count
FROM information_schema.sequences 
WHERE sequence_schema = 'public';

-- Final completion notice
DO $$
BEGIN
    RAISE NOTICE 'NUCLEAR CLEANUP COMPLETED! Your public schema should now be completely empty.';
    RAISE NOTICE 'If you still see objects above, they might be system-protected or require manual removal.';
END $$;
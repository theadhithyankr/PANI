-- =====================================================
-- MIGRATION SCRIPT: FIX CONVERSATION_PARTICIPANTS FOREIGN KEY
-- =====================================================
-- This script adds the missing foreign key constraint between
-- conversation_participants and conversations_v2 tables

-- =====================================================
-- 1. ADD MISSING FOREIGN KEY CONSTRAINT
-- =====================================================

-- Add foreign key constraint from conversation_participants to conversations_v2
ALTER TABLE public.conversation_participants 
ADD CONSTRAINT conversation_participants_conversation_id_fkey 
FOREIGN KEY (conversation_id) REFERENCES public.conversations_v2(id) ON DELETE CASCADE;

-- =====================================================
-- 2. VERIFY THE CONSTRAINT WAS ADDED
-- =====================================================

-- Check that the foreign key constraint exists
DO $$
BEGIN
    -- Check if the foreign key constraint exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'conversation_participants_conversation_id_fkey'
        AND table_name = 'conversation_participants'
        AND table_schema = 'public'
    ) THEN
        RAISE NOTICE 'Foreign key constraint added successfully!';
    ELSE
        RAISE EXCEPTION 'Failed to add foreign key constraint';
    END IF;
END $$;

-- =====================================================
-- 3. GRANT NECESSARY PERMISSIONS
-- =====================================================

-- Grant necessary permissions for the tables
GRANT ALL ON public.conversation_participants TO authenticated;
GRANT ALL ON public.conversations_v2 TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- =====================================================
-- 4. CREATE HELPFUL INDEXES
-- =====================================================

-- Create index for efficient conversation lookups
CREATE INDEX IF NOT EXISTS conversation_participants_conversation_id_idx 
ON public.conversation_participants USING btree (conversation_id);

-- Create index for efficient user lookups
CREATE INDEX IF NOT EXISTS conversation_participants_user_id_idx 
ON public.conversation_participants USING btree (user_id);

-- =====================================================
-- 5. ADD COMMENTS
-- =====================================================

COMMENT ON TABLE public.conversation_participants IS 'Links users to conversations they participate in';
COMMENT ON TABLE public.conversations_v2 IS 'Stores conversation threads linked to job applications';
COMMENT ON COLUMN public.conversation_participants.conversation_id IS 'References conversations_v2.id';
COMMENT ON COLUMN public.conversation_participants.user_id IS 'References profiles.id';
COMMENT ON COLUMN public.conversations_v2.application_id IS 'References job_applications_v2.id';









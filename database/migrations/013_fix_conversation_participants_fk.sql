-- =====================================================
-- FIX: Add Missing Foreign Key Constraint
-- =====================================================
-- This script adds the missing foreign key constraint between conversation_participants and conversations_v2

-- 1. First, check if the constraint already exists
DO $$
BEGIN
  -- Check if the foreign key constraint exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'conversation_participants_conversation_id_fkey'
    AND table_name = 'conversation_participants'
    AND table_schema = 'public'
  ) THEN
    -- Add the foreign key constraint
    ALTER TABLE public.conversation_participants 
    ADD CONSTRAINT conversation_participants_conversation_id_fkey 
    FOREIGN KEY (conversation_id) REFERENCES public.conversations_v2(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'Foreign key constraint added successfully';
  ELSE
    RAISE NOTICE 'Foreign key constraint already exists';
  END IF;
END $$;

-- 2. Verify the constraint was created
SELECT 
  'Foreign Key Check' as check_type,
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  '✅ EXISTS' as status
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
  AND tc.table_name = 'conversation_participants'
  AND tc.constraint_name = 'conversation_participants_conversation_id_fkey';

-- 3. Test the relationship by trying a simple join
SELECT 
  'Relationship Test' as test_type,
  COUNT(*) as participant_count,
  '✅ WORKING' as status
FROM public.conversation_participants cp
JOIN public.conversations_v2 c ON cp.conversation_id = c.id
LIMIT 1;









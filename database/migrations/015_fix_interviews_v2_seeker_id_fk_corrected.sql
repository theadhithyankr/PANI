-- =====================================================
-- FIX: Correct Foreign Key for interviews_v2.seeker_id (CORRECTED)
-- =====================================================
-- This script fixes the foreign key constraint for seeker_id to reference profiles instead of job_seeker_profiles

-- 1. First, check if the seeker_id column exists and what it references
SELECT 
  'Current Structure Check' as check_type,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'interviews_v2' 
  AND table_schema = 'public'
  AND column_name IN ('seeker_id', 'application_id', 'interviewer_id')
ORDER BY column_name;

-- 2. Check current foreign key constraints
SELECT 
  'Current Foreign Keys' as check_type,
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
  AND tc.table_name = 'interviews_v2';

-- 3. Drop the incorrect foreign key constraint if it exists
DO $$
BEGIN
  -- Check if the incorrect foreign key exists and drop it
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'interviews_v2_seeker_id_fkey'
    AND table_name = 'interviews_v2'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.interviews_v2 
    DROP CONSTRAINT interviews_v2_seeker_id_fkey;
    
    RAISE NOTICE 'Dropped incorrect seeker_id foreign key constraint';
  END IF;
END $$;

-- 4. Add the correct foreign key constraint for seeker_id
DO $$
BEGIN
  -- Check if the correct foreign key already exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'interviews_v2_seeker_id_fkey'
    AND table_name = 'interviews_v2'
    AND table_schema = 'public'
  ) THEN
    -- Add the correct foreign key constraint
    ALTER TABLE public.interviews_v2 
    ADD CONSTRAINT interviews_v2_seeker_id_fkey 
    FOREIGN KEY (seeker_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'Added correct seeker_id foreign key constraint';
  ELSE
    RAISE NOTICE 'Correct seeker_id foreign key constraint already exists';
  END IF;
END $$;

-- 5. Ensure application_id foreign key is correct
DO $$
BEGIN
  -- Check if application_id foreign key exists and is correct
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'interviews_v2_application_id_fkey'
    AND table_name = 'interviews_v2'
    AND table_schema = 'public'
  ) THEN
    -- Add the application_id foreign key constraint
    ALTER TABLE public.interviews_v2 
    ADD CONSTRAINT interviews_v2_application_id_fkey 
    FOREIGN KEY (application_id) REFERENCES public.job_applications_v2(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'Added application_id foreign key constraint';
  ELSE
    RAISE NOTICE 'application_id foreign key constraint already exists';
  END IF;
END $$;

-- 6. Ensure interviewer_id foreign key is correct
DO $$
BEGIN
  -- Check if interviewer_id foreign key exists and is correct
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'interviews_v2_interviewer_id_fkey'
    AND table_name = 'interviews_v2'
    AND table_schema = 'public'
  ) THEN
    -- Add the interviewer_id foreign key constraint
    ALTER TABLE public.interviews_v2 
    ADD CONSTRAINT interviews_v2_interviewer_id_fkey 
    FOREIGN KEY (interviewer_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'Added interviewer_id foreign key constraint';
  ELSE
    RAISE NOTICE 'interviewer_id foreign key constraint already exists';
  END IF;
END $$;

-- 7. Verify all foreign key constraints are correct
SELECT 
  'Final Foreign Key Check' as check_type,
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  '✅ CORRECT' as status
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
  AND tc.table_name = 'interviews_v2'
ORDER BY kcu.column_name;

-- 8. Test the relationships
SELECT 
  'Relationship Test' as test_type,
  'seeker_id -> profiles' as relationship,
  COUNT(*) as count,
  '✅ WORKING' as status
FROM public.interviews_v2 i
JOIN public.profiles p ON i.seeker_id = p.id
LIMIT 1;

SELECT 
  'Relationship Test' as test_type,
  'application_id -> job_applications_v2' as relationship,
  COUNT(*) as count,
  '✅ WORKING' as status
FROM public.interviews_v2 i
JOIN public.job_applications_v2 ja ON i.application_id = ja.id
LIMIT 1;

SELECT 
  'Relationship Test' as test_type,
  'interviewer_id -> profiles' as relationship,
  COUNT(*) as count,
  '✅ WORKING' as status
FROM public.interviews_v2 i
JOIN public.profiles p ON i.interviewer_id = p.id
LIMIT 1;









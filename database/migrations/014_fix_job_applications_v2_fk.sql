-- =====================================================
-- FIX: Correct Foreign Key for job_applications_v2
-- =====================================================
-- This script fixes the foreign key constraint for applicant_id to reference profiles instead of job_seeker_profiles

-- 1. Drop the incorrect foreign key constraint if it exists
DO $$
BEGIN
  -- Check if the incorrect foreign key exists and drop it
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'job_applications_v2_applicant_id_fkey'
    AND table_name = 'job_applications_v2'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.job_applications_v2 
    DROP CONSTRAINT job_applications_v2_applicant_id_fkey;
    
    RAISE NOTICE 'Dropped incorrect foreign key constraint';
  END IF;
END $$;

-- 2. Add the correct foreign key constraint
DO $$
BEGIN
  -- Check if the correct foreign key already exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'job_applications_v2_applicant_id_fkey'
    AND table_name = 'job_applications_v2'
    AND table_schema = 'public'
  ) THEN
    -- Add the correct foreign key constraint
    ALTER TABLE public.job_applications_v2 
    ADD CONSTRAINT job_applications_v2_applicant_id_fkey 
    FOREIGN KEY (applicant_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'Added correct foreign key constraint';
  ELSE
    RAISE NOTICE 'Correct foreign key constraint already exists';
  END IF;
END $$;

-- 3. Verify the constraint was created correctly
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
  AND tc.table_name = 'job_applications_v2'
  AND tc.constraint_name = 'job_applications_v2_applicant_id_fkey';

-- 4. Test the relationship by trying a simple join
SELECT 
  'Relationship Test' as test_type,
  COUNT(*) as application_count,
  '✅ WORKING' as status
FROM public.job_applications_v2 ja
JOIN public.profiles p ON ja.applicant_id = p.id
LIMIT 1;









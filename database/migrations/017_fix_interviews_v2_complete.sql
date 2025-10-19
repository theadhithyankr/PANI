-- =====================================================
-- FIX: Complete interviews_v2 table structure
-- =====================================================
-- This script ensures interviews_v2 has the correct structure and foreign keys

-- 1. First, let's see what we're working with
SELECT 
  'Current Structure' as check_type,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'interviews_v2' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Add seeker_id column if it doesn't exist
DO $$
BEGIN
  -- Check if seeker_id column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'interviews_v2' 
    AND column_name = 'seeker_id'
    AND table_schema = 'public'
  ) THEN
    -- Add the seeker_id column
    ALTER TABLE public.interviews_v2 
    ADD COLUMN seeker_id uuid;
    
    RAISE NOTICE 'Added seeker_id column to interviews_v2';
  ELSE
    RAISE NOTICE 'seeker_id column already exists in interviews_v2';
  END IF;
END $$;

-- 3. Add job_id column if it doesn't exist (for backward compatibility)
DO $$
BEGIN
  -- Check if job_id column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'interviews_v2' 
    AND column_name = 'job_id'
    AND table_schema = 'public'
  ) THEN
    -- Add the job_id column
    ALTER TABLE public.interviews_v2 
    ADD COLUMN job_id uuid;
    
    RAISE NOTICE 'Added job_id column to interviews_v2';
  ELSE
    RAISE NOTICE 'job_id column already exists in interviews_v2';
  END IF;
END $$;

-- 4. Add foreign key constraint for seeker_id
DO $$
BEGIN
  -- Check if the foreign key already exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'interviews_v2_seeker_id_fkey'
    AND table_name = 'interviews_v2'
    AND table_schema = 'public'
  ) THEN
    -- Add the foreign key constraint
    ALTER TABLE public.interviews_v2 
    ADD CONSTRAINT interviews_v2_seeker_id_fkey 
    FOREIGN KEY (seeker_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'Added seeker_id foreign key constraint';
  ELSE
    RAISE NOTICE 'seeker_id foreign key constraint already exists';
  END IF;
END $$;

-- 5. Add foreign key constraint for application_id
DO $$
BEGIN
  -- Check if the foreign key already exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'interviews_v2_application_id_fkey'
    AND table_name = 'interviews_v2'
    AND table_schema = 'public'
  ) THEN
    -- Add the foreign key constraint
    ALTER TABLE public.interviews_v2 
    ADD CONSTRAINT interviews_v2_application_id_fkey 
    FOREIGN KEY (application_id) REFERENCES public.job_applications_v2(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'Added application_id foreign key constraint';
  ELSE
    RAISE NOTICE 'application_id foreign key constraint already exists';
  END IF;
END $$;

-- 6. Add foreign key constraint for interviewer_id
DO $$
BEGIN
  -- Check if the foreign key already exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'interviews_v2_interviewer_id_fkey'
    AND table_name = 'interviews_v2'
    AND table_schema = 'public'
  ) THEN
    -- Add the foreign key constraint
    ALTER TABLE public.interviews_v2 
    ADD CONSTRAINT interviews_v2_interviewer_id_fkey 
    FOREIGN KEY (interviewer_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'Added interviewer_id foreign key constraint';
  ELSE
    RAISE NOTICE 'interviewer_id foreign key constraint already exists';
  END IF;
END $$;

-- 7. Add foreign key constraint for job_id (if column exists)
DO $$
BEGIN
  -- Check if job_id column exists and foreign key doesn't exist
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'interviews_v2' 
    AND column_name = 'job_id'
    AND table_schema = 'public'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'interviews_v2_job_id_fkey'
    AND table_name = 'interviews_v2'
    AND table_schema = 'public'
  ) THEN
    -- Add the foreign key constraint
    ALTER TABLE public.interviews_v2 
    ADD CONSTRAINT interviews_v2_job_id_fkey 
    FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'Added job_id foreign key constraint';
  ELSE
    RAISE NOTICE 'job_id foreign key constraint already exists or job_id column does not exist';
  END IF;
END $$;

-- 8. Verify final structure
SELECT 
  'Final Structure' as check_type,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'interviews_v2' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 9. Verify all foreign key constraints
SELECT 
  'Final Foreign Keys' as check_type,
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









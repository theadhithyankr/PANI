-- Fix missing columns in job_seeker_profiles table
-- This script adds missing columns that are referenced in the application code

-- Check and add ai_career_insights column (jsonb)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'job_seeker_profiles' 
        AND column_name = 'ai_career_insights'
    ) THEN
        ALTER TABLE public.job_seeker_profiles 
        ADD COLUMN ai_career_insights jsonb;
        RAISE NOTICE 'Added ai_career_insights column to job_seeker_profiles table';
    ELSE
        RAISE NOTICE 'ai_career_insights column already exists in job_seeker_profiles table';
    END IF;
END $$;

-- Check and add ai_generated_summary column (text)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'job_seeker_profiles' 
        AND column_name = 'ai_generated_summary'
    ) THEN
        ALTER TABLE public.job_seeker_profiles 
        ADD COLUMN ai_generated_summary text;
        RAISE NOTICE 'Added ai_generated_summary column to job_seeker_profiles table';
    ELSE
        RAISE NOTICE 'ai_generated_summary column already exists in job_seeker_profiles table';
    END IF;
END $$;

-- Check and add ai_match_data column (jsonb)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'job_seeker_profiles' 
        AND column_name = 'ai_match_data'
    ) THEN
        ALTER TABLE public.job_seeker_profiles 
        ADD COLUMN ai_match_data jsonb;
        RAISE NOTICE 'Added ai_match_data column to job_seeker_profiles table';
    ELSE
        RAISE NOTICE 'ai_match_data column already exists in job_seeker_profiles table';
    END IF;
END $$;

-- Check and add cultural_preferences column (jsonb)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'job_seeker_profiles' 
        AND column_name = 'cultural_preferences'
    ) THEN
        ALTER TABLE public.job_seeker_profiles 
        ADD COLUMN cultural_preferences jsonb;
        RAISE NOTICE 'Added cultural_preferences column to job_seeker_profiles table';
    ELSE
        RAISE NOTICE 'cultural_preferences column already exists in job_seeker_profiles table';
    END IF;
END $$;

-- Check and add current_location column (text)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'job_seeker_profiles' 
        AND column_name = 'current_location'
    ) THEN
        ALTER TABLE public.job_seeker_profiles 
        ADD COLUMN current_location text;
        RAISE NOTICE 'Added current_location column to job_seeker_profiles table';
    ELSE
        RAISE NOTICE 'current_location column already exists in job_seeker_profiles table';
    END IF;
END $$;

-- Check and add experience_years column (integer)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'job_seeker_profiles' 
        AND column_name = 'experience_years'
    ) THEN
        ALTER TABLE public.job_seeker_profiles 
        ADD COLUMN experience_years integer;
        RAISE NOTICE 'Added experience_years column to job_seeker_profiles table';
    ELSE
        RAISE NOTICE 'experience_years column already exists in job_seeker_profiles table';
    END IF;
END $$;

-- Check and add headline column (text)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'job_seeker_profiles' 
        AND column_name = 'headline'
    ) THEN
        ALTER TABLE public.job_seeker_profiles 
        ADD COLUMN headline text;
        RAISE NOTICE 'Added headline column to job_seeker_profiles table';
    ELSE
        RAISE NOTICE 'headline column already exists in job_seeker_profiles table';
    END IF;
END $$;

-- Check and add summary column (text)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'job_seeker_profiles' 
        AND column_name = 'summary'
    ) THEN
        ALTER TABLE public.job_seeker_profiles 
        ADD COLUMN summary text;
        RAISE NOTICE 'Added summary column to job_seeker_profiles table';
    ELSE
        RAISE NOTICE 'summary column already exists in job_seeker_profiles table';
    END IF;
END $$;

-- Check and add availability_status column (text)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'job_seeker_profiles' 
        AND column_name = 'availability_status'
    ) THEN
        ALTER TABLE public.job_seeker_profiles 
        ADD COLUMN availability_status text;
        RAISE NOTICE 'Added availability_status column to job_seeker_profiles table';
    ELSE
        RAISE NOTICE 'availability_status column already exists in job_seeker_profiles table';
    END IF;
END $$;

-- Check and add visa_status column (text) - may already exist from separate migration
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'job_seeker_profiles' 
        AND column_name = 'visa_status'
    ) THEN
        ALTER TABLE public.job_seeker_profiles 
        ADD COLUMN visa_status text;
        RAISE NOTICE 'Added visa_status column to job_seeker_profiles table';
    ELSE
        RAISE NOTICE 'visa_status column already exists in job_seeker_profiles table';
    END IF;
END $$;

-- Check and add onboarding_complete column (boolean) - may already exist from separate migration
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'job_seeker_profiles' 
        AND column_name = 'onboarding_complete'
    ) THEN
        ALTER TABLE public.job_seeker_profiles 
        ADD COLUMN onboarding_complete boolean DEFAULT FALSE;
        RAISE NOTICE 'Added onboarding_complete column to job_seeker_profiles table';
    ELSE
        RAISE NOTICE 'onboarding_complete column already exists in job_seeker_profiles table';
    END IF;
END $$;

-- Check and add onboarding_step column (integer) - may already exist from separate migration
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'job_seeker_profiles' 
        AND column_name = 'onboarding_step'
    ) THEN
        ALTER TABLE public.job_seeker_profiles 
        ADD COLUMN onboarding_step integer DEFAULT 1;
        RAISE NOTICE 'Added onboarding_step column to job_seeker_profiles table';
    ELSE
        RAISE NOTICE 'onboarding_step column already exists in job_seeker_profiles table';
    END IF;
END $$;

-- Check and add languages column (jsonb)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'job_seeker_profiles' 
        AND column_name = 'languages'
    ) THEN
        ALTER TABLE public.job_seeker_profiles 
        ADD COLUMN languages jsonb;
        RAISE NOTICE 'Added languages column to job_seeker_profiles table';
    ELSE
        RAISE NOTICE 'languages column already exists in job_seeker_profiles table';
    END IF;
END $$;

-- Check and add preferred_locations column (text[])
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'job_seeker_profiles' 
        AND column_name = 'preferred_locations'
    ) THEN
        ALTER TABLE public.job_seeker_profiles 
        ADD COLUMN preferred_locations text[];
        RAISE NOTICE 'Added preferred_locations column to job_seeker_profiles table';
    ELSE
        RAISE NOTICE 'preferred_locations column already exists in job_seeker_profiles table';
    END IF;
END $$;

-- Check and add willing_to_relocate column (boolean)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'job_seeker_profiles' 
        AND column_name = 'willing_to_relocate'
    ) THEN
        ALTER TABLE public.job_seeker_profiles 
        ADD COLUMN willing_to_relocate boolean DEFAULT true;
        RAISE NOTICE 'Added willing_to_relocate column to job_seeker_profiles table';
    ELSE
        RAISE NOTICE 'willing_to_relocate column already exists in job_seeker_profiles table';
    END IF;
END $$;

-- Check and add preferred_job_types column (text[])
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'job_seeker_profiles' 
        AND column_name = 'preferred_job_types'
    ) THEN
        ALTER TABLE public.job_seeker_profiles 
        ADD COLUMN preferred_job_types text[];
        RAISE NOTICE 'Added preferred_job_types column to job_seeker_profiles table';
    ELSE
        RAISE NOTICE 'preferred_job_types column already exists in job_seeker_profiles table';
    END IF;
END $$;

-- Check and add target_salary_range column (jsonb)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'job_seeker_profiles' 
        AND column_name = 'target_salary_range'
    ) THEN
        ALTER TABLE public.job_seeker_profiles 
        ADD COLUMN target_salary_range jsonb;
        RAISE NOTICE 'Added target_salary_range column to job_seeker_profiles table';
    ELSE
        RAISE NOTICE 'target_salary_range column already exists in job_seeker_profiles table';
    END IF;
END $$;

-- Check and add skills column (text[])
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'job_seeker_profiles' 
        AND column_name = 'skills'
    ) THEN
        ALTER TABLE public.job_seeker_profiles 
        ADD COLUMN skills text[];
        RAISE NOTICE 'Added skills column to job_seeker_profiles table';
    ELSE
        RAISE NOTICE 'skills column already exists in job_seeker_profiles table';
    END IF;
END $$;

-- Check and add relocation_timeline column (text)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'job_seeker_profiles' 
        AND column_name = 'relocation_timeline'
    ) THEN
        ALTER TABLE public.job_seeker_profiles 
        ADD COLUMN relocation_timeline text;
        RAISE NOTICE 'Added relocation_timeline column to job_seeker_profiles table';
    ELSE
        RAISE NOTICE 'relocation_timeline column already exists in job_seeker_profiles table';
    END IF;
END $$;

-- Refresh PostgREST schema cache to ensure new columns are available
NOTIFY pgrst, 'reload schema';
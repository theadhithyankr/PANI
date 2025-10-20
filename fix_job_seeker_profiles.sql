-- Fix Job Seeker Profiles Table - Add missing ai_career_insights column
-- Paste this directly into your SQL editor

-- Check if the columns already exist and add them if missing
DO $$ 
BEGIN
    -- Add ai_career_insights column if it doesn't exist
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

    -- Add ai_generated_summary column if it doesn't exist
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

    -- Add ai_match_data column if it doesn't exist
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

    -- Add cultural_preferences column if it doesn't exist
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

    -- Add current_location column if it doesn't exist
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

    -- Add experience_years column if it doesn't exist
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

-- Refresh the PostgREST schema cache
NOTIFY pgrst, 'reload schema';
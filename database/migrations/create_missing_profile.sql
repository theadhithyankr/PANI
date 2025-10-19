-- =====================================================
-- CREATE MISSING PROFILE FOR EXISTING USER
-- =====================================================
-- This script creates a profile for your user if it doesn't exist

DO $$
DECLARE
    v_user_id uuid;
BEGIN
    -- Get the user ID from auth.users (replace with your actual email)
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = 'theadhithyankr@gmail.com';
    
    IF v_user_id IS NULL THEN
        RAISE NOTICE 'User with email theadhithyankr@gmail.com not found in auth.users';
        RETURN;
    END IF;
    
    -- Create profile if it doesn't exist
    INSERT INTO public.profiles (id, created_at, updated_at, full_name, avatar_url, user_type)
    VALUES (v_user_id, NOW(), NOW(), 'Adhithyan Rajan', NULL, 'job_seeker')
    ON CONFLICT (id) DO NOTHING;
    
    -- Also create job_seeker_profile
    INSERT INTO public.job_seeker_profiles (id, created_at, updated_at)
    VALUES (v_user_id, NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE 'Profile created or updated for user ID: %', v_user_id;
END $$;

-- Show the profile data
SELECT * FROM public.profiles 
WHERE id IN (SELECT id FROM auth.users WHERE email = 'theadhithyankr@gmail.com');
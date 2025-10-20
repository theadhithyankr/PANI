-- SQL Script to manually add storage1b@gmail.com as an employee
-- Run this in Supabase SQL Editor

-- First, let's create the user in auth.users if it doesn't exist
-- Note: This approach works with most Supabase setups
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'storage1b@gmail.com',
  crypt('Demo123!', gen_salt('bf')), -- Password: Demo123!
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Storage Employee"}',
  now(),
  now(),
  '',
  '',
  '',
  ''
) ON CONFLICT (email) DO NOTHING;

-- Get the user ID for the email
DO $$
DECLARE
  v_user_id uuid;
  v_company_id uuid;
  v_email text := 'storage1b@gmail.com';
  v_full_name text := 'Storage Employee';
  v_company_name text := 'Storage Demo Company';
BEGIN
  -- Get user ID
  SELECT id INTO v_user_id 
  FROM auth.users 
  WHERE email = v_email;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found for email: %', v_email;
  END IF;
  
  -- Create profile as employer
  INSERT INTO public.profiles (
    id, 
    user_type, 
    full_name, 
    onboarding_complete,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    'employer',
    v_full_name,
    false,
    now(),
    now()
  ) ON CONFLICT (id) DO UPDATE SET
    user_type = 'employer',
    full_name = EXCLUDED.full_name,
    updated_at = now();
  
  -- Check if company already exists
  SELECT id INTO v_company_id 
  FROM public.companies 
  WHERE name = v_company_name AND created_by = v_user_id;
  
  -- Create company if it doesn't exist
  IF v_company_id IS NULL THEN
    INSERT INTO public.companies (
      name,
      industry,
      size,
      description,
      created_by,
      created_at,
      updated_at
    ) VALUES (
      v_company_name,
      'Technology',
      '1-10',
      'Demo company for testing employee functionality',
      v_user_id,
      now(),
      now()
    )
    RETURNING id INTO v_company_id;
  END IF;
  
  -- Create employer profile
  INSERT INTO public.employer_profiles (
    id,
    company_id,
    position,
    department,
    is_admin,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    v_company_id,
    'HR Manager',
    'Human Resources',
    true,
    now(),
    now()
  ) ON CONFLICT (id) DO UPDATE SET
    company_id = EXCLUDED.company_id,
    position = EXCLUDED.position,
    department = EXCLUDED.department,
    is_admin = EXCLUDED.is_admin,
    updated_at = now();
  
  -- Add as team member with employee role
  INSERT INTO public.team_members (
    company_id,
    user_id,
    role,
    permissions,
    is_active,
    created_by,
    created_at,
    updated_at
  ) VALUES (
    v_company_id,
    v_user_id,
    'employee',
    '{"manage_jobs": true, "manage_applications": true, "view_analytics": true}'::jsonb,
    true,
    v_user_id,
    now(),
    now()
  ) ON CONFLICT (company_id, user_id) DO UPDATE SET
    role = 'employee',
    permissions = EXCLUDED.permissions,
    is_active = true,
    updated_at = now();
  
  RAISE NOTICE 'Successfully created employee user: % with company: % (ID: %)', v_email, v_company_name, v_company_id;
  RAISE NOTICE 'User ID: %', v_user_id;
  RAISE NOTICE 'Login credentials - Email: %, Password: Demo123!', v_email;
END $$;

-- Verify the setup
SELECT 
  u.email,
  p.user_type,
  p.full_name,
  c.name as company_name,
  ep.position,
  ep.department,
  tm.role as team_role,
  tm.permissions
FROM auth.users u
JOIN public.profiles p ON u.id = p.id
LEFT JOIN public.employer_profiles ep ON u.id = ep.id
LEFT JOIN public.companies c ON ep.company_id = c.id
LEFT JOIN public.team_members tm ON u.id = tm.user_id AND c.id = tm.company_id
WHERE u.email = 'storage1b@gmail.com';
-- =====================================================
-- CREATE ADMIN USER
-- =====================================================
-- This script creates an admin user with the specified email and username

-- Check if the user already exists in auth.users
DO $$
DECLARE
  user_id uuid;
BEGIN
  -- Try to get the user ID if it exists
  SELECT id INTO user_id FROM auth.users WHERE email = 'spreadlellc@gmail.com' LIMIT 1;
  
  -- If user doesn't exist, create it
  IF user_id IS NULL THEN
    -- Insert into auth.users (this is a simplified version, in production you'd use Supabase auth API)
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
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      uuid_generate_v4(),
      'authenticated',
      'authenticated',
      'spreadlellc@gmail.com',
      crypt('password123', gen_salt('bf')), -- You should change this password
      now(),
      now(),
      now(),
      '{"provider": "email", "providers": ["email"]}',
      '{"full_name": "Spreadle"}',
      now(),
      now(),
      '',
      '',
      '',
      ''
    )
    RETURNING id INTO user_id;
  END IF;

  -- Create or update profile
  INSERT INTO public.profiles (
    id,
    full_name,
    avatar_url,
    user_type
  )
  VALUES (
    user_id,
    'Spreadle',
    null,
    'admin'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = 'Spreadle',
    user_type = 'admin';

  -- Create or update admin_profiles
  INSERT INTO public.admin_profiles (
    user_id,
    admin_level,
    permissions
  )
  VALUES (
    user_id,
    'super_admin',
    '{manage_users, manage_jobs, manage_applications, manage_system}'
  )
  ON CONFLICT (user_id) DO UPDATE SET
    admin_level = 'super_admin',
    permissions = '{manage_users, manage_jobs, manage_applications, manage_system}';

  RAISE NOTICE 'Admin user created or updated with ID: %', user_id;
END
$$;
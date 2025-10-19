import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('VITE_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
  console.log('VITE_SUPABASE_ANON_KEY:', supabaseKey ? '✅ Set' : '❌ Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSignup() {
  console.log('🧪 Testing Signup Process...\n');
  
  const testUser = {
    email: 'test.user@gmail.com', // Using a more realistic email
    password: 'TestPassword123!',
    name: 'Test User',
    type: 'candidate'
  };
  
  try {
    console.log('Step 1: Creating user in Supabase Auth...');
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testUser.email,
      password: testUser.password,
      options: {
        emailRedirectTo: `http://localhost:5173/email-verified`,
      },
    });

    if (signUpError) {
      console.error('❌ Supabase Auth signup failed:', signUpError);
      return;
    }

    console.log('✅ Auth signup successful');
    console.log('User ID:', signUpData?.user?.id);
    console.log('Email confirmed:', signUpData?.user?.email_confirmed_at ? 'Yes' : 'No');
    
    const userId = signUpData?.user?.id;
    if (!userId) {
      console.error('❌ No user ID returned from signup');
      return;
    }

    console.log('\nStep 2: Creating profile...');
    const { error: profileError } = await supabase.from('profiles').insert({
      id: userId,
      user_type: 'job_seeker',
      full_name: testUser.name,
      onboarding_complete: false,
    });

    if (profileError) {
      console.error('❌ Profile creation failed:', profileError);
      return;
    }

    console.log('✅ Profile created successfully');
    
    console.log('\n🎉 Signup process completed successfully!');
    
    // Clean up - delete the test user
    console.log('\n🧹 Cleaning up test data...');
    await supabase.from('profiles').delete().eq('id', userId);
    console.log('✅ Test data cleaned up');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testSignup();
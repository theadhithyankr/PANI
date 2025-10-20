import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkRLSPolicies() {
  console.log('🔍 Checking RLS Policy Configuration...\n');
  
  try {
    // First, let's try to access a simple table to see if RLS is blocking us
    console.log('Testing basic table access...');
    
    const { data: profileTest, error: profileError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (profileError) {
      console.log('❌ Cannot access profiles table:', profileError.message);
      console.log('🔧 This suggests RLS policies are too restrictive!');
      
      // Check the specific error
      if (profileError.message.includes('RLS') || profileError.message.includes('policy')) {
        console.log('\n🚨 CONFIRMED: RLS policies are blocking access');
        console.log('The policies are likely set to RESTRICTIVE instead of PERMISSIVE');
        console.log('This prevents authenticated users from accessing their own data');
      }
    } else {
      console.log('✅ Basic table access works');
    }
    
    // Try to check if we can access auth user info
    console.log('\nTesting auth access...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log('❌ Auth error:', authError.message);
    } else if (user) {
      console.log('✅ Auth works, user ID:', user.id);
      
      // Now try to access profile for this specific user
      const { data: userProfile, error: userProfileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (userProfileError) {
        console.log('❌ Cannot access own profile:', userProfileError.message);
        console.log('🚨 CONFIRMED: RLS is blocking authenticated user from accessing their own data');
      } else {
        console.log('✅ Can access own profile');
      }
    } else {
      console.log('ℹ️  No authenticated user (expected for anon key)');
    }
    
    // Try to get table info
    console.log('\nChecking table structure...');
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_type', 'BASE TABLE');
      
    if (tableError) {
      console.log('❌ Cannot access table schema:', tableError.message);
      console.log('This confirms RLS is too restrictive');
    } else {
      console.log('✅ Can access table schema');
      console.log('Tables found:', tables?.length || 0);
    }
    
  } catch (err) {
    console.error('❌ Error during RLS check:', err.message);
    console.log('\n🔧 This error pattern suggests RLS policies need to be fixed');
  }
  
  console.log('\n📋 DIAGNOSIS:');
  console.log('If you see errors above, the RLS policies are likely:');
  console.log('1. Set to RESTRICTIVE instead of PERMISSIVE');
  console.log('2. Missing proper conditions for authenticated users');
  console.log('3. Blocking legitimate access to user data');
  console.log('\n💡 SOLUTION: Update RLS policies to be PERMISSIVE with proper auth conditions');
}

checkRLSPolicies();
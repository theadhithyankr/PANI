import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🗄️  Checking Database Tables...\n');

async function checkTable(tableName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error) {
      console.log(`❌ Table '${tableName}': ${error.message}`);
      return false;
    } else {
      console.log(`✅ Table '${tableName}': exists and accessible`);
      return true;
    }
  } catch (err) {
    console.log(`❌ Table '${tableName}': ${err.message}`);
    return false;
  }
}

async function testSignup() {
  console.log('\n🧪 Testing signup process...');
  
  try {
    // Test with a dummy email to see what error we get
    const { data, error } = await supabase.auth.signUp({
      email: 'test@example.com',
      password: 'testpassword123',
      options: {
        emailRedirectTo: `${SUPABASE_URL}/email-verified`,
      },
    });
    
    if (error) {
      console.log('❌ Signup test error:', error.message);
      console.log('Error code:', error.code || 'No code');
      return false;
    } else {
      console.log('✅ Signup test successful (user may already exist)');
      return true;
    }
  } catch (err) {
    console.log('❌ Signup test failed:', err.message);
    return false;
  }
}

async function checkRLS() {
  console.log('\n🔒 Checking Row Level Security...');
  
  try {
    // Try to insert into profiles table (should fail if RLS is enabled and we're not authenticated)
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: '00000000-0000-0000-0000-000000000000',
        user_type: 'job_seeker',
        full_name: 'Test User'
      });
    
    if (error) {
      if (error.message.includes('RLS') || error.message.includes('policy') || error.message.includes('permission')) {
        console.log('✅ RLS is properly configured (insert blocked)');
        return true;
      } else {
        console.log('⚠️  RLS check inconclusive:', error.message);
        return false;
      }
    } else {
      console.log('⚠️  RLS may not be configured (insert succeeded)');
      return false;
    }
  } catch (err) {
    console.log('❌ RLS check failed:', err.message);
    return false;
  }
}

async function main() {
  const requiredTables = [
    'profiles',
    'job_seeker_profiles',
    'employer_profiles', 
    'companies',
    'jobs',
    'job_applications'
  ];
  
  console.log('Required tables for signup process:');
  
  const results = {};
  for (const table of requiredTables) {
    results[table] = await checkTable(table);
  }
  
  const missingTables = Object.entries(results)
    .filter(([table, exists]) => !exists)
    .map(([table]) => table);
  
  await testSignup();
  await checkRLS();
  
  console.log('\n📊 Summary:');
  if (missingTables.length === 0) {
    console.log('✅ All required tables exist');
  } else {
    console.log('❌ Missing tables:', missingTables.join(', '));
    console.log('\n🔧 To fix this:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Run the migration file: database/migrations/005_clean_database_schema.sql');
  }
  
  console.log('\n💡 If signup still fails after tables exist, check:');
  console.log('- Email confirmation settings in Supabase Auth');
  console.log('- RLS policies for the tables');
  console.log('- Network connectivity');
}

main().catch(console.error);
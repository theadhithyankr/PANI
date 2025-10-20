import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !anonKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, anonKey);

async function fixRLSPolicies() {
  console.log('🚀 Fixing RLS policies for signup...\n');
  
  // Test if we can create RLS policies (this might fail without service role)
  const policies = [
    {
      table: 'profiles',
      name: 'Users can insert their own profile',
      sql: `CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);`
    },
    {
      table: 'profiles', 
      name: 'Users can view their own profile',
      sql: `CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);`
    },
    {
      table: 'profiles',
      name: 'Users can update their own profile', 
      sql: `CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);`
    },
    {
      table: 'job_seeker_profiles',
      name: 'Users can manage their job seeker profile',
      sql: `CREATE POLICY "Users can manage their job seeker profile" ON job_seeker_profiles FOR ALL USING (auth.uid() = user_id);`
    },
    {
      table: 'employer_profiles', 
      name: 'Users can manage their employer profile',
      sql: `CREATE POLICY "Users can manage their employer profile" ON employer_profiles FOR ALL USING (auth.uid() = user_id);`
    },
    {
      table: 'companies',
      name: 'Users can manage their companies',
      sql: `CREATE POLICY "Users can manage their companies" ON companies FOR ALL USING (auth.uid() IN (SELECT user_id FROM employer_profiles WHERE company_id = companies.id));`
    }
  ];
  
  console.log('📋 RLS Policies needed for signup:');
  console.log('');
  
  for (const policy of policies) {
    console.log(`🔧 ${policy.table}: ${policy.name}`);
    console.log(`   SQL: ${policy.sql}`);
    console.log('');
  }
  
  console.log('⚠️  Note: These policies need to be created in the Supabase dashboard');
  console.log('   or with a service role key that has admin privileges.');
  console.log('');
  console.log('🎯 Quick fix: You can also disable RLS entirely in Supabase dashboard:');
  console.log('   1. Go to your Supabase project dashboard');
  console.log('   2. Navigate to Database > Tables');
  console.log('   3. For each table (profiles, job_seeker_profiles, etc.)');
  console.log('   4. Click the table name > Settings > Disable RLS');
  console.log('');
  console.log('🔗 Alternative: Run this SQL in the Supabase SQL editor:');
  console.log('');
  
  const disableRLSSQL = [
    'ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;',
    'ALTER TABLE job_seeker_profiles DISABLE ROW LEVEL SECURITY;', 
    'ALTER TABLE employer_profiles DISABLE ROW LEVEL SECURITY;',
    'ALTER TABLE companies DISABLE ROW LEVEL SECURITY;',
    'ALTER TABLE jobs DISABLE ROW LEVEL SECURITY;',
    'ALTER TABLE job_applications DISABLE ROW LEVEL SECURITY;',
    'ALTER TABLE job_applications_v2 DISABLE ROW LEVEL SECURITY;',
    'ALTER TABLE interviews DISABLE ROW LEVEL SECURITY;',
    'ALTER TABLE interviews_v2 DISABLE ROW LEVEL SECURITY;',
    'ALTER TABLE documents DISABLE ROW LEVEL SECURITY;'
  ];
  
  for (const sql of disableRLSSQL) {
    console.log(`   ${sql}`);
  }
}

// Run the fix
fixRLSPolicies().catch(console.error);
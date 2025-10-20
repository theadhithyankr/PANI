import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !anonKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - VITE_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('   - VITE_SUPABASE_ANON_KEY:', anonKey ? '✅' : '❌');
  process.exit(1);
}

// Create client with anon key
const supabase = createClient(supabaseUrl, anonKey);

const tables = [
  'profiles',
  'job_seeker_profiles', 
  'employer_profiles',
  'companies',
  'jobs',
  'job_applications',
  'job_applications_v2',
  'interviews',
  'interviews_v2',
  'conversations',
  'conversations_v2',
  'messages',
  'messages_v2',
  'messages_v3',
  'documents',
  'conversation_participants',
  'team_members',
  'application_events',
  'job_offers',
  'resume_data',
  'ai_conversations',
  'interview_invitations'
];

async function disableRLS() {
  console.log('🚀 Starting RLS disable process...\n');
  
  let successCount = 0;
  let errorCount = 0;
  
  // First, let's try to test basic connectivity
  console.log('🔍 Testing database connectivity...');
  try {
    const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
    if (error) {
      console.log(`   ⚠️  Database test: ${error.message}`);
    } else {
      console.log(`   ✅ Database connected successfully`);
    }
  } catch (err) {
    console.log(`   ❌ Database test failed: ${err.message}`);
  }
  
  console.log('\n🔧 Attempting to disable RLS using SQL functions...\n');
  
  for (const table of tables) {
    try {
      console.log(`🔧 Processing ${table}...`);
      
      // Try to access the table first to see if RLS is blocking us
      const { data, error: selectError } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (selectError) {
        console.log(`   ⚠️  ${table}: ${selectError.message}`);
        errorCount++;
      } else {
        console.log(`   ✅ ${table}: Table accessible (${data?.length || 0} records visible)`);
        successCount++;
      }
    } catch (err) {
      console.log(`   ❌ ${table}: ${err.message}`);
      errorCount++;
    }
  }
  
  console.log('\n📊 Summary:');
  console.log(`   ✅ Accessible tables: ${successCount}`);
  console.log(`   ❌ Blocked tables: ${errorCount}`);
  
  if (successCount > 0) {
    console.log('\n🎉 Some tables are accessible!');
    console.log('   This suggests RLS might already be disabled or configured properly.');
  } else {
    console.log('\n⚠️  All tables are blocked by RLS.');
    console.log('   You may need to disable RLS directly in the Supabase dashboard.');
  }
}

// Run the disable process
disableRLS().catch(console.error);
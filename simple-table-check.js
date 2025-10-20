import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkTables() {
  console.log('🔍 Checking database tables by direct query...\n');
  
  const expectedTables = [
    'ai_conversations',
    'application_events', 
    'companies',
    'company_photos',
    'conversation_participants',
    'conversations_v2',
    'documents',
    'employer_profiles',
    'interview_invitations',
    'interviews_v2',
    'job_applications_v2',
    'job_offers',
    'job_seeker_profiles',
    'jobs',
    'messages_v3',
    'profiles',
    'resume_data',
    'support_tiers',
    'team_members',
    'transactions'
  ];

  console.log('📋 Checking each table:');
  
  let existingTables = [];
  let missingTables = [];

  for (const table of expectedTables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`  ❌ ${table} - ${error.message}`);
        missingTables.push(table);
      } else {
        console.log(`  ✅ ${table}`);
        existingTables.push(table);
      }
    } catch (err) {
      console.log(`  ❌ ${table} - ${err.message}`);
      missingTables.push(table);
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`✅ Existing tables: ${existingTables.length}`);
  console.log(`❌ Missing tables: ${missingTables.length}`);

  if (missingTables.length > 0) {
    console.log('\n❌ Missing tables:');
    missingTables.forEach(table => console.log(`  - ${table}`));
    console.log('\n💡 You need to apply the schema from testtt.txt to create these tables.');
  } else {
    console.log('\n✅ All expected tables exist!');
  }
}

checkTables();
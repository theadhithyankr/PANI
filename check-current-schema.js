import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkCurrentSchema() {
  console.log('🔍 Checking current database schema...\n');
  
  try {
    // Use raw SQL query to get all tables in the public schema
    const { data: tables, error } = await supabase.rpc('get_public_tables');

    if (error) {
      // Fallback: try direct query
      const { data: fallbackTables, error: fallbackError } = await supabase
        .from('pg_tables')
        .select('tablename')
        .eq('schemaname', 'public');
      
      if (fallbackError) {
        console.error('❌ Error fetching tables:', fallbackError.message);
        return;
      }
      
      console.log('📋 Current tables in database (fallback method):');
      const currentTables = fallbackTables.map(t => t.tablename).sort();
      currentTables.forEach(table => {
        console.log(`  ✅ ${table}`);
      });
      
      console.log(`\n📊 Total tables: ${currentTables.length}\n`);
      return;
    }

    console.log('📋 Current tables in database:');
    const currentTables = tables.map(t => t.table_name).sort();
    currentTables.forEach(table => {
      console.log(`  ✅ ${table}`);
    });

    console.log(`\n📊 Total tables: ${currentTables.length}\n`);

    // Expected tables from the schema
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

    console.log('🎯 Expected tables from schema:');
    expectedTables.forEach(table => {
      const exists = currentTables.includes(table);
      console.log(`  ${exists ? '✅' : '❌'} ${table}`);
    });

    const missingTables = expectedTables.filter(table => !currentTables.includes(table));
    const extraTables = currentTables.filter(table => !expectedTables.includes(table));

    if (missingTables.length > 0) {
      console.log('\n❌ Missing tables:');
      missingTables.forEach(table => console.log(`  - ${table}`));
    }

    if (extraTables.length > 0) {
      console.log('\n⚠️  Extra tables (not in schema):');
      extraTables.forEach(table => console.log(`  - ${table}`));
    }

    if (missingTables.length === 0 && extraTables.length === 0) {
      console.log('\n✅ Database schema matches expected tables!');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkCurrentSchema();
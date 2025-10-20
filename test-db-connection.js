import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 Testing Supabase Database Connection...\n');

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.log('Required variables:');
  console.log('- VITE_SUPABASE_URL');
  console.log('- VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testConnection() {
  try {
    console.log('📡 Testing basic connection...');
    
    // Test basic connection
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    
    if (error) {
      console.error('❌ Connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Basic connection successful');
    return true;
  } catch (err) {
    console.error('❌ Connection error:', err.message);
    return false;
  }
}

async function checkTables() {
  console.log('\n🗄️  Checking required tables...');
  
  const requiredTables = [
    'profiles',
    'job_seeker_profiles', 
    'employer_profiles',
    'companies',
    'jobs',
    'job_applications_v2'
  ];
  
  const results = {};
  
  for (const table of requiredTables) {
    try {
      const { data, error } = await supabase.from(table).select('count').limit(1);
      
      if (error) {
        console.log(`❌ Table '${table}': ${error.message}`);
        results[table] = false;
      } else {
        console.log(`✅ Table '${table}': exists`);
        results[table] = true;
      }
    } catch (err) {
      console.log(`❌ Table '${table}': ${err.message}`);
      results[table] = false;
    }
  }
  
  return results;
}

async function testAuth() {
  console.log('\n🔐 Testing authentication...');
  
  try {
    // Test if we can access auth
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error && error.message !== 'Invalid JWT') {
      console.log('❌ Auth error:', error.message);
      return false;
    }
    
    console.log('✅ Authentication service accessible');
    return true;
  } catch (err) {
    console.log('❌ Auth test failed:', err.message);
    return false;
  }
}

async function runTests() {
  console.log(`🌐 Supabase URL: ${SUPABASE_URL}`);
  console.log(`🔑 Anon Key: ${SUPABASE_ANON_KEY.substring(0, 20)}...`);
  
  const connectionOk = await testConnection();
  
  if (!connectionOk) {
    console.log('\n❌ Database connection failed. Please check:');
    console.log('1. Supabase project is active');
    console.log('2. URL and anon key are correct');
    console.log('3. Network connectivity');
    process.exit(1);
  }
  
  const tableResults = await checkTables();
  const authOk = await testAuth();
  
  console.log('\n📊 Summary:');
  console.log('Connection:', connectionOk ? '✅' : '❌');
  console.log('Authentication:', authOk ? '✅' : '❌');
  
  const missingTables = Object.entries(tableResults)
    .filter(([table, exists]) => !exists)
    .map(([table]) => table);
  
  if (missingTables.length > 0) {
    console.log('\n⚠️  Missing tables:', missingTables.join(', '));
    console.log('Run the database migrations from the database/migrations folder');
  } else {
    console.log('✅ All required tables exist');
  }
  
  if (connectionOk && authOk && missingTables.length === 0) {
    console.log('\n🎉 Database setup looks good!');
  } else {
    console.log('\n🔧 Database setup needs attention');
  }
}

runTests().catch(console.error);
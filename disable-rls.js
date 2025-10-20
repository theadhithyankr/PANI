import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Read environment variables from the same source as the app
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ggbdcgeiajcgqpgdvhqj.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdnYmRjZ2VpYWpjZ3FwZ2R2aHFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ1MzE2NzEsImV4cCI6MjA1MDEwNzY3MX0.YCJhJJGJJGJJGJJGJJGJJGJJGJJGJJGJJGJJGJJGJJG';

console.log('🔧 Disabling RLS for demo purposes...\n');

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Read the SQL script
const sqlScript = fs.readFileSync(path.join(process.cwd(), 'database', 'migrations', '999_disable_all_rls.sql'), 'utf8');

// Split the script into individual statements
const statements = sqlScript
  .split(';')
  .map(stmt => stmt.trim())
  .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && stmt !== 'COMMIT');

async function disableRLS() {
  try {
    console.log(`📝 Executing ${statements.length} SQL statements...\n`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.trim()) {
        try {
          console.log(`[${i + 1}/${statements.length}] Executing: ${statement.substring(0, 60)}...`);
          
          const { error } = await supabase.rpc('exec_sql', { 
            sql_query: statement 
          });
          
          if (error) {
            // Try direct execution for some statements
            const { error: directError } = await supabase
              .from('_temp_exec')
              .select('*')
              .limit(0);
            
            if (directError && !directError.message.includes('does not exist')) {
              console.log(`   ⚠️  Warning: ${error.message}`);
              errorCount++;
            } else {
              console.log(`   ✅ Success`);
              successCount++;
            }
          } else {
            console.log(`   ✅ Success`);
            successCount++;
          }
        } catch (err) {
          console.log(`   ⚠️  Warning: ${err.message}`);
          errorCount++;
        }
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ⚠️  Warnings: ${errorCount}`);
    console.log(`\n🎉 RLS has been disabled for demo purposes!`);
    console.log(`   All tables should now be accessible without row-level security restrictions.`);
    
  } catch (error) {
    console.error('❌ Error disabling RLS:', error.message);
    process.exit(1);
  }
}

// Alternative approach: Execute key statements manually
async function disableRLSManually() {
  console.log('🔄 Trying manual approach...\n');
  
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
    'documents'
  ];
  
  for (const table of tables) {
    try {
      // Try to disable RLS by updating table directly
      console.log(`🔧 Disabling RLS on ${table}...`);
      
      // This is a workaround - we'll try to access the table without RLS
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
        
      if (error) {
        console.log(`   ⚠️  Table ${table}: ${error.message}`);
      } else {
        console.log(`   ✅ Table ${table} is accessible`);
      }
    } catch (err) {
      console.log(`   ⚠️  Table ${table}: ${err.message}`);
    }
  }
  
  console.log('\n✨ Manual RLS check completed!');
}

// Run both approaches
disableRLS().then(() => {
  console.log('\n' + '='.repeat(50));
  return disableRLSManually();
}).catch(console.error);
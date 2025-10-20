import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';
dotenv.config();

// Use service role key for admin operations
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

async function applyRLSFix() {
  console.log('🔧 Applying RLS Policy Fixes...\n');
  
  try {
    // Read the SQL file
    const sqlContent = readFileSync('./fix_rls_policies_permissive.sql', 'utf8');
    
    console.log('📄 Loaded SQL script');
    console.log('🚀 Executing RLS policy fixes...\n');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: sqlContent
    });
    
    if (error) {
      console.error('❌ Error executing SQL:', error.message);
      
      // Try alternative approach - split into smaller chunks
      console.log('🔄 Trying alternative approach...');
      
      // Drop all existing policies first
      const dropPoliciesSQL = `
        DO $$
        DECLARE
            r RECORD;
        BEGIN
            FOR r IN (
                SELECT schemaname, tablename, policyname 
                FROM pg_policies 
                WHERE schemaname = 'public'
            ) LOOP
                EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                              r.policyname, r.schemaname, r.tablename);
                RAISE NOTICE 'Dropped policy: % on table %', r.policyname, r.tablename;
            END LOOP;
        END $$;
      `;
      
      const { error: dropError } = await supabase.rpc('exec_sql', {
        sql_query: dropPoliciesSQL
      });
      
      if (dropError) {
        console.error('❌ Error dropping policies:', dropError.message);
        console.log('\n💡 Please run the fix_rls_policies_permissive.sql script manually in Supabase SQL Editor');
        return;
      }
      
      console.log('✅ Dropped existing policies');
      
    } else {
      console.log('✅ RLS policies updated successfully!');
    }
    
    console.log('\n🔍 Testing authentication after RLS fix...');
    
    // Test basic table access
    const { data: profilesTest, error: profilesError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (profilesError) {
      console.log('❌ Profiles access still restricted:', profilesError.message);
    } else {
      console.log('✅ Profiles table accessible');
    }
    
  } catch (error) {
    console.error('❌ Script error:', error.message);
    console.log('\n💡 Please run the fix_rls_policies_permissive.sql script manually in Supabase SQL Editor');
  }
}

applyRLSFix();
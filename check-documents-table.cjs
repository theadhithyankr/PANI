require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkDocumentsTable() {
  try {
    console.log('🔍 Checking documents table...');
    
    // Try to select from documents table to see if it exists
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Documents table error:', error.message);
      if (error.message.includes('relation "public.documents" does not exist')) {
        console.log('📋 Documents table does not exist - needs to be created');
      }
    } else {
      console.log('✅ Documents table exists');
      if (data && data.length > 0) {
        console.log('📄 Sample document columns:', Object.keys(data[0]));
      } else {
        console.log('📄 Documents table is empty - checking structure...');
        
        // Try inserting a test record to see what columns are expected
        const testInsert = await supabase
          .from('documents')
          .insert({
            owner_id: '00000000-0000-0000-0000-000000000000',
            document_type: 'test',
            file_name: 'test.pdf'
          })
          .select();
          
        if (testInsert.error) {
          console.log('📋 Insert test error (shows missing columns):', testInsert.error.message);
        }
      }
    }
  } catch (err) {
    console.error('💥 Unexpected error:', err.message);
  }
}

checkDocumentsTable();
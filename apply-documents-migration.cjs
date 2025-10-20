require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function applyDocumentsMigration() {
  try {
    console.log('🔧 Applying documents table migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'database', 'migrations', '049_add_documents_columns.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration SQL loaded');
    
    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql_query: migrationSQL 
    });
    
    if (error) {
      console.error('❌ Migration failed:', error.message);
      
      // Try alternative approach - execute statements one by one
      console.log('🔄 Trying alternative approach...');
      
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s && !s.startsWith('--') && !s.startsWith('COMMENT') && !s.startsWith('NOTIFY'));
      
      for (const statement of statements) {
        if (statement) {
          console.log('📝 Executing:', statement.substring(0, 50) + '...');
          const { error: stmtError } = await supabase.rpc('exec_sql', { 
            sql_query: statement + ';' 
          });
          
          if (stmtError) {
            console.log('⚠️  Statement error (may be expected):', stmtError.message);
          } else {
            console.log('✅ Statement executed successfully');
          }
        }
      }
    } else {
      console.log('✅ Migration executed successfully');
    }
    
    // Test the table structure after migration
    console.log('🧪 Testing documents table after migration...');
    
    const { data: testData, error: testError } = await supabase
      .from('documents')
      .insert({
        owner_id: '00000000-0000-0000-0000-000000000000',
        document_type: 'test',
        file_name: 'test.pdf',
        file_path: 'documents/test/test.pdf',
        file_size: 1024,
        file_type: 'application/pdf'
      })
      .select();
    
    if (testError) {
      console.error('❌ Test insert failed:', testError.message);
    } else {
      console.log('✅ Test insert successful - columns are available');
      
      // Clean up test record
      if (testData && testData[0]) {
        await supabase
          .from('documents')
          .delete()
          .eq('id', testData[0].id);
        console.log('🧹 Test record cleaned up');
      }
    }
    
  } catch (err) {
    console.error('💥 Unexpected error:', err.message);
  }
}

applyDocumentsMigration();
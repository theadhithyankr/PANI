require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Use service role key for admin operations
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function createDocumentsTable() {
  try {
    console.log('🔧 Creating/updating documents table...');
    
    // First, let's check what columns currently exist
    const { data: existingData, error: existingError } = await supabase
      .from('documents')
      .select('*')
      .limit(1);
    
    if (existingError && existingError.message.includes('relation "public.documents" does not exist')) {
      console.log('📋 Documents table does not exist, creating it...');
      
      // Create the table from scratch
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS public.documents (
          id uuid NOT NULL DEFAULT gen_random_uuid(),
          owner_id uuid NOT NULL,
          document_type text NOT NULL,
          file_name text NOT NULL,
          file_path text NOT NULL,
          file_size integer,
          file_type text,
          is_verified boolean DEFAULT false,
          verify_notes text,
          metadata jsonb,
          created_at timestamp with time zone DEFAULT now(),
          updated_at timestamp with time zone DEFAULT now(),
          CONSTRAINT documents_pkey PRIMARY KEY (id),
          CONSTRAINT documents_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES profiles (id)
        );
        
        -- Enable RLS
        ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
        
        -- Create RLS policies
        CREATE POLICY "Users can view their own documents" ON public.documents
          FOR SELECT USING (auth.uid() = owner_id);
          
        CREATE POLICY "Users can insert their own documents" ON public.documents
          FOR INSERT WITH CHECK (auth.uid() = owner_id);
          
        CREATE POLICY "Users can update their own documents" ON public.documents
          FOR UPDATE USING (auth.uid() = owner_id);
          
        CREATE POLICY "Users can delete their own documents" ON public.documents
          FOR DELETE USING (auth.uid() = owner_id);
      `;
      
      // We can't execute DDL directly through Supabase client, so let's try a different approach
      console.log('⚠️  Cannot execute DDL through client. Please run this SQL manually in Supabase SQL Editor:');
      console.log('');
      console.log(createTableSQL);
      console.log('');
      
    } else {
      console.log('✅ Documents table exists, checking columns...');
      
      if (existingData && existingData.length > 0) {
        const columns = Object.keys(existingData[0]);
        console.log('📄 Current columns:', columns);
        
        const requiredColumns = ['file_name', 'file_path', 'file_size', 'file_type', 'is_verified', 'metadata'];
        const missingColumns = requiredColumns.filter(col => !columns.includes(col));
        
        if (missingColumns.length > 0) {
          console.log('❌ Missing columns:', missingColumns);
          console.log('');
          console.log('⚠️  Please run this SQL manually in Supabase SQL Editor:');
          console.log('');
          
          missingColumns.forEach(col => {
            let columnDef;
            switch(col) {
              case 'file_name':
                columnDef = 'ALTER TABLE public.documents ADD COLUMN file_name text;';
                break;
              case 'file_path':
                columnDef = 'ALTER TABLE public.documents ADD COLUMN file_path text;';
                break;
              case 'file_size':
                columnDef = 'ALTER TABLE public.documents ADD COLUMN file_size integer;';
                break;
              case 'file_type':
                columnDef = 'ALTER TABLE public.documents ADD COLUMN file_type text;';
                break;
              case 'is_verified':
                columnDef = 'ALTER TABLE public.documents ADD COLUMN is_verified boolean DEFAULT false;';
                break;
              case 'metadata':
                columnDef = 'ALTER TABLE public.documents ADD COLUMN metadata jsonb;';
                break;
            }
            console.log(columnDef);
          });
          
          console.log('');
          console.log('-- After adding columns, update existing records:');
          console.log("UPDATE public.documents SET file_name = 'unknown_file' WHERE file_name IS NULL;");
          console.log("UPDATE public.documents SET file_path = CONCAT('documents/', owner_id, '/unknown/', id, '.pdf') WHERE file_path IS NULL;");
          console.log('');
        } else {
          console.log('✅ All required columns exist');
        }
      } else {
        console.log('📄 Table is empty, testing insert...');
        
        // Try a test insert to see what happens
        const { data: testData, error: testError } = await supabase
          .from('documents')
          .insert({
            owner_id: '00000000-0000-0000-0000-000000000000',
            document_type: 'test'
          })
          .select();
        
        if (testError) {
          console.log('❌ Test insert error:', testError.message);
          
          if (testError.message.includes('file_name')) {
            console.log('');
            console.log('⚠️  Missing file_name column. Please run this SQL manually in Supabase SQL Editor:');
            console.log('ALTER TABLE public.documents ADD COLUMN file_name text;');
            console.log('ALTER TABLE public.documents ADD COLUMN file_path text;');
            console.log('ALTER TABLE public.documents ADD COLUMN file_size integer;');
            console.log('ALTER TABLE public.documents ADD COLUMN file_type text;');
            console.log('ALTER TABLE public.documents ADD COLUMN is_verified boolean DEFAULT false;');
            console.log('ALTER TABLE public.documents ADD COLUMN metadata jsonb;');
            console.log('');
          }
        } else {
          console.log('✅ Test insert successful');
          // Clean up
          if (testData && testData[0]) {
            await supabase.from('documents').delete().eq('id', testData[0].id);
          }
        }
      }
    }
    
  } catch (err) {
    console.error('💥 Unexpected error:', err.message);
  }
}

createDocumentsTable();
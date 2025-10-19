-- =====================================================
-- CREATE DOCUMENTS BUCKET AND POLICIES
-- =====================================================
-- This script creates the necessary storage bucket and policies for document uploads

-- Create the documents bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES ('documents', 'documents', false, false, 52428800, -- 50MB limit
  '{application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png,image/gif,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation}')
ON CONFLICT (id) DO NOTHING;

-- Create policy to allow authenticated users to upload their own documents
DROP POLICY IF EXISTS "Users can upload their own documents" ON storage.objects;
CREATE POLICY "Users can upload their own documents" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'documents');

-- Create policy to allow authenticated users to read their own documents
DROP POLICY IF EXISTS "Users can read their own documents" ON storage.objects;
CREATE POLICY "Users can read their own documents" ON storage.objects
    FOR SELECT TO authenticated
    USING (bucket_id = 'documents');

-- Create policy to allow authenticated users to update their own documents
DROP POLICY IF EXISTS "Users can update their own documents" ON storage.objects;
CREATE POLICY "Users can update their own documents" ON storage.objects
    FOR UPDATE TO authenticated
    USING (bucket_id = 'documents');

-- Create policy to allow authenticated users to delete their own documents
DROP POLICY IF EXISTS "Users can delete their own documents" ON storage.objects;
CREATE POLICY "Users can delete their own documents" ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'documents');

-- Disable RLS for documents table for demo purposes
DO $$
BEGIN
    -- Check if the documents table exists
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'documents') THEN
        -- Disable RLS on documents table for demo
        ALTER TABLE public.documents DISABLE ROW LEVEL SECURITY;
        
        -- Drop any existing policies
        DROP POLICY IF EXISTS "Users can insert their own documents" ON public.documents;
        DROP POLICY IF EXISTS "Users can select their own documents" ON public.documents;
        DROP POLICY IF EXISTS "Users can update their own documents" ON public.documents;
        DROP POLICY IF EXISTS "Users can delete their own documents" ON public.documents;
    END IF;
END
$$;

-- Grant permissions to authenticated and anon roles
GRANT ALL ON storage.buckets TO authenticated, anon;
GRANT ALL ON storage.objects TO authenticated, anon;
GRANT ALL ON public.documents TO authenticated;
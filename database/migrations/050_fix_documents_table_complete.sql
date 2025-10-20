-- Complete Documents Table Fix
-- This migration ensures the documents table has all required columns for the document management system

-- Drop the existing table if it's incomplete and recreate it properly
DROP TABLE IF EXISTS public.documents CASCADE;

-- Create the documents table with all required columns
CREATE TABLE public.documents (
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
  CONSTRAINT documents_pkey PRIMARY KEY (id)
);

-- Add foreign key constraint to profiles table
ALTER TABLE public.documents 
ADD CONSTRAINT documents_owner_id_fkey 
FOREIGN KEY (owner_id) REFERENCES public.profiles (id) ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX idx_documents_owner_id ON public.documents (owner_id);
CREATE INDEX idx_documents_document_type ON public.documents (document_type);
CREATE INDEX idx_documents_created_at ON public.documents (created_at);
CREATE INDEX idx_documents_is_verified ON public.documents (is_verified);

-- Enable Row Level Security
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can insert their own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can update their own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can delete their own documents" ON public.documents;
DROP POLICY IF EXISTS "Admins can view all documents" ON public.documents;
DROP POLICY IF EXISTS "Admins can update all documents" ON public.documents;

-- Create RLS policies for users
CREATE POLICY "Users can view their own documents" ON public.documents
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own documents" ON public.documents
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own documents" ON public.documents
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own documents" ON public.documents
  FOR DELETE USING (auth.uid() = owner_id);

-- Create RLS policies for admins (assuming admin role exists)
CREATE POLICY "Admins can view all documents" ON public.documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND user_type = 'admin'
    )
  );

CREATE POLICY "Admins can update all documents" ON public.documents
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND user_type = 'admin'
    )
  );

-- Add helpful comments
COMMENT ON TABLE public.documents IS 'Document management table for storing user uploaded files';
COMMENT ON COLUMN public.documents.id IS 'Unique identifier for the document';
COMMENT ON COLUMN public.documents.owner_id IS 'Reference to the user who owns this document';
COMMENT ON COLUMN public.documents.document_type IS 'Type of document (resume, cover_letter, portfolio, etc.)';
COMMENT ON COLUMN public.documents.file_name IS 'Original filename for display purposes';
COMMENT ON COLUMN public.documents.file_path IS 'S3 storage path for the document';
COMMENT ON COLUMN public.documents.file_size IS 'File size in bytes';
COMMENT ON COLUMN public.documents.file_type IS 'MIME type of the file';
COMMENT ON COLUMN public.documents.is_verified IS 'Whether the document has been verified by admin';
COMMENT ON COLUMN public.documents.verify_notes IS 'Admin notes about document verification';
COMMENT ON COLUMN public.documents.metadata IS 'Additional document metadata as JSON';

-- Grant necessary permissions
GRANT ALL ON public.documents TO authenticated;
GRANT ALL ON public.documents TO service_role;

-- Refresh the PostgREST schema cache
NOTIFY pgrst, 'reload schema';
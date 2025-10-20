-- Migration: Add missing columns to documents table
-- This adds file_name and file_path columns that are required for document management

-- Add file_name column (required for UI display)
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS file_name text;

-- Add file_path column (required for S3 storage path)
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS file_path text;

-- Add file_size column if missing
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS file_size integer;

-- Add file_type column if missing
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS file_type text;

-- Add is_verified column if missing
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false;

-- Add verify_notes column if missing
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS verify_notes text;

-- Add metadata column if missing
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS metadata jsonb;

-- Add timestamps if missing
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();

ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Update existing records to have file_name from metadata if available
UPDATE public.documents 
SET file_name = COALESCE(
  metadata->>'original_name',
  metadata->>'file_name',
  'unknown_file'
)
WHERE file_name IS NULL;

-- Update existing records to have file_path if missing (construct from id)
UPDATE public.documents 
SET file_path = CONCAT('documents/', owner_id, '/unknown/', id, '.pdf')
WHERE file_path IS NULL;

-- Make file_name and file_path NOT NULL after populating existing data
ALTER TABLE public.documents 
ALTER COLUMN file_name SET NOT NULL;

ALTER TABLE public.documents 
ALTER COLUMN file_path SET NOT NULL;

-- Add helpful comments
COMMENT ON COLUMN public.documents.file_name IS 'Original filename for display purposes';
COMMENT ON COLUMN public.documents.file_path IS 'S3 storage path for the document';
COMMENT ON COLUMN public.documents.file_size IS 'File size in bytes';
COMMENT ON COLUMN public.documents.file_type IS 'MIME type of the file';
COMMENT ON COLUMN public.documents.is_verified IS 'Whether the document has been verified by admin';
COMMENT ON COLUMN public.documents.verify_notes IS 'Admin notes about document verification';
COMMENT ON COLUMN public.documents.metadata IS 'Additional document metadata as JSON';

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';
-- Add response column to job_applications_v2 table
-- This column will store JSON data for interview details and invitation messages

ALTER TABLE public.job_applications_v2 
ADD COLUMN response jsonb NULL DEFAULT NULL;

-- Add comment to document the column purpose
COMMENT ON COLUMN public.job_applications_v2.response IS 'JSON data containing interview details, invitation messages, or other response-related information';

-- Create index for better query performance on response column
CREATE INDEX IF NOT EXISTS job_applications_v2_response_idx 
ON public.job_applications_v2 USING gin (response) 
TABLESPACE pg_default;

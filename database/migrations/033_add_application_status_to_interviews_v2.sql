-- Add application_status field to interviews_v2 table to track candidate application status
-- This allows us to distinguish between interview status and application status

-- Add application_status column to interviews_v2
ALTER TABLE public.interviews_v2 
ADD COLUMN application_status text DEFAULT 'interviewing' 
CHECK (application_status IN ('interviewing', 'offered', 'hired', 'rejected', 'withdrawn'));

-- Add comment explaining the field
COMMENT ON COLUMN public.interviews_v2.application_status IS 
'Application status for the candidate: interviewing, offered, hired, rejected, withdrawn. Separate from interview status.';

-- Update existing records to have 'interviewing' as default application status
UPDATE public.interviews_v2 
SET application_status = 'interviewing' 
WHERE application_status IS NULL;

-- Add index for better performance on application_status queries
CREATE INDEX IF NOT EXISTS interviews_v2_application_status_idx 
ON public.interviews_v2 (application_status);

-- Add comment to the table explaining the dual status system
COMMENT ON TABLE public.interviews_v2 IS 
'Interview management with dual status tracking: status (interview progress) and application_status (candidate application progress)';

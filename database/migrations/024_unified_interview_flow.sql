-- Unified interview flow: Employers can directly invite candidates for interviews
-- No application required - just direct interview invitations

-- Make application_id nullable for direct invitations
ALTER TABLE public.interviews_v2 
ALTER COLUMN application_id DROP NOT NULL;

-- Add constraint: either application_id OR seeker_id must be provided
-- This supports both direct invitations and application-linked interviews
ALTER TABLE public.interviews_v2 
ADD CONSTRAINT interviews_v2_candidate_required_check 
CHECK (
    (application_id IS NOT NULL) OR (seeker_id IS NOT NULL)
);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS interviews_v2_seeker_id_idx 
ON public.interviews_v2 (seeker_id);

-- Add comment explaining the unified flow
COMMENT ON TABLE public.interviews_v2 IS 
'Unified interview system: Employers can directly invite candidates (seeker_id only) or schedule interviews for existing applications (application_id + seeker_id)';

-- Update RLS policies to support direct invitations
DROP POLICY IF EXISTS "Employers can create interviews for their company" ON public.interviews_v2;

CREATE POLICY "Employers can create interviews for their company" ON public.interviews_v2
    FOR INSERT
    TO authenticated
    WITH CHECK (
        -- Must be an employer
        EXISTS (
            SELECT 1 FROM employer_profiles
            WHERE employer_profiles.id = auth.uid()
        )
        AND (
            -- Either: Direct invitation (seeker_id only)
            (seeker_id IS NOT NULL AND application_id IS NULL)
            OR
            -- Or: Application-linked interview (both application_id and seeker_id)
            (application_id IS NOT NULL AND seeker_id IS NOT NULL)
        )
        AND interviewer_id = auth.uid()
    );

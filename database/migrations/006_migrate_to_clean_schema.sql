-- =====================================================
-- MIGRATION SCRIPT: OLD SYSTEM TO CLEAN SCHEMA
-- =====================================================
-- This script helps migrate from the old confusing system
-- to the new clean database design

-- =====================================================
-- 1. BACKUP EXISTING DATA (SAFETY FIRST)
-- =====================================================

-- Create backup tables
CREATE TABLE IF NOT EXISTS backup_job_applications AS SELECT * FROM public.job_applications;
CREATE TABLE IF NOT EXISTS backup_interviews AS SELECT * FROM public.interviews;
CREATE TABLE IF NOT EXISTS backup_candidate_invitations AS SELECT * FROM public.candidate_invitations;

-- =====================================================
-- 2. MIGRATE CANDIDATE INVITATIONS TO JOB APPLICATIONS
-- =====================================================

-- Insert invitations as applications with 'invited' status
INSERT INTO public.job_applications (
  id,
  job_id,
  applicant_id,
  status,
  application_date,
  created_at,
  updated_at
)
SELECT 
  uuid_generate_v4() as id,
  ci.job_id,
  ci.candidate_id as applicant_id,
  CASE 
    WHEN ci.status = 'invited' THEN 'invited'
    WHEN ci.status = 'accepted' THEN 'accepted'
    WHEN ci.status = 'declined' THEN 'rejected'
    ELSE 'invited'
  END as status,
  ci.created_at as application_date,
  ci.created_at,
  ci.created_at as updated_at
FROM backup_candidate_invitations ci
WHERE NOT EXISTS (
  SELECT 1 FROM public.job_applications ja 
  WHERE ja.job_id = ci.job_id 
  AND ja.applicant_id = ci.candidate_id
);

-- =====================================================
-- 3. CREATE APPLICATION EVENTS FOR EXISTING DATA
-- =====================================================

-- Create events for existing applications
INSERT INTO public.application_events (
  id,
  application_id,
  event_type,
  event_data,
  created_at
)
SELECT 
  uuid_generate_v4() as id,
  ja.id as application_id,
  'applied' as event_type,
  jsonb_build_object(
    'original_status', ja.status,
    'migration_note', 'Migrated from old system'
  ) as event_data,
  ja.application_date as created_at
FROM public.job_applications ja
WHERE ja.status = 'applied';

-- Create events for invited applications
INSERT INTO public.application_events (
  id,
  application_id,
  event_type,
  event_data,
  created_at
)
SELECT 
  uuid_generate_v4() as id,
  ja.id as application_id,
  'invited' as event_type,
  jsonb_build_object(
    'original_status', ja.status,
    'migration_note', 'Migrated from candidate_invitations'
  ) as event_data,
  ja.application_date as created_at
FROM public.job_applications ja
WHERE ja.status = 'invited';

-- Create events for accepted invitations
INSERT INTO public.application_events (
  id,
  application_id,
  event_type,
  event_data,
  created_at
)
SELECT 
  uuid_generate_v4() as id,
  ja.id as application_id,
  'accepted' as event_type,
  jsonb_build_object(
    'original_status', ja.status,
    'migration_note', 'Migrated from candidate_invitations'
  ) as event_data,
  ja.updated_at as created_at
FROM public.job_applications ja
WHERE ja.status = 'accepted';

-- =====================================================
-- 4. MIGRATE INTERVIEWS
-- =====================================================

-- Update existing interviews to link to applications
UPDATE public.interviews 
SET application_id = (
  SELECT ja.id 
  FROM public.job_applications ja 
  WHERE ja.job_id = interviews.job_id 
  AND ja.applicant_id = interviews.seeker_id
  LIMIT 1
)
WHERE application_id IS NULL;

-- Create events for scheduled interviews
INSERT INTO public.application_events (
  id,
  application_id,
  event_type,
  event_data,
  created_at
)
SELECT 
  uuid_generate_v4() as id,
  i.application_id,
  'interview_scheduled' as event_type,
  jsonb_build_object(
    'interview_id', i.id,
    'interview_type', i.interview_type,
    'interview_date', i.interview_date,
    'migration_note', 'Migrated from old interviews table'
  ) as event_data,
  i.created_at
FROM public.interviews i
WHERE i.application_id IS NOT NULL;

-- =====================================================
-- 5. UPDATE APPLICATION STATUSES BASED ON INTERVIEWS
-- =====================================================

-- Update applications with interviews to 'interviewing' status
UPDATE public.job_applications 
SET status = 'interviewing'
WHERE id IN (
  SELECT DISTINCT application_id 
  FROM public.interviews 
  WHERE application_id IS NOT NULL
  AND status IN ('scheduled', 'in_progress', 'completed')
);

-- Update applications with completed interviews to 'reviewing'
UPDATE public.job_applications 
SET status = 'reviewing'
WHERE id IN (
  SELECT DISTINCT application_id 
  FROM public.interviews 
  WHERE application_id IS NOT NULL
  AND status = 'completed'
);

-- =====================================================
-- 6. CREATE CONVERSATIONS FOR EXISTING MESSAGING
-- =====================================================

-- Create conversations for applications that have messaging
INSERT INTO public.conversations (
  id,
  application_id,
  title,
  created_at,
  updated_at
)
SELECT 
  uuid_generate_v4() as id,
  ja.id as application_id,
  'Application Discussion' as title,
  ja.application_date as created_at,
  ja.updated_at
FROM public.job_applications ja
WHERE EXISTS (
  SELECT 1 FROM public.messages m
  JOIN public.conversations c ON m.conversation_id = c.id
  WHERE c.application_id = ja.id
);

-- =====================================================
-- 7. CLEAN UP OLD TABLES (OPTIONAL - COMMENT OUT FOR SAFETY)
-- =====================================================

-- WARNING: Only run these after confirming migration is successful
-- Uncomment the lines below when ready to clean up

-- DROP TABLE IF EXISTS public.candidate_invitations;
-- DROP TABLE IF EXISTS backup_job_applications;
-- DROP TABLE IF EXISTS backup_interviews;
-- DROP TABLE IF EXISTS backup_candidate_invitations;

-- =====================================================
-- 8. VERIFICATION QUERIES
-- =====================================================

-- Check migration results
SELECT 
  'Applications migrated' as table_name,
  COUNT(*) as count
FROM public.job_applications
UNION ALL
SELECT 
  'Application events created' as table_name,
  COUNT(*) as count
FROM public.application_events
UNION ALL
SELECT 
  'Interviews linked' as table_name,
  COUNT(*) as count
FROM public.interviews
WHERE application_id IS NOT NULL
UNION ALL
SELECT 
  'Conversations created' as table_name,
  COUNT(*) as count
FROM public.conversations;

-- Check status distribution
SELECT 
  status,
  COUNT(*) as count
FROM public.job_applications
GROUP BY status
ORDER BY count DESC;

-- Check event distribution
SELECT 
  event_type,
  COUNT(*) as count
FROM public.application_events
GROUP BY event_type
ORDER BY count DESC;

-- =====================================================
-- 9. USEFUL QUERIES FOR TESTING
-- =====================================================

-- Get application timeline for a specific application
-- SELECT 
--   ae.event_type,
--   ae.event_data,
--   ae.created_at,
--   p.full_name as created_by_name
-- FROM public.application_events ae
-- LEFT JOIN public.profiles p ON ae.created_by = p.id
-- WHERE ae.application_id = 'your-application-id'
-- ORDER BY ae.created_at ASC;

-- Get all applications with their current status and timeline
-- SELECT 
--   ad.*,
--   COUNT(ae.id) as event_count
-- FROM application_details ad
-- LEFT JOIN public.application_events ae ON ad.id = ae.application_id
-- GROUP BY ad.id
-- ORDER BY ad.application_date DESC;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Final verification message
DO $$
BEGIN
  RAISE NOTICE 'Migration completed successfully!';
  RAISE NOTICE 'Please verify the data before dropping backup tables.';
  RAISE NOTICE 'Run the verification queries above to check results.';
END $$;


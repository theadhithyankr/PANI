-- Database Check Scripts for Interview Data
-- Run these queries in your Supabase SQL editor or database client

-- 1. Check if interviews_v2 table exists and has any data
SELECT 
    COUNT(*) as total_interviews,
    COUNT(CASE WHEN seeker_id IS NOT NULL THEN 1 END) as interviews_with_seeker_id,
    COUNT(CASE WHEN job_id IS NOT NULL THEN 1 END) as interviews_with_job_id,
    COUNT(CASE WHEN application_id IS NOT NULL THEN 1 END) as interviews_with_application_id
FROM interviews_v2;

-- 2. Check table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'interviews_v2' 
ORDER BY ordinal_position;

-- 3. Sample data from interviews_v2 (first 10 records)
SELECT 
    id,
    interview_type,
    interview_date,
    status,
    seeker_id,
    job_id,
    application_id,
    interviewer_id,
    created_at
FROM interviews_v2 
ORDER BY created_at DESC 
LIMIT 10;

-- 4. Check for specific seeker and job combinations
-- Replace 'YOUR_SEEKER_ID' and 'YOUR_JOB_ID' with actual values
SELECT 
    i.*,
    j.title as job_title,
    c.name as company_name
FROM interviews_v2 i
LEFT JOIN jobs j ON i.job_id = j.id
LEFT JOIN companies c ON j.company_id = c.id
WHERE i.seeker_id = 'YOUR_SEEKER_ID' 
  AND i.job_id = 'YOUR_JOB_ID';

-- 5. Check job_applications_v2 table for invitation data
SELECT 
    id,
    seeker_id,
    job_id,
    status,
    is_invitation,
    created_at
FROM job_applications_v2 
WHERE seeker_id = 'YOUR_SEEKER_ID' 
  AND job_id = 'YOUR_JOB_ID';

-- 6. Check if there are any interviews without proper foreign key relationships
SELECT 
    i.id,
    i.seeker_id,
    i.job_id,
    i.application_id,
    CASE 
        WHEN i.seeker_id IS NULL THEN 'Missing seeker_id'
        WHEN i.job_id IS NULL THEN 'Missing job_id'
        WHEN i.application_id IS NULL AND i.seeker_id IS NOT NULL AND i.job_id IS NOT NULL THEN 'Invitation flow (no application_id)'
        ELSE 'Complete data'
    END as data_status
FROM interviews_v2 i
ORDER BY i.created_at DESC;

-- 7. Check RLS policies on interviews_v2
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'interviews_v2';

-- 8. Test query similar to what the application uses (invitation flow)
-- Replace 'YOUR_SEEKER_ID' and 'YOUR_JOB_ID' with actual values
SELECT 
    i.id,
    i.interview_type,
    i.interview_format,
    i.location,
    i.interview_date,
    i.duration_minutes,
    i.notes,
    i.status,
    i.feedback,
    i.rating,
    i.meeting_link,
    i.agenda,
    i.reminder_sent,
    i.seeker_id,
    i.job_id,
    interviewer.id as interviewer_id,
    interviewer.full_name as interviewer_name,
    j.id as job_id,
    j.title as job_title,
    c.id as company_id,
    c.name as company_name,
    c.logo_url as company_logo
FROM interviews_v2 i
LEFT JOIN profiles interviewer ON i.interviewer_id = interviewer.id
LEFT JOIN jobs j ON i.job_id = j.id
LEFT JOIN companies c ON j.company_id = c.id
WHERE i.seeker_id = 'YOUR_SEEKER_ID' 
  AND i.job_id = 'YOUR_JOB_ID'
ORDER BY i.interview_date ASC;

-- 9. Test query similar to what the application uses (regular application flow)
-- Replace 'YOUR_APPLICATION_ID' with actual value
SELECT 
    i.id,
    i.interview_type,
    i.interview_format,
    i.location,
    i.interview_date,
    i.duration_minutes,
    i.notes,
    i.status,
    i.feedback,
    i.rating,
    i.meeting_link,
    i.agenda,
    i.reminder_sent,
    i.application_id,
    interviewer.id as interviewer_id,
    interviewer.full_name as interviewer_name,
    app.id as application_id,
    j.id as job_id,
    j.title as job_title,
    c.id as company_id,
    c.name as company_name,
    c.logo_url as company_logo
FROM interviews_v2 i
LEFT JOIN profiles interviewer ON i.interviewer_id = interviewer.id
LEFT JOIN job_applications_v2 app ON i.application_id = app.id
LEFT JOIN jobs j ON app.job_id = j.id
LEFT JOIN companies c ON j.company_id = c.id
WHERE i.application_id = 'YOUR_APPLICATION_ID'
ORDER BY i.interview_date ASC;

-- 10. Check for any data inconsistencies
SELECT 
    'interviews_v2' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN seeker_id IS NOT NULL AND job_id IS NOT NULL AND application_id IS NULL THEN 1 END) as invitation_interviews,
    COUNT(CASE WHEN application_id IS NOT NULL THEN 1 END) as application_interviews,
    COUNT(CASE WHEN seeker_id IS NULL OR job_id IS NULL THEN 1 END) as incomplete_records
FROM interviews_v2

UNION ALL

SELECT 
    'job_applications_v2' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN is_invitation = true THEN 1 END) as invitations,
    COUNT(CASE WHEN is_invitation = false OR is_invitation IS NULL THEN 1 END) as regular_applications,
    0 as incomplete_records
FROM job_applications_v2;
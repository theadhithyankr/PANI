# Clean Database Design for Velai v3

## Overview

This document outlines the new, simplified database design that eliminates confusion between interviews, invitations, and applications. The new design follows a **single source of truth** principle and provides a clean, scalable foundation for long-term growth.

## Key Principles

### 1. **Single Source of Truth**
- `job_applications` is the main table that tracks ALL interactions
- No more confusion between 3 different tables
- Clear status progression: `applied` → `invited` → `accepted` → `interviewing` → `offered` → `hired`

### 2. **Event-Driven Architecture**
- `application_events` table tracks the complete timeline
- Every status change is recorded with timestamp and actor
- Full audit trail for compliance and debugging

### 3. **Separation of Concerns**
- `interviews` table only for actual scheduled interviews
- `job_offers` table for offers and negotiations
- `conversations` table for messaging
- Each table has a single, clear purpose

## Core Tables

### 1. **job_applications** (Main Table)
```sql
-- Single source of truth for all job applications
CREATE TABLE job_applications (
  id uuid PRIMARY KEY,
  job_id uuid NOT NULL,
  applicant_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'applied', -- Clear status progression
  cover_note text,
  ai_match_score numeric,
  -- ... other fields
  UNIQUE(job_id, applicant_id) -- Prevent duplicate applications
);
```

**Status Flow:**
```
applied → invited → accepted → reviewing → shortlisted → interviewing → offered → hired
   ↓         ↓         ↓          ↓           ↓            ↓          ↓        ↓
rejected  rejected  rejected   rejected    rejected     rejected   rejected  (end)
   ↓         ↓         ↓          ↓           ↓            ↓          ↓
withdrawn withdrawn withdrawn  withdrawn   withdrawn    withdrawn  withdrawn
```

### 2. **application_events** (Timeline)
```sql
-- Complete audit trail of what happened
CREATE TABLE application_events (
  id uuid PRIMARY KEY,
  application_id uuid NOT NULL,
  event_type text NOT NULL, -- applied, invited, accepted, etc.
  event_data jsonb, -- Additional data for the event
  created_by uuid, -- Who triggered the event
  created_at timestamp with time zone DEFAULT now()
);
```

### 3. **interviews** (Scheduled Interviews Only)
```sql
-- Only for actual scheduled interviews
CREATE TABLE interviews (
  id uuid PRIMARY KEY,
  application_id uuid NOT NULL, -- Links to job_applications
  interview_type text NOT NULL, -- 1st_interview, technical, hr_interview, final
  interview_format text NOT NULL, -- in_person, video, phone
  interview_date timestamp with time zone NOT NULL,
  interviewer_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'scheduled',
  -- ... other fields
);
```

### 4. **job_offers** (Offers & Negotiations)
```sql
-- Job offers and salary negotiations
CREATE TABLE job_offers (
  id uuid PRIMARY KEY,
  application_id uuid NOT NULL,
  offer_data jsonb NOT NULL, -- salary, benefits, start_date, etc.
  status text NOT NULL DEFAULT 'pending',
  expires_at timestamp with time zone,
  -- ... other fields
);
```

## Benefits of New Design

### ✅ **Eliminates Confusion**
- No more wondering which table to use
- Clear data flow and relationships
- Single source of truth for application status

### ✅ **Better Performance**
- Optimized indexes for common queries
- Efficient joins with proper foreign keys
- No redundant data storage

### ✅ **Scalable Architecture**
- Easy to add new features
- Clear separation of concerns
- Event-driven design for analytics

### ✅ **Developer Friendly**
- Intuitive table names and relationships
- Clear status progression
- Comprehensive documentation

## Migration Strategy

### Phase 1: Create New Tables
1. Run the migration script to create all new tables
2. Set up proper indexes and RLS policies
3. Test with sample data

### Phase 2: Data Migration
1. Migrate existing data from old tables to new structure
2. Map old statuses to new status flow
3. Create application_events for historical data

### Phase 3: Update Application Code
1. Update Zustand stores to use new table structure
2. Modify API calls to use new schema
3. Update UI components to reflect new data model

### Phase 4: Cleanup
1. Remove old tables after successful migration
2. Update documentation
3. Train team on new structure

## Common Queries

### Get All Applications for a Job
```sql
SELECT * FROM application_details 
WHERE job_id = 'job-uuid' 
ORDER BY application_date DESC;
```

### Get Application Timeline
```sql
SELECT * FROM application_events 
WHERE application_id = 'application-uuid' 
ORDER BY created_at ASC;
```

### Get Upcoming Interviews
```sql
SELECT * FROM interview_details 
WHERE interview_date > NOW() 
AND status = 'scheduled'
ORDER BY interview_date ASC;
```

### Get Applications by Status
```sql
SELECT * FROM application_details 
WHERE status = 'interviewing'
ORDER BY application_date DESC;
```

## Status Management

### Application Statuses
- **`applied`** - Initial application submitted
- **`invited`** - Employer invited candidate
- **`accepted`** - Candidate accepted invitation
- **`reviewing`** - Under employer review
- **`shortlisted`** - Shortlisted for interview
- **`interviewing`** - In interview process
- **`offered`** - Job offer made
- **`hired`** - Successfully hired
- **`rejected`** - Rejected at any stage
- **`withdrawn`** - Candidate withdrew
- **`expired`** - Application expired

### Interview Statuses
- **`scheduled`** - Interview scheduled
- **`in_progress`** - Interview happening now
- **`completed`** - Interview finished
- **`cancelled`** - Interview cancelled
- **`rescheduled`** - Interview rescheduled

### Offer Statuses
- **`pending`** - Offer waiting for response
- **`accepted`** - Offer accepted
- **`declined`** - Offer declined
- **`expired`** - Offer expired
- **`withdrawn`** - Offer withdrawn

## Best Practices

### 1. **Always Update Status Through Events**
```javascript
// Good: Update status and create event
await supabase.from('job_applications').update({ status: 'interviewing' });
await supabase.from('application_events').insert({
  application_id: appId,
  event_type: 'interview_scheduled',
  created_by: userId
});
```

### 2. **Use Views for Complex Queries**
```javascript
// Use application_details view instead of complex joins
const { data } = await supabase.from('application_details').select('*');
```

### 3. **Leverage RLS for Security**
- All tables have proper RLS policies
- Users can only see their own data
- Employers can see applications for their jobs

### 4. **Monitor Performance**
- Use indexes for common query patterns
- Monitor slow queries
- Optimize based on usage patterns

## Future Enhancements

### 1. **Analytics & Reporting**
- Use application_events for detailed analytics
- Track conversion rates at each stage
- Identify bottlenecks in hiring process

### 2. **Automation**
- Auto-update status based on events
- Send notifications on status changes
- Trigger workflows based on status

### 3. **Integration**
- Webhook support for status changes
- API endpoints for external systems
- Real-time updates via Supabase subscriptions

## Conclusion

This new database design provides a solid foundation for Velai v3 that is:
- **Clear and intuitive** for developers
- **Scalable** for future growth
- **Performant** with proper indexing
- **Secure** with RLS policies
- **Maintainable** with clear relationships

The single source of truth approach eliminates confusion and makes the system much easier to understand and maintain long-term.










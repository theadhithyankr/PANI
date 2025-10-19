# Database Schema Diagram

## Clean Database Structure for Velai v3

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                CORE USER TABLES                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│  profiles (auth.users extension)                                               │
│  ├── job_seeker_profiles (detailed candidate info)                             │
│  └── employer_profiles (detailed employer info)                                │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            COMPANY & ORGANIZATION                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│  companies                                                                      │
│  ├── team_members (company employees)                                          │
│  └── company_photos                                                            │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              JOBS & APPLICATIONS                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│  jobs (job postings)                                                           │
│  └── job_applications (SINGLE SOURCE OF TRUTH)                                │
│      ├── application_events (timeline/audit trail)                            │
│      ├── interviews (scheduled interviews only)                               │
│      ├── job_offers (offers & negotiations)                                   │
│      └── conversations (messaging)                                             │
│          └── messages                                                          │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              DOCUMENTS & FILES                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│  documents (user uploads)                                                      │
│  └── resume_data (parsed resume info)                                          │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              AI & ANALYTICS                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ai_conversations                                                              │
│  support_tiers                                                                 │
│  transactions                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Key Relationships

### 1. **User Flow**
```
User (profiles) → Job Seeker Profile OR Employer Profile
                ↓
            Company (if employer)
                ↓
            Jobs → Applications → Events/Interviews/Offers
```

### 2. **Application Flow**
```
job_applications (main table)
├── application_events (what happened when)
├── interviews (scheduled meetings)
├── job_offers (salary negotiations)
└── conversations (messaging)
```

### 3. **Status Progression**
```
applied → invited → accepted → reviewing → shortlisted → interviewing → offered → hired
   ↓         ↓         ↓          ↓           ↓            ↓          ↓        ↓
rejected  rejected  rejected   rejected    rejected     rejected   rejected  (end)
   ↓         ↓         ↓          ↓           ↓            ↓          ↓
withdrawn withdrawn withdrawn  withdrawn   withdrawn    withdrawn  withdrawn
```

## Benefits of This Structure

### ✅ **Single Source of Truth**
- `job_applications` is the main table
- No confusion between multiple tables
- Clear data flow and relationships

### ✅ **Event-Driven Architecture**
- `application_events` tracks everything
- Complete audit trail
- Easy to build analytics and reports

### ✅ **Separation of Concerns**
- Each table has a single purpose
- Easy to understand and maintain
- Scalable for future features

### ✅ **Performance Optimized**
- Proper indexes on common queries
- Efficient joins with foreign keys
- No redundant data storage

## Common Query Patterns

### Get Application Details
```sql
SELECT * FROM application_details 
WHERE job_id = 'job-uuid';
```

### Get Application Timeline
```sql
SELECT * FROM application_events 
WHERE application_id = 'app-uuid' 
ORDER BY created_at ASC;
```

### Get Upcoming Interviews
```sql
SELECT * FROM interview_details 
WHERE interview_date > NOW() 
AND status = 'scheduled';
```

## Migration Strategy

1. **Create new tables** with clean structure
2. **Migrate existing data** from old tables
3. **Create application_events** for historical data
4. **Update application code** to use new structure
5. **Remove old tables** after successful migration

This design eliminates the confusion between interviews, invitations, and applications while providing a solid foundation for long-term growth.










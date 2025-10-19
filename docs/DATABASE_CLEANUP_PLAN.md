# Database Cleanup Plan

## Overview
This document outlines the cleanup of unused and older tables from the Velai v3 database after the successful migration to the v2 schema.

## Tables to Remove

### ✅ **Safe to Remove (Definitely Unused)**

#### 1. Backup Tables
- `backup_candidate_invitations` - Created during migration
- `backup_conversations` - Created during migration  
- `backup_interviews` - Created during migration
- `backup_job_applications` - Created during migration
- `backup_messages` - Created during migration

#### 2. Old Tables (Replaced by v2 versions)
- `candidate_invitations` - Replaced by `job_applications_v2`
- `ai_conversations` - Not used in frontend code

#### 3. Old Views
- `job_applications` - Replaced by `job_applications_v2`
- `interviews` - Replaced by `interviews_v2`
- `conversations` - Replaced by `conversations_v2`
- `messages` - Replaced by `messages_v2`

### ⚠️ **Potentially Unused (Need Verification)**

These tables might be safe to remove, but should be verified first:

- `candidate_documents` - Only used in admin cleanup code
- `interview_notifications` - Only used in admin cleanup code  
- `application_events` - Audit trail table, might be needed

## Migration Scripts

### 1. Safe Cleanup (Recommended)
**File:** `database/migrations/019_cleanup_unused_tables_safe.sql`

This script removes only the definitely safe tables:
- All backup tables
- `candidate_invitations` 
- `ai_conversations`
- Old views

### 2. Full Cleanup (Advanced)
**File:** `database/migrations/019_cleanup_unused_tables.sql`

This script removes all potentially unused tables including:
- `candidate_documents`
- `interview_notifications`
- `application_events`

## Frontend Changes Made

1. **Removed unused hook:**
   - `src/hooks/common/useSupabaseConversations.js` - Deleted

2. **Updated admin cleanup:**
   - `src/hooks/admin/useUserManagement.js` - Removed references to deleted tables

## Benefits

1. **Reduced Database Size** - Removes unnecessary data and tables
2. **Improved Performance** - Fewer tables to manage and query
3. **Cleaner Schema** - Only active tables remain
4. **Reduced Maintenance** - Less complexity in database management

## Verification

After running the cleanup script, verify:

1. **No broken references** - Check that all frontend code still works
2. **No missing data** - Ensure no important data was removed
3. **Performance improvement** - Monitor query performance
4. **Backup integrity** - Ensure backups are working correctly

## Rollback Plan

If issues arise after cleanup:

1. **Restore from backup** - Use the backup tables if needed
2. **Recreate tables** - Use the original migration scripts
3. **Restore frontend code** - Revert the frontend changes

## Next Steps

1. **Run safe cleanup first** - Execute `019_cleanup_unused_tables_safe.sql`
2. **Test thoroughly** - Verify all functionality works
3. **Monitor performance** - Check for any performance issues
4. **Consider full cleanup** - If safe cleanup works well, consider full cleanup later









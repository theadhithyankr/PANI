# Migration Files Cleanup Plan

## Files to Remove (Duplicates/Outdated)

### 1. **Old Individual Table Migrations** (Recreated in clean schema)
- `001_create_documents_table.sql` - Recreated in `005_clean_database_schema.sql`
- `002_create_employer_profiles_table.sql` - Recreated in `005_clean_database_schema.sql`
- `003_update_messaging_system.sql` - Old messaging system, replaced by v2
- `004_create_candidate_invitations_table.sql` - Table being removed

### 2. **Duplicate/Redundant Migrations**
- `010_optimize_conversations_structure.sql` - Duplicate of `010_optimize_conversations_structure_fixed.sql`
- `015_fix_interviews_v2_seeker_id_fk.sql` - Duplicate of `015_fix_interviews_v2_seeker_id_fk_corrected.sql`
- `018_check_foreign_key_constraints.sql` - Duplicate of `018_check_foreign_key_constraints_fixed.sql`

### 3. **Temporary/Check Files** (No longer needed)
- `007_update_interviews_table.sql` - Superseded by interviews_v2
- `016_check_interviews_v2_structure.sql` - Diagnostic file
- `018_check_foreign_key_constraints.sql` - Diagnostic file
- `018_check_foreign_key_constraints_fixed.sql` - Diagnostic file

## Files to Keep (Essential)

### 1. **Core Schema Migration**
- `005_clean_database_schema.sql` - Main schema definition

### 2. **Data Migration**
- `006_migrate_to_clean_schema.sql` - Data migration from old to new schema

### 3. **Essential Fixes**
- `008_fix_conversation_participants_fk.sql` - Foreign key fixes
- `009_fix_messages_fk.sql` - Messages table fixes
- `010_optimize_conversations_structure_fixed.sql` - Conversations optimization
- `012_finalize_conversations_optimization.sql` - Final conversations setup
- `013_fix_conversation_participants_fk.sql` - Additional FK fixes
- `014_fix_job_applications_v2_fk.sql` - Job applications FK fixes
- `015_fix_interviews_v2_seeker_id_fk_corrected.sql` - Interviews FK fixes
- `017_fix_interviews_v2_complete.sql` - Complete interviews setup

### 4. **Cleanup**
- `019_cleanup_unused_tables_safe.sql` - Safe cleanup
- `019_cleanup_unused_tables.sql` - Full cleanup

## Recommended Action

1. **Remove duplicate/outdated files** listed above
2. **Keep essential files** for production deployment
3. **Test thoroughly** after cleanup









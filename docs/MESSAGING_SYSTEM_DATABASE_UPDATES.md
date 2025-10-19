# Messaging System Database Updates (Simplified)

## Required Database Changes

To make the messaging system work properly between candidates and employers, you need to run the following database migration:

### 1. Run the Migration Script

Execute the SQL script located at: `database/migrations/003_update_messaging_system.sql`

This script includes:

#### **Simple Direct Linking Columns**
- `employer_id` column in `conversations` table - directly links to employer profile
- `candidate_id` column in `conversations` table - directly links to candidate profile
- No complex company relationships needed!

#### **Indexes for Performance**
- `conversations_job_id_idx` - For efficient job-based conversation lookups
- `conversations_application_id_idx` - For application-based conversation lookups  
- `conversations_employer_id_idx` - For employer-based conversation lookups
- `conversations_candidate_id_idx` - For candidate-based conversation lookups
- `conversation_participants_user_conversation_idx` - For participant queries

#### **Row Level Security (RLS) Policies**
- Enables RLS on conversations and participants tables
- Creates policies for secure access:
  - Users can only view conversations they participate in
  - Users can only update conversations they participate in
  - Proper participant management policies

#### **Helper View**
- `conversations_with_participants` view that directly shows employer and candidate names

#### **Automatic Timestamp Updates**
- Trigger to update `conversations.updated_at` when messages change

### 2. New Database Structure (Simplified)

After running the migration, your `conversations` table will have:

```sql
-- New simplified structure
conversations:
  id → conversation ID
  job_id → jobs.id (which job this is about)
  application_id → job_applications.id (which application, null for direct interviews)
  employer_id → profiles.id (direct link to employer)
  candidate_id → profiles.id (direct link to candidate)
  messages → JSON array of messages
  
-- No complex company relationships needed!
```

### 3. How the System Works (Simplified)

#### **When a candidate sends a message:**

1. **Find/Create Conversation:**
   - Look for existing conversation by `application_id` or `job_id`
   - Create new conversation with direct `employer_id` and `candidate_id`

2. **Add Participants:**
   - Add candidate and employer directly to `conversation_participants`
   - Use `employer_id` and `candidate_id` from conversation

3. **Store Messages:**
   - Messages stored as JSON array in `conversations.messages`
   - Each message has: `id`, `sender_id`, `message`, `timestamp`, `read`, `type`

#### **Employer receives the conversation:**

1. **Query Conversations:**
   - Get all conversations where employer is a participant
   - Show candidate name directly from `conversations.candidate.full_name`
   - Show job title from `conversations.jobs.title`

2. **Display & Reply:**
   - Show candidate info, job context, application status
   - Enable bidirectional messaging

### 4. Current Implementation Status

✅ **Completed:**
- Conversation creation and participant management
- Bidirectional messaging (candidate ↔ employer)
- Automatic employer participant addition
- UI for both candidate and employer sides
- Real-time message updates

✅ **Database Tables Ready:**
- `conversations` - stores conversation metadata and messages
- `conversation_participants` - links users to conversations  
- `jobs` - has `company_id` for employer linking
- `employer_profiles` - links employers to companies
- `job_applications` - links applications to candidates

### 5. Testing Checklist

After running the migration:

1. **Test Candidate Side:**
   - Click "Message" on application card
   - Verify conversation is created
   - Send a test message
   - Check employer is added as participant

2. **Test Employer Side:**
   - Navigate to Messages in employer dashboard
   - Verify conversation appears
   - Check candidate name and job context display
   - Reply to the message

3. **Verify Database:**
   ```sql
   -- Check conversation was created
   SELECT * FROM conversations WHERE job_id = 'your-job-id';
   
   -- Check participants were added
   SELECT cp.*, p.full_name, p.user_type 
   FROM conversation_participants cp
   JOIN profiles p ON cp.user_id = p.id  
   WHERE conversation_id = 'your-conversation-id';
   
   -- Check messages are stored
   SELECT id, title, messages FROM conversations 
   WHERE id = 'your-conversation-id';
   ```

### 6. Troubleshooting

**If employers don't receive messages:**
- Check `jobs.company_id` exists and is correct
- Verify `employer_profiles.company_id` matches  
- Check RLS policies are applied correctly

**If candidate names don't show:**
- Verify the enhanced query in `getUserConversations` 
- Check `job_applications.applicant_id` → `profiles.full_name` relationship

**If conversations don't load:**
- Check indexes are created
- Verify RLS policies allow access
- Check participant relationships are correct

This database migration ensures the messaging system works seamlessly with proper security, performance, and data relationships! 🚀

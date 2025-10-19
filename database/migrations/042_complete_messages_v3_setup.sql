-- Complete messages_v3 setup - add missing indexes, RLS policies, and functions
-- This migration assumes the messages_v3 table already exists

-- Step 1: Create missing indexes for the new table
CREATE INDEX IF NOT EXISTS messages_v3_conversation_id_idx 
  ON public.messages_v3 USING btree (conversation_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS messages_v3_last_message_at_idx 
  ON public.messages_v3 USING btree (last_message_at DESC) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS messages_v3_messages_gin_idx 
  ON public.messages_v3 USING gin (messages) TABLESPACE pg_default;

-- Step 2: Migrate existing data from messages_v2 to messages_v3
-- Only migrate if messages_v3 is empty and messages_v2 has data
INSERT INTO public.messages_v3 (conversation_id, messages, last_message_at, created_at, updated_at)
SELECT 
  mv2.conversation_id,
  COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', mv2.id,
        'sender_id', mv2.sender_id,
        'content', mv2.content,
        'message_type', COALESCE(mv2.message_type, 'text'),
        'attachment_urls', CASE 
          WHEN mv2.attachment_urls IS NOT NULL 
          THEN to_jsonb(mv2.attachment_urls)
          ELSE '[]'::jsonb
        END,
        'read_at', mv2.read_at,
        'created_at', mv2.created_at
      ) ORDER BY mv2.created_at ASC
    ),
    '[]'::jsonb
  ) as messages,
  MAX(mv2.created_at) as last_message_at,
  MIN(mv2.created_at) as created_at,
  MAX(mv2.created_at) as updated_at
FROM public.messages_v2 mv2
WHERE NOT EXISTS (SELECT 1 FROM public.messages_v3 mv3 WHERE mv3.conversation_id = mv2.conversation_id)
GROUP BY mv2.conversation_id;

-- Step 3: Enable RLS on the new table
ALTER TABLE public.messages_v3 ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policies for the new table
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view messages from their conversations" ON public.messages_v3;
DROP POLICY IF EXISTS "Users can insert messages to their conversations" ON public.messages_v3;
DROP POLICY IF EXISTS "Users can update messages in their conversations" ON public.messages_v3;

-- Policy for reading messages - users can only see messages from conversations they participate in
CREATE POLICY "Users can view messages from their conversations" ON public.messages_v3
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = messages_v3.conversation_id AND user_id = auth.uid()
    )
  );

-- Policy for inserting messages - users can only add messages to conversations they participate in
CREATE POLICY "Users can insert messages to their conversations" ON public.messages_v3
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = messages_v3.conversation_id AND user_id = auth.uid()
    )
  );

-- Policy for updating messages - users can only update messages in conversations they participate in
CREATE POLICY "Users can update messages in their conversations" ON public.messages_v3
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = messages_v3.conversation_id AND user_id = auth.uid()
    )
  );

-- Step 5: Create helper functions for working with JSON messages

-- Function to add a new message to a conversation
CREATE OR REPLACE FUNCTION add_message_to_conversation(
  p_conversation_id uuid,
  p_sender_id uuid,
  p_content text,
  p_message_type text DEFAULT 'text',
  p_attachment_urls text[] DEFAULT NULL
) RETURNS jsonb AS $$
DECLARE
  v_message_id uuid;
  v_new_message jsonb;
  v_updated_messages jsonb;
BEGIN
  -- Generate new message ID
  v_message_id := extensions.uuid_generate_v4();
  
  -- Create new message object
  v_new_message := jsonb_build_object(
    'id', v_message_id,
    'sender_id', p_sender_id,
    'content', p_content,
    'message_type', p_message_type,
    'attachment_urls', CASE 
      WHEN p_attachment_urls IS NOT NULL 
      THEN to_jsonb(p_attachment_urls)
      ELSE '[]'::jsonb
    END,
    'read_at', NULL,
    'created_at', now()
  );
  
  -- Insert or update the conversation's messages
  INSERT INTO public.messages_v3 (conversation_id, messages, last_message_at, updated_at)
  VALUES (p_conversation_id, jsonb_build_array(v_new_message), now(), now())
  ON CONFLICT (conversation_id) 
  DO UPDATE SET 
    messages = public.messages_v3.messages || v_new_message,
    last_message_at = now(),
    updated_at = now();
  
  -- Return the updated messages array
  SELECT mv3.messages INTO v_updated_messages 
  FROM public.messages_v3 mv3
  WHERE mv3.conversation_id = p_conversation_id;
  
  RETURN v_updated_messages;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_as_read(
  p_conversation_id uuid,
  p_user_id uuid
) RETURNS boolean AS $$
DECLARE
  v_updated_messages jsonb;
  v_message jsonb;
  v_updated_message jsonb;
  v_messages_array jsonb;
  v_i integer;
BEGIN
  -- Get current messages
  SELECT mv3.messages INTO v_messages_array 
  FROM public.messages_v3 mv3
  WHERE mv3.conversation_id = p_conversation_id;
  
  -- If no messages, return false
  IF v_messages_array IS NULL THEN
    RETURN false;
  END IF;
  
  -- Update messages where sender_id != p_user_id and read_at is null
  v_updated_messages := '[]'::jsonb;
  
  FOR v_i IN 0..jsonb_array_length(v_messages_array) - 1 LOOP
    v_message := v_messages_array->v_i;
    
    -- If this message is from another user and not read, mark as read
    IF (v_message->>'sender_id')::uuid != p_user_id AND (v_message->>'read_at') IS NULL THEN
      v_updated_message := jsonb_set(v_message, '{read_at}', to_jsonb(now()));
    ELSE
      v_updated_message := v_message;
    END IF;
    
    v_updated_messages := v_updated_messages || v_updated_message;
  END LOOP;
  
  -- Update the messages in the database
  UPDATE public.messages_v3 
  SET messages = v_updated_messages, updated_at = now()
  WHERE conversation_id = p_conversation_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unread message count for a conversation
CREATE OR REPLACE FUNCTION get_unread_message_count(
  p_conversation_id uuid,
  p_user_id uuid
) RETURNS integer AS $$
DECLARE
  v_messages jsonb;
  v_message jsonb;
  v_count integer := 0;
  v_i integer;
BEGIN
  -- Get messages for the conversation
  SELECT mv3.messages INTO v_messages 
  FROM public.messages_v3 mv3
  WHERE mv3.conversation_id = p_conversation_id;
  
  -- If no messages, return 0
  IF v_messages IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Count unread messages from other users
  FOR v_i IN 0..jsonb_array_length(v_messages) - 1 LOOP
    v_message := v_messages->v_i;
    
    IF (v_message->>'sender_id')::uuid != p_user_id AND (v_message->>'read_at') IS NULL THEN
      v_count := v_count + 1;
    END IF;
  END LOOP;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Add comments for documentation
COMMENT ON TABLE messages_v3 IS 'Stores all messages for each conversation in a single JSON column for better performance and easier management';
COMMENT ON COLUMN messages_v3.messages IS 'JSON array containing all messages for this conversation, ordered by creation time';
COMMENT ON COLUMN messages_v3.last_message_at IS 'Timestamp of the most recent message for quick sorting';
COMMENT ON FUNCTION add_message_to_conversation IS 'Adds a new message to a conversation and returns the updated messages array';
COMMENT ON FUNCTION mark_messages_as_read IS 'Marks all unread messages from other users as read for a specific user';
COMMENT ON FUNCTION get_unread_message_count IS 'Returns the count of unread messages for a specific user in a conversation';

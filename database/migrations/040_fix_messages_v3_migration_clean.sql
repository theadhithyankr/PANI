-- Migration: Restructure messages_v2 table to store all messages in JSON format
-- This migration converts the current row-based message storage to a single JSON column per conversation

-- Step 1: Create a new table with the JSON structure
CREATE TABLE IF NOT EXISTS public.messages_v3 (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  conversation_id uuid NOT NULL,
  messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  last_message_at timestamp with time zone NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT messages_v3_pkey PRIMARY KEY (id),
  CONSTRAINT messages_v3_conversation_id_fkey FOREIGN KEY (conversation_id) 
    REFERENCES conversations_v2 (id) ON DELETE CASCADE,
  CONSTRAINT messages_v3_conversation_id_unique UNIQUE (conversation_id)
) TABLESPACE pg_default;

-- Step 2: Create indexes for the new table
CREATE INDEX IF NOT EXISTS messages_v3_conversation_id_idx 
  ON public.messages_v3 USING btree (conversation_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS messages_v3_last_message_at_idx 
  ON public.messages_v3 USING btree (last_message_at DESC) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS messages_v3_messages_gin_idx 
  ON public.messages_v3 USING gin (messages) TABLESPACE pg_default;

-- Step 3: Migrate existing data from messages_v2 to messages_v3
-- Group messages by conversation_id and create JSON array
INSERT INTO public.messages_v3 (conversation_id, messages, last_message_at, created_at, updated_at)
SELECT 
  conversation_id,
  COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', id,
        'sender_id', sender_id,
        'content', content,
        'message_type', COALESCE(message_type, 'text'),
        'attachment_urls', CASE 
          WHEN attachment_urls IS NOT NULL 
          THEN to_jsonb(attachment_urls)
          ELSE '[]'::jsonb
        END,
        'read_at', read_at,
        'created_at', created_at
      ) ORDER BY created_at ASC
    ),
    '[]'::jsonb
  ) as messages,
  MAX(created_at) as last_message_at,
  MIN(created_at) as created_at,
  MAX(created_at) as updated_at
FROM public.messages_v2
GROUP BY conversation_id;

-- Step 4: Create RLS policies for the new table
ALTER TABLE public.messages_v3 ENABLE ROW LEVEL SECURITY;

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
  INSERT INTO messages_v3 (conversation_id, messages, last_message_at, updated_at)
  VALUES (p_conversation_id, jsonb_build_array(v_new_message), now(), now())
  ON CONFLICT (conversation_id) 
  DO UPDATE SET 
    messages = messages || v_new_message,
    last_message_at = now(),
    updated_at = now();
  
  -- Return the updated messages array
  SELECT messages INTO v_updated_messages 
  FROM messages_v3 
  WHERE conversation_id = p_conversation_id;
  
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
  SELECT messages INTO v_messages_array 
  FROM messages_v3 
  WHERE conversation_id = p_conversation_id;
  
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
  UPDATE messages_v3 
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
  SELECT messages INTO v_messages 
  FROM messages_v3 
  WHERE conversation_id = p_conversation_id;
  
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

-- Step 6: Create a view for backward compatibility (optional)
CREATE OR REPLACE VIEW messages_v2_compat AS
SELECT 
  (message->>'id')::uuid as id,
  conversation_id,
  (message->>'sender_id')::uuid as sender_id,
  message->>'content' as content,
  message->>'message_type' as message_type,
  CASE 
    WHEN message->'attachment_urls' IS NOT NULL 
    THEN ARRAY(SELECT jsonb_array_elements_text(message->'attachment_urls'))
    ELSE NULL
  END as attachment_urls,
  (message->>'read_at')::timestamp with time zone as read_at,
  (message->>'created_at')::timestamp with time zone as created_at
FROM messages_v3,
LATERAL jsonb_array_elements(messages) as message;

-- Step 7: Add comments for documentation
COMMENT ON TABLE messages_v3 IS 'Stores all messages for each conversation in a single JSON column for better performance and easier management';
COMMENT ON COLUMN messages_v3.messages IS 'JSON array containing all messages for this conversation, ordered by creation time';
COMMENT ON COLUMN messages_v3.last_message_at IS 'Timestamp of the most recent message for quick sorting';
COMMENT ON FUNCTION add_message_to_conversation IS 'Adds a new message to a conversation and returns the updated messages array';
COMMENT ON FUNCTION mark_messages_as_read IS 'Marks all unread messages from other users as read for a specific user';
COMMENT ON FUNCTION get_unread_message_count IS 'Returns the count of unread messages for a specific user in a conversation';

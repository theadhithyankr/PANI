-- =====================================================
-- MIGRATION SCRIPT: FIX MESSAGES FOREIGN KEY
-- =====================================================
-- This script ensures the messages table has proper foreign key
-- constraints to conversations_v2

-- =====================================================
-- 1. CHECK IF MESSAGES TABLE EXISTS
-- =====================================================

-- Create messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  conversation_id uuid NOT NULL,
  sender_id uuid NOT NULL,
  content text NOT NULL,
  message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'system')),
  attachment_urls text[],
  read_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT messages_pkey PRIMARY KEY (id),
  CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- =====================================================
-- 2. ADD FOREIGN KEY CONSTRAINT TO CONVERSATIONS_V2
-- =====================================================

-- Add foreign key constraint from messages to conversations_v2
ALTER TABLE public.messages 
ADD CONSTRAINT IF NOT EXISTS messages_conversation_id_fkey 
FOREIGN KEY (conversation_id) REFERENCES public.conversations_v2(id) ON DELETE CASCADE;

-- =====================================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Create index for efficient conversation message lookups
CREATE INDEX IF NOT EXISTS messages_conversation_id_idx 
ON public.messages USING btree (conversation_id);

-- Create index for efficient sender lookups
CREATE INDEX IF NOT EXISTS messages_sender_id_idx 
ON public.messages USING btree (sender_id);

-- Create index for efficient message ordering
CREATE INDEX IF NOT EXISTS messages_created_at_idx 
ON public.messages USING btree (created_at);

-- =====================================================
-- 4. ENABLE ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on messages table
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for messages
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can create messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;

-- Policy for viewing messages
CREATE POLICY "Users can view messages in their conversations" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.conversation_participants cp
            WHERE cp.conversation_id = messages.conversation_id
            AND cp.user_id = auth.uid()
        )
    );

-- Policy for creating messages
CREATE POLICY "Users can create messages in their conversations" ON public.messages
    FOR INSERT WITH CHECK (
        sender_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.conversation_participants cp
            WHERE cp.conversation_id = messages.conversation_id
            AND cp.user_id = auth.uid()
        )
    );

-- Policy for updating messages (users can only update their own messages)
CREATE POLICY "Users can update their own messages" ON public.messages
    FOR UPDATE USING (sender_id = auth.uid());

-- =====================================================
-- 5. GRANT PERMISSIONS
-- =====================================================

-- Grant necessary permissions
GRANT ALL ON public.messages TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- =====================================================
-- 6. ADD COMMENTS
-- =====================================================

COMMENT ON TABLE public.messages IS 'Stores individual messages within conversations';
COMMENT ON COLUMN public.messages.conversation_id IS 'References conversations_v2.id';
COMMENT ON COLUMN public.messages.sender_id IS 'References profiles.id';
COMMENT ON COLUMN public.messages.content IS 'The message content';
COMMENT ON COLUMN public.messages.message_type IS 'Type of message: text, file, or system';
COMMENT ON COLUMN public.messages.read_at IS 'Timestamp when message was read';









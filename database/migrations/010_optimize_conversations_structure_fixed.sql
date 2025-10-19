-- =====================================================
-- MIGRATION SCRIPT: OPTIMIZE CONVERSATIONS STRUCTURE (FIXED)
-- =====================================================
-- This script ensures the conversations and messages tables are correctly structured
-- and linked for optimal performance and scalability.

-- 1. Ensure uuid-ossp extension is enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create or update the conversations_v2 table
-- This table stores metadata about conversations
CREATE TABLE IF NOT EXISTS public.conversations_v2 (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  application_id uuid NOT NULL,
  title text,
  last_message_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),

  CONSTRAINT conversations_v2_pkey PRIMARY KEY (id),
  CONSTRAINT conversations_v2_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.job_applications_v2(id) ON DELETE CASCADE
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS conversations_v2_application_id_idx ON public.conversations_v2 USING btree (application_id);
CREATE INDEX IF NOT EXISTS conversations_v2_updated_at_idx ON public.conversations_v2 USING btree (updated_at DESC);

-- 3. Create or update the messages table
-- This table stores individual messages, linked to conversations_v2
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
  CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations_v2(id) ON DELETE CASCADE,
  CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS messages_conversation_id_idx ON public.messages USING btree (conversation_id);
CREATE INDEX IF NOT EXISTS messages_sender_id_idx ON public.messages USING btree (sender_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON public.messages USING btree (created_at DESC);

-- 4. Create or update the conversation_participants table
-- This table links users to conversations
CREATE TABLE IF NOT EXISTS public.conversation_participants (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  conversation_id uuid NOT NULL,
  user_id uuid NOT NULL,
  joined_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),

  CONSTRAINT conversation_participants_pkey PRIMARY KEY (id),
  CONSTRAINT conversation_participants_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations_v2(id) ON DELETE CASCADE,
  CONSTRAINT conversation_participants_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  UNIQUE(conversation_id, user_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS conversation_participants_conversation_id_idx ON public.conversation_participants USING btree (conversation_id);
CREATE INDEX IF NOT EXISTS conversation_participants_user_id_idx ON public.conversation_participants USING btree (user_id);

-- 5. Add foreign key constraints if they don't exist
-- Check if foreign key exists before adding
DO $$
BEGIN
  -- Add conversation_participants foreign key if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'conversation_participants_conversation_id_fkey'
    AND table_name = 'conversation_participants'
  ) THEN
    ALTER TABLE public.conversation_participants 
    ADD CONSTRAINT conversation_participants_conversation_id_fkey 
    FOREIGN KEY (conversation_id) REFERENCES public.conversations_v2(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 6. Enable Row Level Security (RLS) for new tables
ALTER TABLE public.conversations_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

-- 7. Define RLS policies for conversations_v2
DROP POLICY IF EXISTS "Enable read access for participants" ON public.conversations_v2;
CREATE POLICY "Enable read access for participants" ON public.conversations_v2
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = conversations_v2.id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.conversations_v2;
CREATE POLICY "Enable insert for authenticated users" ON public.conversations_v2
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Enable update for participants" ON public.conversations_v2;
CREATE POLICY "Enable update for participants" ON public.conversations_v2
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = conversations_v2.id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Enable delete for participants" ON public.conversations_v2;
CREATE POLICY "Enable delete for participants" ON public.conversations_v2
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = conversations_v2.id AND user_id = auth.uid()
    )
  );

-- 8. Define RLS policies for messages
DROP POLICY IF EXISTS "Enable read access for conversation participants" ON public.messages;
CREATE POLICY "Enable read access for conversation participants" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.messages;
CREATE POLICY "Enable insert for authenticated users" ON public.messages
  FOR INSERT WITH CHECK (sender_id = auth.uid());

DROP POLICY IF EXISTS "Enable update for sender" ON public.messages;
CREATE POLICY "Enable update for sender" ON public.messages
  FOR UPDATE USING (sender_id = auth.uid());

DROP POLICY IF EXISTS "Enable delete for sender" ON public.messages;
CREATE POLICY "Enable delete for sender" ON public.messages
  FOR DELETE USING (sender_id = auth.uid());

-- 9. Define RLS policies for conversation_participants
DROP POLICY IF EXISTS "Enable read access for self" ON public.conversation_participants;
CREATE POLICY "Enable read access for self" ON public.conversation_participants
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.conversation_participants;
CREATE POLICY "Enable insert for authenticated users" ON public.conversation_participants
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Enable delete for self" ON public.conversation_participants;
CREATE POLICY "Enable delete for self" ON public.conversation_participants
  FOR DELETE USING (user_id = auth.uid());

-- 10. Grant necessary permissions
GRANT ALL ON TABLE public.conversations_v2 TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.messages TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.conversation_participants TO postgres, anon, authenticated, service_role;

-- 11. Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations_v2;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_participants;









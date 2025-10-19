-- =====================================================
-- MIGRATION SCRIPT: FINALIZE CONVERSATIONS OPTIMIZATION
-- =====================================================
-- This script completes the conversations optimization using messages_v2 table

-- 1. Ensure uuid-ossp extension is enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create indexes for messages_v2 table for optimal performance
CREATE INDEX IF NOT EXISTS messages_v2_conversation_id_idx ON public.messages_v2 USING btree (conversation_id);
CREATE INDEX IF NOT EXISTS messages_v2_sender_id_idx ON public.messages_v2 USING btree (sender_id);
CREATE INDEX IF NOT EXISTS messages_v2_created_at_idx ON public.messages_v2 USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS messages_v2_unread_idx ON public.messages_v2 USING btree (conversation_id, read_at) WHERE read_at IS NULL;

-- 3. Create indexes for conversations_v2 if they don't exist
CREATE INDEX IF NOT EXISTS conversations_v2_application_id_idx ON public.conversations_v2 USING btree (application_id);
CREATE INDEX IF NOT EXISTS conversations_v2_updated_at_idx ON public.conversations_v2 USING btree (updated_at DESC);
CREATE INDEX IF NOT EXISTS conversations_v2_last_message_at_idx ON public.conversations_v2 USING btree (last_message_at DESC);

-- 4. Create indexes for conversation_participants if they don't exist
CREATE INDEX IF NOT EXISTS conversation_participants_conversation_id_idx ON public.conversation_participants USING btree (conversation_id);
CREATE INDEX IF NOT EXISTS conversation_participants_user_id_idx ON public.conversation_participants USING btree (user_id);

-- 5. Enable Row Level Security (RLS) for all tables
ALTER TABLE public.conversations_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

-- 6. Drop existing policies and create new ones for conversations_v2
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

-- 7. Create RLS policies for messages_v2
DROP POLICY IF EXISTS "Enable read access for conversation participants" ON public.messages_v2;
CREATE POLICY "Enable read access for conversation participants" ON public.messages_v2
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = messages_v2.conversation_id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.messages_v2;
CREATE POLICY "Enable insert for authenticated users" ON public.messages_v2
  FOR INSERT WITH CHECK (sender_id = auth.uid());

DROP POLICY IF EXISTS "Enable update for sender" ON public.messages_v2;
CREATE POLICY "Enable update for sender" ON public.messages_v2
  FOR UPDATE USING (sender_id = auth.uid());

DROP POLICY IF EXISTS "Enable delete for sender" ON public.messages_v2;
CREATE POLICY "Enable delete for sender" ON public.messages_v2
  FOR DELETE USING (sender_id = auth.uid());

-- 8. Create RLS policies for conversation_participants
DROP POLICY IF EXISTS "Enable read access for self" ON public.conversation_participants;
CREATE POLICY "Enable read access for self" ON public.conversation_participants
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.conversation_participants;
CREATE POLICY "Enable insert for authenticated users" ON public.conversation_participants
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Enable delete for self" ON public.conversation_participants;
CREATE POLICY "Enable delete for self" ON public.conversation_participants
  FOR DELETE USING (user_id = auth.uid());

-- 9. Grant necessary permissions
GRANT ALL ON TABLE public.conversations_v2 TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.messages_v2 TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.conversation_participants TO postgres, anon, authenticated, service_role;

-- 10. Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations_v2;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages_v2;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_participants;

-- 11. Create helpful views for common queries
CREATE OR REPLACE VIEW conversations_with_latest_message AS
SELECT 
  c.id,
  c.title,
  c.application_id,
  c.created_at,
  c.updated_at,
  c.last_message_at,
  ja.status as application_status,
  j.title as job_title,
  comp.name as company_name,
  prof.full_name as applicant_name,
  prof.avatar_url as applicant_avatar,
  latest_msg.content as last_message_content,
  latest_msg.sender_id as last_message_sender_id,
  latest_msg.created_at as last_message_created_at
FROM public.conversations_v2 c
LEFT JOIN public.job_applications_v2 ja ON c.application_id = ja.id
LEFT JOIN public.jobs j ON ja.job_id = j.id
LEFT JOIN public.companies comp ON j.company_id = comp.id
LEFT JOIN public.profiles prof ON ja.applicant_id = prof.id
LEFT JOIN LATERAL (
  SELECT content, sender_id, created_at
  FROM public.messages_v2 m
  WHERE m.conversation_id = c.id
  ORDER BY m.created_at DESC
  LIMIT 1
) latest_msg ON true;

-- 12. Create view for unread message counts
CREATE OR REPLACE VIEW conversation_unread_counts AS
SELECT 
  cp.conversation_id,
  cp.user_id,
  COUNT(m.id) as unread_count
FROM public.conversation_participants cp
LEFT JOIN public.messages_v2 m ON cp.conversation_id = m.conversation_id 
  AND m.sender_id != cp.user_id 
  AND m.read_at IS NULL
GROUP BY cp.conversation_id, cp.user_id;

-- 13. Grant permissions on views
GRANT SELECT ON public.conversations_with_latest_message TO authenticated;
GRANT SELECT ON public.conversation_unread_counts TO authenticated;

-- 14. Add helpful functions
CREATE OR REPLACE FUNCTION get_conversation_with_participants(conv_id uuid, user_id uuid)
RETURNS TABLE (
  conversation_id uuid,
  title text,
  application_id uuid,
  last_message_at timestamp with time zone,
  unread_count bigint,
  job_title text,
  company_name text,
  application_status text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as conversation_id,
    c.title,
    c.application_id,
    c.last_message_at,
    COALESCE(uc.unread_count, 0) as unread_count,
    j.title as job_title,
    comp.name as company_name,
    ja.status as application_status
  FROM public.conversations_v2 c
  JOIN public.conversation_participants cp ON c.id = cp.conversation_id
  LEFT JOIN public.job_applications_v2 ja ON c.application_id = ja.id
  LEFT JOIN public.jobs j ON ja.job_id = j.id
  LEFT JOIN public.companies comp ON j.company_id = comp.id
  LEFT JOIN conversation_unread_counts uc ON c.id = uc.conversation_id AND uc.user_id = get_conversation_with_participants.user_id
  WHERE c.id = conv_id AND cp.user_id = get_conversation_with_participants.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION mark_conversation_messages_read(conv_id uuid, user_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.messages_v2 
  SET read_at = now()
  WHERE conversation_id = conv_id 
    AND sender_id != user_id 
    AND read_at IS NULL;
    
  -- Update conversation last_message_at
  UPDATE public.conversations_v2 
  SET updated_at = now()
  WHERE id = conv_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 15. Grant permissions on functions
GRANT EXECUTE ON FUNCTION get_conversation_with_participants(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_conversation_messages_read(uuid, uuid) TO authenticated;

-- 16. Add comments for documentation
COMMENT ON TABLE public.conversations_v2 IS 'Stores conversation metadata linked to job applications';
COMMENT ON TABLE public.conversation_participants IS 'Links users to conversations they participate in';
COMMENT ON TABLE public.messages_v2 IS 'Stores individual messages within conversations';
COMMENT ON VIEW public.conversations_with_latest_message IS 'Conversations with latest message and job details';
COMMENT ON VIEW public.conversation_unread_counts IS 'Unread message counts per conversation per user';









-- Run once in Supabase Dashboard → SQL Editor → New query → Run
-- Project: https://supabase.com/dashboard/project/nfpeasuabkwobyvocecc/sql/new
-- Safe to re-run (idempotent)

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS social_links JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS social_links_object;
ALTER TABLE profiles ADD CONSTRAINT social_links_object
  CHECK (jsonb_typeof(social_links) = 'object');

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS conversation_participants (
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_read_at TIMESTAMPTZ,
  PRIMARY KEY (conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS conversation_participants_user_idx
  ON conversation_participants (user_id);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT message_body_length CHECK (
    char_length(body) >= 1 AND char_length(body) <= 2000
  )
);

CREATE INDEX IF NOT EXISTS messages_conversation_created_idx
  ON messages (conversation_id, created_at DESC);

CREATE OR REPLACE FUNCTION bump_conversation_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE conversations SET updated_at = now() WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS messages_bump_conversation ON messages;
CREATE TRIGGER messages_bump_conversation
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION bump_conversation_updated_at();

CREATE OR REPLACE FUNCTION public.user_in_conversation(cid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = cid AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.create_dm_conversation(
  other_user_id UUID,
  p_post_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
  cid UUID;
  blocked BOOLEAN;
  post_author UUID;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF other_user_id = uid THEN
    RAISE EXCEPTION 'cannot message yourself';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM blocks
    WHERE (blocker_id = uid AND blocked_id = other_user_id)
       OR (blocker_id = other_user_id AND blocked_id = uid)
  ) INTO blocked;
  IF blocked THEN
    RAISE EXCEPTION 'blocked';
  END IF;

  IF p_post_id IS NOT NULL THEN
    SELECT user_id INTO post_author FROM posts WHERE id = p_post_id AND deleted_at IS NULL;
    IF post_author IS NULL THEN
      RAISE EXCEPTION 'post not found';
    END IF;
    IF post_author <> other_user_id THEN
      RAISE EXCEPTION 'post author mismatch';
    END IF;
  END IF;

  SELECT c.id INTO cid
  FROM conversations c
  INNER JOIN conversation_participants cp1
    ON cp1.conversation_id = c.id AND cp1.user_id = uid
  INNER JOIN conversation_participants cp2
    ON cp2.conversation_id = c.id AND cp2.user_id = other_user_id
  WHERE c.post_id IS NOT DISTINCT FROM p_post_id
  LIMIT 1;

  IF cid IS NOT NULL THEN
    RETURN cid;
  END IF;

  INSERT INTO conversations (post_id) VALUES (p_post_id) RETURNING id INTO cid;
  INSERT INTO conversation_participants (conversation_id, user_id)
  VALUES (cid, uid), (cid, other_user_id);
  RETURN cid;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_dm_conversation(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_dm_conversation(UUID, UUID) TO service_role;

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS conversations_select ON conversations;
CREATE POLICY conversations_select ON conversations
  FOR SELECT USING (public.user_in_conversation(id));

DROP POLICY IF EXISTS participants_select ON conversation_participants;
CREATE POLICY participants_select ON conversation_participants
  FOR SELECT USING (public.user_in_conversation(conversation_id));

DROP POLICY IF EXISTS participants_update_own ON conversation_participants;
CREATE POLICY participants_update_own ON conversation_participants
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS messages_select ON messages;
CREATE POLICY messages_select ON messages
  FOR SELECT USING (public.user_in_conversation(conversation_id));

DROP POLICY IF EXISTS messages_insert ON messages;
CREATE POLICY messages_insert ON messages
  FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND public.user_in_conversation(conversation_id)
  );

-- Verify (should return one row)
SELECT proname, proargtypes::regtype[]
FROM pg_proc
WHERE proname = 'create_dm_conversation';

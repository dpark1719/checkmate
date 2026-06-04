-- Message requests: profile DMs from non-connected users require accept

ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS initiated_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE conversation_participants
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'accepted';

ALTER TABLE conversation_participants DROP CONSTRAINT IF EXISTS conversation_participants_status_check;
ALTER TABLE conversation_participants ADD CONSTRAINT conversation_participants_status_check
  CHECK (status IN ('pending', 'accepted', 'declined'));

-- Backfill existing rows
UPDATE conversations SET initiated_by = (
  SELECT cp.user_id
  FROM conversation_participants cp
  WHERE cp.conversation_id = conversations.id
  ORDER BY cp.joined_at ASC
  LIMIT 1
)
WHERE initiated_by IS NULL;

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
  connected BOOLEAN;
  other_status TEXT;
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
    AND cp1.status != 'declined'
    AND cp2.status != 'declined'
  LIMIT 1;

  IF cid IS NOT NULL THEN
    RETURN cid;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM follows
    WHERE (follower_id = uid AND following_id = other_user_id)
       OR (follower_id = other_user_id AND following_id = uid)
  ) INTO connected;

  IF p_post_id IS NOT NULL OR connected THEN
    other_status := 'accepted';
  ELSE
    other_status := 'pending';
  END IF;

  INSERT INTO conversations (post_id, initiated_by)
  VALUES (p_post_id, uid)
  RETURNING id INTO cid;

  INSERT INTO conversation_participants (conversation_id, user_id, status)
  VALUES
    (cid, uid, 'accepted'),
    (cid, other_user_id, other_status);

  RETURN cid;
END;
$$;

CREATE OR REPLACE FUNCTION public.accept_conversation_request(cid UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  UPDATE conversation_participants
  SET status = 'accepted', last_read_at = now()
  WHERE conversation_id = cid
    AND user_id = uid
    AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'not a pending request';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.decline_conversation_request(cid UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  UPDATE conversation_participants
  SET status = 'declined'
  WHERE conversation_id = cid
    AND user_id = uid
    AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'not a pending request';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_conversation_request(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_conversation_request(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.decline_conversation_request(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decline_conversation_request(UUID) TO service_role;

DROP POLICY IF EXISTS messages_select ON messages;
CREATE POLICY messages_select ON messages
  FOR SELECT USING (
    public.user_in_conversation(conversation_id)
    AND EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = messages.conversation_id
        AND cp.user_id = auth.uid()
        AND cp.status != 'declined'
    )
    AND (
      sender_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM conversation_participants cp
        WHERE cp.conversation_id = messages.conversation_id
          AND cp.user_id = auth.uid()
          AND cp.status IN ('accepted', 'pending')
      )
    )
  );

DROP POLICY IF EXISTS messages_insert ON messages;
CREATE POLICY messages_insert ON messages
  FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND public.user_in_conversation(conversation_id)
    AND (
      EXISTS (
        SELECT 1 FROM conversation_participants cp
        WHERE cp.conversation_id = conversation_id
          AND cp.user_id = auth.uid()
          AND cp.status = 'accepted'
      )
      OR EXISTS (
        SELECT 1 FROM conversations c
        INNER JOIN conversation_participants cp
          ON cp.conversation_id = c.id AND cp.user_id = auth.uid()
        WHERE c.id = conversation_id
          AND c.initiated_by = auth.uid()
          AND cp.status = 'accepted'
      )
    )
  );

-- Hide duplicate inbox rows: merge only threads with the same user pair AND same post_id.
-- Profile DMs (post_id null) and post-specific DMs stay separate.

WITH dm_convs AS (
  SELECT
    c.id AS conversation_id,
    c.post_id,
    c.updated_at,
    (
      SELECT array_agg(cp.user_id ORDER BY cp.user_id)
      FROM conversation_participants cp
      WHERE cp.conversation_id = c.id AND cp.status != 'declined'
    ) AS users
  FROM conversations c
  WHERE (
    SELECT count(*)
    FROM conversation_participants cp
    WHERE cp.conversation_id = c.id AND cp.status != 'declined'
  ) = 2
),
ranked AS (
  SELECT
    conversation_id,
    users,
    post_id,
    ROW_NUMBER() OVER (
      PARTITION BY users, post_id
      ORDER BY updated_at DESC
    ) AS rn
  FROM dm_convs
  WHERE users IS NOT NULL AND array_length(users, 1) = 2
),
dupes AS (
  SELECT
    r.conversation_id AS dupe_id,
    k.conversation_id AS keep_id
  FROM ranked r
  INNER JOIN ranked k
    ON k.users = r.users
    AND k.post_id IS NOT DISTINCT FROM r.post_id
    AND k.rn = 1
  WHERE r.rn > 1
)
UPDATE messages m
SET conversation_id = d.keep_id
FROM dupes d
WHERE m.conversation_id = d.dupe_id;

WITH dm_convs AS (
  SELECT
    c.id AS conversation_id,
    c.post_id,
    c.updated_at,
    (
      SELECT array_agg(cp.user_id ORDER BY cp.user_id)
      FROM conversation_participants cp
      WHERE cp.conversation_id = c.id AND cp.status != 'declined'
    ) AS users
  FROM conversations c
  WHERE (
    SELECT count(*)
    FROM conversation_participants cp
    WHERE cp.conversation_id = c.id AND cp.status != 'declined'
  ) = 2
),
ranked AS (
  SELECT
    conversation_id,
    users,
    post_id,
    ROW_NUMBER() OVER (
      PARTITION BY users, post_id
      ORDER BY updated_at DESC
    ) AS rn
  FROM dm_convs
  WHERE users IS NOT NULL AND array_length(users, 1) = 2
),
dupes AS (
  SELECT r.conversation_id AS dupe_id
  FROM ranked r
  WHERE r.rn > 1
)
DELETE FROM conversations c
USING dupes d
WHERE c.id = d.dupe_id;

-- Restore exact post_id matching so profile and post threads remain separate.
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

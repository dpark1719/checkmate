-- Soft-delete UPDATE must still satisfy SELECT policies on the new row.
-- posts_select hid deleted rows, so setting deleted_at failed with:
-- "new row violates row-level security policy for table posts"

DROP POLICY IF EXISTS posts_select ON posts;
CREATE POLICY posts_select ON posts FOR SELECT USING (
  deleted_at IS NULL OR auth.uid() = user_id
);

DROP POLICY IF EXISTS posts_update ON posts;
CREATE POLICY posts_update ON posts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS comments_select ON comments;
CREATE POLICY comments_select ON comments FOR SELECT USING (
  deleted_at IS NULL OR auth.uid() = user_id
);

DROP POLICY IF EXISTS comments_update ON comments;
CREATE POLICY comments_update ON comments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

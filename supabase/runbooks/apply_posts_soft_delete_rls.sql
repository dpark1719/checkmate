-- Run in Supabase SQL Editor if delete post fails with:
-- "new row violates row-level security policy for table posts"
--
-- Note: The web API uses the service role for soft-delete after ownership checks,
-- so delete should work without this SQL. Run this anyway if you use Supabase
-- client-side updates or want RLS-correct behavior for all paths.
--
-- Safe to re-run (drops and recreates policies).

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

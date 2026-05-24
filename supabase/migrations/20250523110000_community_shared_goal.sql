-- Link each community membership to the goal the user shares in that community
ALTER TABLE community_memberships
  ADD COLUMN IF NOT EXISTS shared_goal_id UUID REFERENCES goals(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS community_memberships_shared_goal_idx
  ON community_memberships (community_id, shared_goal_id)
  WHERE shared_goal_id IS NOT NULL;

CREATE POLICY memberships_update ON community_memberships
  FOR UPDATE USING (auth.uid() = user_id);

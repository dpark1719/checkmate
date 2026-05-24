-- Keep goal_communities.member_count in sync (RLS blocks client UPDATE on goal_communities)
CREATE OR REPLACE FUNCTION public.sync_community_member_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_community_id UUID;
BEGIN
  target_community_id := COALESCE(NEW.community_id, OLD.community_id);

  UPDATE goal_communities
  SET member_count = (
    SELECT COUNT(*)::INTEGER
    FROM community_memberships
    WHERE community_id = target_community_id
  )
  WHERE id = target_community_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS community_membership_count_sync ON community_memberships;

CREATE TRIGGER community_membership_count_sync
  AFTER INSERT OR DELETE ON community_memberships
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_community_member_count();

-- Backfill counts for existing memberships
UPDATE goal_communities gc
SET member_count = (
  SELECT COUNT(*)::INTEGER
  FROM community_memberships cm
  WHERE cm.community_id = gc.id
);

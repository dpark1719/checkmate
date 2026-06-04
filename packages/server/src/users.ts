import type { SupabaseClient } from "@supabase/supabase-js";

export async function getProfileByUsername(
  supabase: SupabaseClient,
  username: string,
  viewerId?: string
) {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username.toLowerCase())
    .single();

  if (error || !profile) return null;

  if (viewerId) {
    const { data: block } = await supabase
      .from("blocks")
      .select("blocker_id")
      .eq("blocker_id", viewerId)
      .eq("blocked_id", profile.id)
      .maybeSingle();
    if (block) return null;
  }

  const { data: goals } = await supabase
    .from("goals")
    .select("id, title, category, is_active")
    .eq("user_id", profile.id)
    .eq("is_active", true)
    .is("archived_at", null);

  const { data: streaks } = await supabase
    .from("streaks")
    .select("goal_id, current_count, longest_count")
    .eq("user_id", profile.id);

  let isFollowing = false;
  if (viewerId && viewerId !== profile.id) {
    const { data: follow } = await supabase
      .from("follows")
      .select("follower_id")
      .eq("follower_id", viewerId)
      .eq("following_id", profile.id)
      .maybeSingle();
    isFollowing = Boolean(follow);
  }

  return { profile, goals: goals ?? [], streaks: streaks ?? [], isFollowing };
}

export interface UserConnection {
  id: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
  isFollowing: boolean;
}

export async function getConnectionsByUsername(
  supabase: SupabaseClient,
  username: string,
  viewerId?: string
): Promise<{ connections: UserConnection[] } | null> {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username.toLowerCase())
    .single();

  if (error || !profile) return null;

  if (viewerId) {
    const { data: block } = await supabase
      .from("blocks")
      .select("blocker_id")
      .eq("blocker_id", viewerId)
      .eq("blocked_id", profile.id)
      .maybeSingle();
    if (block) return null;
  }

  const { data: follows, error: followErr } = await supabase
    .from("follows")
    .select(
      "following_id, profiles!follows_following_id_fkey(id, display_name, username, avatar_url)"
    )
    .eq("follower_id", profile.id)
    .order("created_at", { ascending: false });

  if (followErr) throw new Error(followErr.message);

  let blockedIds = new Set<string>();
  let viewerFollowingIds = new Set<string>();

  if (viewerId) {
    const [{ data: blocks }, { data: viewerFollows }] = await Promise.all([
      supabase
        .from("blocks")
        .select("blocker_id, blocked_id")
        .or(`blocker_id.eq.${viewerId},blocked_id.eq.${viewerId}`),
      supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", viewerId),
    ]);

    for (const row of blocks ?? []) {
      const other =
        row.blocker_id === viewerId ? row.blocked_id : row.blocker_id;
      blockedIds.add(other as string);
    }

    viewerFollowingIds = new Set(
      (viewerFollows ?? []).map((f) => f.following_id as string)
    );
  }

  const connections: UserConnection[] = [];

  for (const row of follows ?? []) {
    const prof = row.profiles as
      | {
          id: string;
          display_name: string;
          username: string;
          avatar_url: string | null;
        }
      | {
          id: string;
          display_name: string;
          username: string;
          avatar_url: string | null;
        }[]
      | null;
    const p = Array.isArray(prof) ? prof[0] : prof;
    if (!p) continue;
    if (blockedIds.has(p.id)) continue;

    connections.push({
      id: p.id,
      displayName: p.display_name,
      username: p.username,
      avatarUrl: p.avatar_url,
      isFollowing: viewerFollowingIds.has(p.id),
    });
  }

  return { connections };
}


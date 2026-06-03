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


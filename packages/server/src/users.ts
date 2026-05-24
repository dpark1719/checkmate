import type { SupabaseClient } from "@supabase/supabase-js";
import { signPhotoUrls } from "./storage";

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

  return { profile, goals: goals ?? [], streaks: streaks ?? [] };
}

export async function getUserPosts(
  supabase: SupabaseClient,
  userId: string,
  options: { cursor?: string; limit?: number } = {}
) {
  const limit = Math.min(options.limit ?? 20, 50);

  let query = supabase
    .from("posts")
    .select("id, photo_url, caption, is_late, created_at, goals(title, category)")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (options.cursor) {
    query = query.lt("created_at", options.cursor);
  }

  const { data, error } = await query;
  if (error) throw error;

  const signed = await signPhotoUrls(
    supabase,
    (data ?? []).map((p) => p.photo_url as string)
  );

  const posts = (data ?? []).map((p) => ({
    id: p.id,
    photoUrl: signed.get(p.photo_url as string) ?? p.photo_url,
    caption: p.caption,
    isLate: p.is_late,
    createdAt: p.created_at,
    goal: Array.isArray(p.goals) ? p.goals[0] : p.goals,
  }));

  return {
    posts,
    nextCursor: posts.length === limit ? posts[posts.length - 1]?.createdAt : null,
  };
}

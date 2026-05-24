import type { SupabaseClient } from "@supabase/supabase-js";
import { signPhotoUrls } from "./storage";

const DEFAULT_LIMIT = 20;

function normalizeRelation<T>(value: T | T[] | null): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

export async function getHomeFeed(
  supabase: SupabaseClient,
  userId: string,
  options: { cursor?: string; limit?: number } = {}
) {
  const limit = Math.min(options.limit ?? DEFAULT_LIMIT, 50);

  const { data: following } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", userId);

  const { data: blocks } = await supabase
    .from("blocks")
    .select("blocked_id")
    .eq("blocker_id", userId);

  const blockedIds = new Set((blocks ?? []).map((b) => b.blocked_id));

  const followingIds = (following ?? []).map((f) => f.following_id);
  followingIds.push(userId);

  const { data: memberships } = await supabase
    .from("community_memberships")
    .select("community_id")
    .eq("user_id", userId);

  const communityIds = (memberships ?? []).map((m) => m.community_id);
  let categories: string[] = [];

  if (communityIds.length > 0) {
    const { data: communities } = await supabase
      .from("goal_communities")
      .select("category")
      .in("id", communityIds);
    categories = (communities ?? []).map((c) => c.category as string);
  }

  let query = supabase
    .from("posts")
    .select(
      `
      id, user_id, goal_id, photo_url, caption, is_late, created_at,
      profiles(display_name, username, avatar_url),
      goals(title, category),
      reactions(type, user_id)
    `
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (options.cursor) {
    query = query.lt("created_at", options.cursor);
  }

  const { data: posts, error } = await query;
  if (error) throw error;

  const filtered = (posts ?? []).filter((post) => {
    if (blockedIds.has(post.user_id)) return false;
    if (followingIds.includes(post.user_id)) return true;
    const goal = normalizeRelation(post.goals) as { category: string } | null;
    return goal?.category && categories.includes(goal.category);
  });

  const paths = filtered.map((p) => p.photo_url as string);
  const signed = await signPhotoUrls(supabase, paths);

  const items = filtered.map((post) => {
    const profile = normalizeRelation(post.profiles) as {
      display_name: string;
      username: string;
      avatar_url: string | null;
    } | null;
    const goal = normalizeRelation(post.goals) as {
      title: string;
      category: string;
    } | null;
    return {
      id: post.id,
      userId: post.user_id,
      goalId: post.goal_id,
      photoUrl: signed.get(post.photo_url as string) ?? post.photo_url,
      caption: post.caption,
      isLate: post.is_late,
      createdAt: post.created_at,
      author: profile
        ? {
            displayName: profile.display_name,
            username: profile.username,
            avatarUrl: profile.avatar_url,
          }
        : null,
      goal: goal
        ? { title: goal.title, category: goal.category }
        : null,
      reactions: post.reactions ?? [],
    };
  });

  const nextCursor =
    items.length === limit ? items[items.length - 1]?.createdAt : null;

  return { posts: items, nextCursor };
}

export async function getCommunityFeed(
  supabase: SupabaseClient,
  category: string,
  options: { cursor?: string; limit?: number } = {}
) {
  const limit = Math.min(options.limit ?? DEFAULT_LIMIT, 50);

  const { data: posts, error } = await supabase
    .from("posts")
    .select(
      `
      id, user_id, goal_id, photo_url, caption, is_late, created_at,
      profiles(display_name, username, avatar_url),
      goals!inner(title, category),
      reactions(type, user_id)
    `
    )
    .eq("goals.category", category)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  const signed = await signPhotoUrls(
    supabase,
    (posts ?? []).map((p) => p.photo_url as string)
  );

  const items = (posts ?? []).map((post) => {
    const profile = normalizeRelation(post.profiles) as {
      display_name: string;
      username: string;
      avatar_url: string | null;
    } | null;
    const goal = normalizeRelation(post.goals) as {
      title: string;
      category: string;
    } | null;
    return {
      id: post.id,
      userId: post.user_id,
      photoUrl: signed.get(post.photo_url as string) ?? post.photo_url,
      caption: post.caption,
      isLate: post.is_late,
      createdAt: post.created_at,
      author: profile
        ? {
            displayName: profile.display_name,
            username: profile.username,
            avatarUrl: profile.avatar_url,
          }
        : null,
      goal: goal ? { title: goal.title, category: goal.category } : null,
      reactions: post.reactions ?? [],
    };
  });

  return {
    posts: items,
    nextCursor: items.length === limit ? items[items.length - 1]?.createdAt : null,
  };
}

import type { SupabaseClient } from "@supabase/supabase-js";
import { signAvatarUrls, signPhotoUrls } from "./storage";

const DEFAULT_LIMIT = 20;

function normalizeRelation<T>(value: T | T[] | null): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

type PostRow = {
  id: string;
  user_id: string;
  goal_id: string;
  photo_url: string;
  caption: string | null;
  is_late: boolean;
  created_at: string;
  profiles: unknown;
  goals: unknown;
  reactions: { type: string; user_id: string }[] | null;
};

const POST_SELECT = `
  id, user_id, goal_id, photo_url, caption, is_late, created_at,
  profiles(display_name, username, avatar_url),
  goals!inner(title, category),
  reactions(type, user_id)
`;

function mapPostRows(
  supabase: SupabaseClient,
  posts: PostRow[],
  limit: number,
  followingAuthorIds?: Set<string>
) {
  const photoPaths = posts.map((p) => p.photo_url as string);
  const avatarPaths = posts
    .map((p) => {
      const profile = normalizeRelation(p.profiles) as {
        avatar_url: string | null;
      } | null;
      return profile?.avatar_url ?? "";
    })
    .filter(Boolean);

  return Promise.all([
    signPhotoUrls(supabase, photoPaths),
    signAvatarUrls(supabase, avatarPaths),
  ]).then(([signedPhotos, signedAvatars]) => {
    const items = posts.map((post) => {
      const profile = normalizeRelation(post.profiles) as {
        display_name: string;
        username: string;
        avatar_url: string | null;
      } | null;
      const goal = normalizeRelation(post.goals) as {
        title: string;
        category: string;
      } | null;
      const avatarStored = profile?.avatar_url;
      return {
        id: post.id,
        userId: post.user_id,
        goalId: post.goal_id,
        photoUrl:
          signedPhotos.get(post.photo_url as string) ?? post.photo_url,
        caption: post.caption,
        isLate: post.is_late,
        createdAt: post.created_at,
        author: profile
          ? {
              displayName: profile.display_name,
              username: profile.username,
              avatarUrl: avatarStored
                ? signedAvatars.get(avatarStored) ?? avatarStored
                : null,
            }
          : null,
        goal: goal ? { title: goal.title, category: goal.category } : null,
        reactions: post.reactions ?? [],
        isFollowingAuthor: followingAuthorIds?.has(post.user_id) ?? false,
      };
    });

    const nextCursor =
      items.length === limit ? items[items.length - 1]?.createdAt : null;

    return { posts: items, nextCursor };
  });
}

async function mySharedGoalIds(supabase: SupabaseClient, userId: string) {
  const { data: memberships } = await supabase
    .from("community_memberships")
    .select("shared_goal_id")
    .eq("user_id", userId)
    .not("shared_goal_id", "is", null);

  return (memberships ?? [])
    .map((m) => m.shared_goal_id as string)
    .filter(Boolean);
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
  const followingAuthorIds = new Set(followingIds);
  followingIds.push(userId);

  const sharedGoalIds = await mySharedGoalIds(supabase, userId);
  const sharedGoalSet = new Set(sharedGoalIds);

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
    .limit(limit * 3);

  if (options.cursor) {
    query = query.lt("created_at", options.cursor);
  }

  const { data: posts, error } = await query;
  if (error) throw error;

  const filtered = (posts ?? []).filter((post) => {
    if (blockedIds.has(post.user_id)) return false;
    if (followingIds.includes(post.user_id)) return true;
    if (sharedGoalSet.has(post.goal_id as string)) return true;
    const goal = normalizeRelation(post.goals) as { category: string } | null;
    return goal?.category && categories.includes(goal.category);
  });

  const sliced = filtered.slice(0, limit);
  return mapPostRows(supabase, sliced as PostRow[], limit, followingAuthorIds);
}

/**
 * Community feed: posts from members whose goal category matches this community.
 * (Joining ties you to a shared goal for display; any post in that category counts.)
 */
export async function getCommunityFeed(
  supabase: SupabaseClient,
  category: string,
  options: { cursor?: string; limit?: number } = {}
) {
  const limit = Math.min(options.limit ?? DEFAULT_LIMIT, 50);

  const { data: community, error: communityError } = await supabase
    .from("goal_communities")
    .select("id")
    .eq("category", category)
    .single();

  if (communityError || !community) {
    return { posts: [], nextCursor: null };
  }

  const { data: memberships, error: memberError } = await supabase
    .from("community_memberships")
    .select("user_id")
    .eq("community_id", community.id);

  if (memberError) throw memberError;
  if (!memberships?.length) {
    return { posts: [], nextCursor: null };
  }

  const memberIds = [...new Set(memberships.map((m) => m.user_id as string))];

  let query = supabase
    .from("posts")
    .select(POST_SELECT)
    .in("user_id", memberIds)
    .eq("goals.category", category)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (options.cursor) {
    query = query.lt("created_at", options.cursor);
  }

  const { data: posts, error } = await query;
  if (error) throw error;

  return mapPostRows(supabase, (posts ?? []) as PostRow[], limit);
}

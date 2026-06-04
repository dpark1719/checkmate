import type { SupabaseClient } from "@supabase/supabase-js";
import { localDayUtcBounds } from "@checkmate/shared";
import { signAvatarUrls, signPhotoUrls } from "./storage";

function normalizeRelation<T>(value: T | T[] | null): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

type GalleryPostRow = {
  id: string;
  user_id: string;
  goal_id: string;
  photo_url: string;
  caption: string | null;
  is_late: boolean;
  created_at: string;
  profiles: unknown;
  goals: unknown;
};

const GALLERY_POST_SELECT = `
  id, user_id, goal_id, photo_url, caption, is_late, created_at,
  profiles(display_name, username, avatar_url),
  goals!posts_goal_id_fkey(title, category)
`;

async function mapGalleryPostRows(
  supabase: SupabaseClient,
  rows: GalleryPostRow[]
) {
  const photoPaths = rows.map((p) => p.photo_url as string);
  const avatarPaths = rows
    .map((p) => {
      const profile = normalizeRelation(p.profiles) as {
        avatar_url: string | null;
      } | null;
      return profile?.avatar_url ?? "";
    })
    .filter(Boolean);

  const [signedPhotos, signedAvatars] = await Promise.all([
    signPhotoUrls(supabase, photoPaths),
    signAvatarUrls(supabase, avatarPaths),
  ]);

  return rows.map((post) => {
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
      photoUrl: signedPhotos.get(post.photo_url as string) ?? post.photo_url,
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
    };
  });
}

export async function getUserPosts(
  supabase: SupabaseClient,
  userId: string,
  options: {
    cursor?: string;
    limit?: number;
    date?: string;
    timezone?: string;
  } = {}
) {
  const limit = Math.min(options.limit ?? 20, 50);

  let query = supabase
    .from("posts")
    .select(GALLERY_POST_SELECT)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (options.date && options.timezone) {
    const { start, end } = localDayUtcBounds(options.date, options.timezone);
    query = query.gte("created_at", start).lt("created_at", end);
  }

  if (options.cursor) {
    query = query.lt("created_at", options.cursor);
  }

  const { data, error } = await query;
  if (error) throw error;

  const posts = await mapGalleryPostRows(supabase, (data ?? []) as GalleryPostRow[]);

  return {
    posts,
    nextCursor: posts.length === limit ? posts[posts.length - 1]?.createdAt : null,
  };
}

export async function getGoalPosts(
  supabase: SupabaseClient,
  userId: string,
  goalId: string,
  options: { cursor?: string; limit?: number } = {}
) {
  const { data: goal, error: goalError } = await supabase
    .from("goals")
    .select("id, title, category, user_id")
    .eq("id", goalId)
    .eq("user_id", userId)
    .maybeSingle();

  if (goalError) throw goalError;
  if (!goal) return null;

  const limit = Math.min(options.limit ?? 20, 50);

  let query = supabase
    .from("posts")
    .select(GALLERY_POST_SELECT)
    .eq("user_id", userId)
    .eq("goal_id", goalId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (options.cursor) {
    query = query.lt("created_at", options.cursor);
  }

  const { data, error } = await query;
  if (error) throw error;

  const posts = await mapGalleryPostRows(supabase, (data ?? []) as GalleryPostRow[]);

  return {
    goal: {
      id: goal.id,
      title: goal.title,
      category: goal.category,
    },
    posts,
    nextCursor: posts.length === limit ? posts[posts.length - 1]?.createdAt : null,
  };
}

export async function updatePost(
  supabase: SupabaseClient,
  userId: string,
  postId: string,
  input: { caption?: string | null; photoUrl?: string }
) {
  const { data: existing, error: fetchError } = await supabase
    .from("posts")
    .select("id, photo_url")
    .eq("id", postId)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .single();

  if (fetchError || !existing) {
    return { error: "NOT_FOUND" as const };
  }

  const updates: { caption?: string | null; photo_url?: string } = {};
  if (input.caption !== undefined) updates.caption = input.caption;
  if (input.photoUrl !== undefined) updates.photo_url = input.photoUrl;

  if (Object.keys(updates).length === 0) {
    return { error: "VALIDATION_ERROR" as const };
  }

  const { data, error } = await supabase
    .from("posts")
    .update(updates)
    .eq("id", postId)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .select(GALLERY_POST_SELECT)
    .single();

  if (error || !data) {
    return { error: "DB_ERROR" as const, message: error?.message };
  }

  const [post] = await mapGalleryPostRows(supabase, [data as GalleryPostRow]);
  return { post };
}

import type { CompleteGoalInput, GoalCategory } from "@checkmate/shared";
import { normalizeGoalTitle } from "@checkmate/shared";
import type { SupabaseClient } from "@supabase/supabase-js";
import { pruneOrphanDailyChallenges } from "./daily-challenges";
import { signPhotoUrls } from "./storage";

export interface GoalStats {
  daysActive: number;
  checkInCount: number;
  currentStreak: number;
  longestStreak: number;
  completionDate: string | null;
}

export interface GoalProgressSummary {
  targetEndDate: string | null;
  daysRemaining: number | null;
  daysElapsed: number;
  percentTimeElapsed: number | null;
  stats: GoalStats;
}

export interface GoalComparisonPost {
  id: string;
  photoUrl: string;
  createdAt: string;
}

export interface CompletedGoalCard {
  id: string;
  title: string;
  category: string;
  completedAt: string;
  completionNote: string | null;
  stats: GoalStats;
  startPost: GoalComparisonPost | null;
  endPost: GoalComparisonPost | null;
  user: {
    id: string;
    displayName: string;
    username: string;
    avatarUrl: string | null;
  };
}

export interface ActiveSimilarGoal {
  id: string;
  title: string;
  category: string;
  targetEndDate: string | null;
  checkInCount: number;
  currentStreak: number;
  user: {
    id: string;
    displayName: string;
    username: string;
    avatarUrl: string | null;
  };
}

type GoalRow = {
  id: string;
  user_id: string;
  title: string;
  category: string;
  created_at: string;
  target_end_date: string | null;
  completed_at: string | null;
  completion_note: string | null;
  start_post_id: string | null;
  end_post_id: string | null;
  archived_at: string | null;
  is_active: boolean;
};

type StreakRow = {
  current_count: number;
  longest_count: number;
};

type PostRow = {
  id: string;
  photo_url: string;
  created_at: string;
};

function parseDateOnly(value: string): Date {
  return new Date(`${value.slice(0, 10)}T00:00:00`);
}

function isMissingGoalCompletionSchema(error: { message?: string } | null): boolean {
  const msg = error?.message ?? "";
  return (
    msg.includes("target_end_date") ||
    msg.includes("completed_at") ||
    msg.includes("completion_note") ||
    msg.includes("start_post_id") ||
    msg.includes("end_post_id")
  );
}

const GOAL_DETAIL_SELECT =
  "id, user_id, title, category, created_at, target_end_date, completed_at, completion_note, start_post_id, end_post_id, archived_at, is_active";

const GOAL_DETAIL_SELECT_BASIC =
  "id, user_id, title, category, created_at, archived_at, is_active";

function daysBetweenInclusive(start: Date, end: Date): number {
  const startDay = new Date(start);
  startDay.setHours(0, 0, 0, 0);
  const endDay = new Date(end);
  endDay.setHours(0, 0, 0, 0);
  const diff = endDay.getTime() - startDay.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

export function computeGoalStats(
  goal: { created_at: string; completed_at?: string | null },
  checkInCount: number,
  streak: StreakRow | null
): GoalStats {
  const start = new Date(goal.created_at);
  const end = goal.completed_at ? new Date(goal.completed_at) : new Date();
  const daysActive = daysBetweenInclusive(start, end);
  return {
    daysActive: checkInCount > 0 ? Math.max(daysActive, 1) : daysActive,
    checkInCount,
    currentStreak: streak?.current_count ?? 0,
    longestStreak: streak?.longest_count ?? 0,
    completionDate: goal.completed_at ?? null,
  };
}

export function buildGoalProgressSummary(
  goal: GoalRow,
  checkInCount: number,
  streak: StreakRow | null
): GoalProgressSummary {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const created = new Date(goal.created_at);
  created.setHours(0, 0, 0, 0);

  let daysRemaining: number | null = null;
  let percentTimeElapsed: number | null = null;
  let daysElapsed = daysBetweenInclusive(created, today);

  if (goal.target_end_date) {
    const target = parseDateOnly(String(goal.target_end_date));
    daysRemaining = daysBetweenInclusive(today, target);
    const totalDays = daysBetweenInclusive(created, target);
    if (totalDays > 0) {
      percentTimeElapsed = Math.min(
        100,
        Math.round((daysElapsed / totalDays) * 100)
      );
    } else {
      percentTimeElapsed = today >= target ? 100 : 0;
    }
  }

  return {
    targetEndDate: goal.target_end_date,
    daysRemaining,
    daysElapsed,
    percentTimeElapsed,
    stats: computeGoalStats(goal, checkInCount, streak),
  };
}

async function fetchGoalPostBounds(
  supabase: SupabaseClient,
  userId: string,
  goalId: string
): Promise<{ first: PostRow | null; last: PostRow | null; count: number }> {
  const { count, error: countError } = await supabase
    .from("posts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("goal_id", goalId)
    .is("deleted_at", null);

  if (countError) throw countError;

  const { data: firstRows, error: firstError } = await supabase
    .from("posts")
    .select("id, photo_url, created_at")
    .eq("user_id", userId)
    .eq("goal_id", goalId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true })
    .limit(1);

  if (firstError) throw firstError;

  const { data: lastRows, error: lastError } = await supabase
    .from("posts")
    .select("id, photo_url, created_at")
    .eq("user_id", userId)
    .eq("goal_id", goalId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(1);

  if (lastError) throw lastError;

  return {
    first: (firstRows?.[0] as PostRow | undefined) ?? null,
    last: (lastRows?.[0] as PostRow | undefined) ?? null,
    count: count ?? 0,
  };
}

async function fetchPostForGoal(
  supabase: SupabaseClient,
  userId: string,
  goalId: string,
  postId: string
): Promise<PostRow | null> {
  const { data, error } = await supabase
    .from("posts")
    .select("id, photo_url, created_at")
    .eq("id", postId)
    .eq("user_id", userId)
    .eq("goal_id", goalId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw error;
  return (data as PostRow | null) ?? null;
}

async function mapComparisonPosts(
  supabase: SupabaseClient,
  start: PostRow | null,
  end: PostRow | null
): Promise<{
  startPost: GoalComparisonPost | null;
  endPost: GoalComparisonPost | null;
}> {
  const paths = [start?.photo_url, end?.photo_url].filter(Boolean) as string[];
  let signed = new Map<string, string>();
  try {
    if (paths.length) {
      signed = await signPhotoUrls(supabase, paths);
    }
  } catch {
    // Fall back to stored paths if signing fails.
  }

  return {
    startPost: start
      ? {
          id: start.id,
          photoUrl: signed.get(start.photo_url) ?? start.photo_url,
          createdAt: start.created_at,
        }
      : null,
    endPost: end
      ? {
          id: end.id,
          photoUrl: signed.get(end.photo_url) ?? end.photo_url,
          createdAt: end.created_at,
        }
      : null,
  };
}

export async function getGoalDetailForOwner(
  supabase: SupabaseClient,
  userId: string,
  goalId: string
) {
  let { data: goal, error } = await supabase
    .from("goals")
    .select(GOAL_DETAIL_SELECT)
    .eq("id", goalId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error && isMissingGoalCompletionSchema(error)) {
    ({ data: goal, error } = await supabase
      .from("goals")
      .select(GOAL_DETAIL_SELECT_BASIC)
      .eq("id", goalId)
      .eq("user_id", userId)
      .maybeSingle());
  }

  if (error) throw error;
  if (!goal) return null;

  const goalRow = {
    ...(goal as GoalRow),
    target_end_date: (goal as GoalRow).target_end_date ?? null,
    completed_at: (goal as GoalRow).completed_at ?? null,
    completion_note: (goal as GoalRow).completion_note ?? null,
    start_post_id: (goal as GoalRow).start_post_id ?? null,
    end_post_id: (goal as GoalRow).end_post_id ?? null,
  } as GoalRow;
  const { count } = await fetchGoalPostBounds(supabase, userId, goalId);

  const { data: streakRow } = await supabase
    .from("streaks")
    .select("current_count, longest_count")
    .eq("user_id", userId)
    .eq("goal_id", goalId)
    .maybeSingle();

  const progress = buildGoalProgressSummary(
    goalRow,
    count,
    (streakRow as StreakRow | null) ?? null
  );

  let startPost: GoalComparisonPost | null = null;
  let endPost: GoalComparisonPost | null = null;

  if (goalRow.completed_at) {
    let start =
      goalRow.start_post_id
        ? await fetchPostForGoal(supabase, userId, goalId, goalRow.start_post_id)
        : null;
    let end =
      goalRow.end_post_id
        ? await fetchPostForGoal(supabase, userId, goalId, goalRow.end_post_id)
        : null;

    if (!start || !end) {
      const bounds = await fetchGoalPostBounds(supabase, userId, goalId);
      if (!start) start = bounds.first;
      if (!end) end = bounds.last;
    }

    const mapped = await mapComparisonPosts(supabase, start, end);
    startPost = mapped.startPost;
    endPost = mapped.endPost;
  }

  return {
    goal: {
      id: goalRow.id,
      title: goalRow.title,
      category: goalRow.category,
      targetEndDate: goalRow.target_end_date,
      completedAt: goalRow.completed_at,
      completionNote: goalRow.completion_note,
      isActive: goalRow.is_active,
      archivedAt: goalRow.archived_at,
    },
    progress,
    startPost,
    endPost,
  };
}

export async function completeGoal(
  supabase: SupabaseClient,
  userId: string,
  goalId: string,
  input: CompleteGoalInput,
  timezone: string
): Promise<
  | { error: "NOT_FOUND" }
  | { error: "INVALID_STATE"; message: string }
  | { error: "VALIDATION"; message: string }
  | { goal: GoalRow; stats: GoalStats; startPost: GoalComparisonPost | null; endPost: GoalComparisonPost | null }
> {
  const { data: goal, error: goalError } = await supabase
    .from("goals")
    .select(
      "id, user_id, title, category, created_at, target_end_date, completed_at, archived_at, is_active"
    )
    .eq("id", goalId)
    .eq("user_id", userId)
    .maybeSingle();

  if (goalError) throw goalError;
  if (!goal) return { error: "NOT_FOUND" };

  const goalRow = goal as GoalRow;
  if (goalRow.completed_at) {
    return { error: "INVALID_STATE", message: "Goal is already completed" };
  }
  if (goalRow.archived_at) {
    return { error: "INVALID_STATE", message: "Goal is archived" };
  }
  if (!goalRow.target_end_date) {
    return { error: "VALIDATION", message: "Set a target end date before completing" };
  }

  const { first, last, count } = await fetchGoalPostBounds(
    supabase,
    userId,
    goalId
  );

  let startPost = first;
  let endPost = last;

  if (input.startPostId) {
    const chosen = await fetchPostForGoal(
      supabase,
      userId,
      goalId,
      input.startPostId
    );
    if (!chosen) {
      return { error: "VALIDATION", message: "Invalid start photo" };
    }
    startPost = chosen;
  }

  if (input.endPostId) {
    const chosen = await fetchPostForGoal(
      supabase,
      userId,
      goalId,
      input.endPostId
    );
    if (!chosen) {
      return { error: "VALIDATION", message: "Invalid end photo" };
    }
    endPost = chosen;
  }

  const completedAt = new Date().toISOString();

  const { data: updated, error: updateError } = await supabase
    .from("goals")
    .update({
      completed_at: completedAt,
      is_active: false,
      completion_note: input.completionNote ?? null,
      start_post_id: startPost?.id ?? null,
      end_post_id: endPost?.id ?? null,
    })
    .eq("id", goalId)
    .eq("user_id", userId)
    .select(
      "id, user_id, title, category, created_at, target_end_date, completed_at, completion_note, start_post_id, end_post_id, archived_at, is_active"
    )
    .single();

  if (updateError || !updated) {
    throw new Error(updateError?.message ?? "Failed to complete goal");
  }

  await supabase
    .from("community_memberships")
    .update({ shared_goal_id: null })
    .eq("shared_goal_id", goalId);

  try {
    await pruneOrphanDailyChallenges(userId, timezone, supabase);
  } catch {
    // Non-fatal
  }

  const { data: streakRow } = await supabase
    .from("streaks")
    .select("current_count, longest_count")
    .eq("user_id", userId)
    .eq("goal_id", goalId)
    .maybeSingle();

  const stats = computeGoalStats(
    { ...goalRow, completed_at: completedAt },
    count,
    (streakRow as StreakRow | null) ?? null
  );

  const mapped = await mapComparisonPosts(supabase, startPost, endPost);

  return {
    goal: updated as GoalRow,
    stats,
    startPost: mapped.startPost,
    endPost: mapped.endPost,
  };
}

async function buildCompletedGoalCard(
  supabase: SupabaseClient,
  goal: GoalRow,
  profile: {
    id: string;
    display_name: string;
    username: string;
    avatar_url: string | null;
  }
): Promise<CompletedGoalCard> {
  const userId = goal.user_id;
  const [bounds, streakResult, start, end] = await Promise.all([
    fetchGoalPostBounds(supabase, userId, goal.id),
    supabase
      .from("streaks")
      .select("current_count, longest_count")
      .eq("user_id", userId)
      .eq("goal_id", goal.id)
      .maybeSingle(),
    goal.start_post_id
      ? fetchPostForGoal(supabase, userId, goal.id, goal.start_post_id)
      : Promise.resolve(null),
    goal.end_post_id
      ? fetchPostForGoal(supabase, userId, goal.id, goal.end_post_id)
      : Promise.resolve(null),
  ]);

  const startPost = start ?? bounds.first;
  const endPost = end ?? bounds.last;
  const mapped = await mapComparisonPosts(supabase, startPost, endPost);

  return {
    id: goal.id,
    title: goal.title,
    category: goal.category,
    completedAt: goal.completed_at as string,
    completionNote: goal.completion_note,
    stats: computeGoalStats(
      goal,
      bounds.count,
      (streakResult.data as StreakRow | null) ?? null
    ),
    startPost: mapped.startPost,
    endPost: mapped.endPost,
    user: {
      id: profile.id,
      displayName: profile.display_name,
      username: profile.username,
      avatarUrl: profile.avatar_url,
    },
  };
}

export async function getSimilarGoals(
  supabase: SupabaseClient,
  options: {
    title: string;
    category: GoalCategory;
    status: "completed" | "active";
    excludeUserId?: string;
    limit?: number;
  }
): Promise<{ completed: CompletedGoalCard[]; active: ActiveSimilarGoal[] }> {
  const normalized = normalizeGoalTitle(options.title);
  const limit = Math.min(options.limit ?? 10, 20);

  let query = supabase
    .from("goals")
    .select(
      "id, user_id, title, category, created_at, target_end_date, completed_at, completion_note, start_post_id, end_post_id, archived_at, is_active, profiles(id, display_name, username, avatar_url)"
    )
    .eq("category", options.category)
    .is("archived_at", null);

  if (options.status === "completed") {
    query = query.not("completed_at", "is", null).order("completed_at", {
      ascending: false,
    });
  } else {
    query = query
      .eq("is_active", true)
      .is("completed_at", null)
      .order("created_at", { ascending: false });
  }

  const { data, error } = await query.limit(limit * 3);
  if (error) throw error;

  const filtered = (data ?? []).filter((row) => {
    const goal = row as GoalRow & { profiles: unknown };
    if (options.excludeUserId && goal.user_id === options.excludeUserId) {
      return false;
    }
    return normalizeGoalTitle(goal.title) === normalized;
  });

  if (options.status === "completed") {
    const completed: CompletedGoalCard[] = [];
    for (const row of filtered.slice(0, limit)) {
      const goal = row as GoalRow & {
        profiles:
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
      };
      const prof = Array.isArray(goal.profiles) ? goal.profiles[0] : goal.profiles;
      if (!prof) continue;
      completed.push(await buildCompletedGoalCard(supabase, goal, prof));
    }
    return { completed, active: [] };
  }

  const active: ActiveSimilarGoal[] = [];
  for (const row of filtered.slice(0, limit)) {
    const goal = row as GoalRow & {
      profiles:
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
    };
    const prof = Array.isArray(goal.profiles) ? goal.profiles[0] : goal.profiles;
    if (!prof) continue;

    const { count } = await fetchGoalPostBounds(supabase, goal.user_id, goal.id);
    const { data: streakRow } = await supabase
      .from("streaks")
      .select("current_count")
      .eq("user_id", goal.user_id)
      .eq("goal_id", goal.id)
      .maybeSingle();

    active.push({
      id: goal.id,
      title: goal.title,
      category: goal.category,
      targetEndDate: goal.target_end_date,
      checkInCount: count,
      currentStreak: (streakRow as { current_count: number } | null)?.current_count ?? 0,
      user: {
        id: prof.id,
        displayName: prof.display_name,
        username: prof.username,
        avatarUrl: prof.avatar_url,
      },
    });
  }

  return { completed: [], active };
}

export async function getCompletedGoalsForUser(
  supabase: SupabaseClient,
  userId: string,
  limit = 10
): Promise<CompletedGoalCard[]> {
  const { data, error } = await supabase
    .from("goals")
    .select(
      "id, user_id, title, category, created_at, target_end_date, completed_at, completion_note, start_post_id, end_post_id, archived_at, is_active, profiles(id, display_name, username, avatar_url)"
    )
    .eq("user_id", userId)
    .not("completed_at", "is", null)
    .is("archived_at", null)
    .order("completed_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  const cards: CompletedGoalCard[] = [];
  for (const row of data ?? []) {
    const goal = row as GoalRow & {
      profiles:
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
    };
    const prof = Array.isArray(goal.profiles) ? goal.profiles[0] : goal.profiles;
    if (!prof) continue;
    cards.push(await buildCompletedGoalCard(supabase, goal, prof));
  }

  return cards;
}

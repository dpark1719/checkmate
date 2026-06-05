import type { SupabaseClient } from "@supabase/supabase-js";
import { getAdminClient } from "./supabase";

const MIN_COMMUNITY_SIZE = 3;

function weekStartUtc(): string {
  const now = new Date();
  const day = now.getUTCDay();
  const diff = day === 0 ? 6 : day - 1;
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() - diff);
  monday.setUTCHours(0, 0, 0, 0);
  return monday.toISOString().slice(0, 10);
}

export async function refreshLeaderboards(
  supabase: SupabaseClient = getAdminClient()
): Promise<{ rows: number }> {
  const { data: streaks, error } = await supabase
    .from("streaks")
    .select(
      `
      user_id, goal_id, current_count, longest_count,
      goals!inner(category, is_active),
      profiles!inner(region)
    `
    )
    .eq("goals.is_active", true);

  if (error) throw error;

  const weekStart = weekStartUtc();
  let upserted = 0;

  for (const row of streaks ?? []) {
    const goal = normalizeGoal(row.goals);
    const profile = normalizeProfile(row.profiles);
    if (!goal || !profile) continue;

    const category = goal.category;
    const score = row.current_count;
    const postCount = row.current_count;

    for (const period of ["weekly", "all_time"] as const) {
      for (const region of [null, profile.region] as (string | null)[]) {
        if (region) {
          const { count } = await supabase
            .from("profiles")
            .select("*", { count: "exact", head: true })
            .eq("region", region);
          if ((count ?? 0) < MIN_COMMUNITY_SIZE) continue;
        }

        const { count: members } = await supabase
          .from("goals")
          .select("*", { count: "exact", head: true })
          .eq("category", category)
          .eq("is_active", true);

        if ((members ?? 0) < MIN_COMMUNITY_SIZE) continue;

        await supabase.from("leaderboards").upsert(
          {
            user_id: row.user_id,
            goal_id: row.goal_id,
            category,
            region,
            period,
            week_start: period === "weekly" ? weekStart : null,
            streak_count: row.current_count,
            post_count: postCount,
            score,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "user_id,goal_id,category,region,period,week_start",
          }
        );
        upserted++;
      }
    }
  }

  return { rows: upserted };
}

export async function resetWeeklyLeaderboards(
  supabase: SupabaseClient = getAdminClient()
): Promise<void> {
  const weekStart = weekStartUtc();
  await supabase
    .from("leaderboards")
    .delete()
    .eq("period", "weekly")
    .neq("week_start", weekStart);
}

export async function getLeaderboard(
  supabase: SupabaseClient,
  category: string,
  period: "weekly" | "all_time",
  region: string | null,
  limit = 50
) {
  const weekStart = weekStartUtc();

  let query = supabase
    .from("leaderboards")
    .select(
      `
      score, streak_count, post_count, user_id, goal_id,
      profiles(display_name, username, avatar_url),
      goals(title)
    `
    )
    .eq("category", category)
    .eq("period", period)
    .order("score", { ascending: false })
    .limit(limit);

  if (period === "weekly") {
    query = query.eq("week_start", weekStart);
  }

  if (region) {
    const { count } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("region", region);

    if ((count ?? 0) >= MIN_COMMUNITY_SIZE) {
      query = query.eq("region", region);
    } else {
      query = query.is("region", null);
    }
  } else {
    query = query.is("region", null);
  }

  const { data, error } = await query;
  if (error) throw error;

  if ((data ?? []).length > 0) {
    return mapLeaderboardTableRows(data ?? []);
  }

  if (period === "weekly") {
    return getStreaksFromWeeklyPosts(supabase, weekStart, limit, category);
  }

  return getCategoryStreaksFromTable(supabase, category, limit);
}

function mapLeaderboardTableRows(
  data: Array<{
    user_id: string;
    goal_id: string;
    score: number;
    streak_count: number;
    post_count: number;
    profiles: unknown;
    goals: unknown;
  }>
) {
  return data.map((row, index) => {
    const profile = normalizeProfile(row.profiles);
    const goal = normalizeGoal(row.goals);
    return {
      rank: index + 1,
      userId: row.user_id,
      goalId: row.goal_id,
      score: row.score,
      streakCount: row.streak_count,
      postCount: row.post_count,
      displayName: profile?.display_name ?? "User",
      username: profile?.username ?? "user",
      avatarUrl: profile?.avatar_url ?? null,
      goalTitle: goal?.title,
      goalCategory: goal?.category ?? "other",
    };
  });
}

async function getCategoryStreaksFromTable(
  supabase: SupabaseClient,
  category: string,
  limit: number
) {
  const { data, error } = await supabase
    .from("streaks")
    .select(
      `
      user_id, goal_id, current_count, longest_count,
      goals!inner(title, category, is_active),
      profiles!inner(display_name, username, avatar_url)
    `
    )
    .eq("goals.category", category)
    .eq("goals.is_active", true)
    .or("current_count.gt.0,longest_count.gt.0")
    .order("longest_count", { ascending: false })
    .order("current_count", { ascending: false })
    .limit(limit * 3);

  if (error) throw error;

  const userBest = new Map<
    string,
    {
      score: number;
      row: (typeof data)[number];
    }
  >();

  for (const row of data ?? []) {
    const userId = row.user_id as string;
    const score = Math.max(
      row.current_count as number,
      row.longest_count as number
    );
    const existing = userBest.get(userId);
    if (!existing || score > existing.score) {
      userBest.set(userId, { score, row });
    }
  }

  return [...userBest.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item, index) => {
      const profile = normalizeProfile(item.row.profiles);
      const goal = normalizeGoal(item.row.goals);
      return {
        rank: index + 1,
        userId: item.row.user_id as string,
        goalId: item.row.goal_id as string,
        score: item.score,
        streakCount: item.score,
        postCount: item.score,
        displayName: profile?.display_name ?? "User",
        username: profile?.username ?? "user",
        avatarUrl: profile?.avatar_url ?? null,
        goalTitle: goal?.title,
        goalCategory: goal?.category ?? category,
      };
    });
}

export async function getTopWeeklyStreaks(
  supabase: SupabaseClient,
  limit = 3
) {
  const weekStart = weekStartUtc();

  const { data, error } = await supabase
    .from("leaderboards")
    .select(
      `
      user_id, score, streak_count, category,
      profiles(display_name, username, avatar_url),
      goals(title, category)
    `
    )
    .eq("period", "weekly")
    .eq("week_start", weekStart)
    .is("region", null)
    .order("score", { ascending: false })
    .limit(limit);

  if (error) throw error;

  if ((data ?? []).length > 0) {
    return mapTopStreakRows(data ?? []);
  }

  // Streak counts are reconciled at midnight; until then current_count is often 0.
  const { data: streakRows, error: streakError } = await supabase
    .from("streaks")
    .select(
      `
      user_id, goal_id, current_count, longest_count,
      goals!inner(title, category, is_active),
      profiles!inner(display_name, username, avatar_url)
    `
    )
    .eq("goals.is_active", true)
    .or("current_count.gt.0,longest_count.gt.0")
    .order("current_count", { ascending: false })
    .order("longest_count", { ascending: false })
    .limit(limit);

  if (streakError) throw streakError;

  if ((streakRows ?? []).length > 0) {
    return (streakRows ?? []).map((row, index) => {
      const profile = normalizeProfile(row.profiles);
      const goal = normalizeGoal(row.goals);
      const count = Math.max(
        row.current_count as number,
        row.longest_count as number
      );
      return {
        rank: index + 1,
        userId: row.user_id as string,
        score: count,
        streakCount: count,
        displayName: profile?.display_name ?? "User",
        username: profile?.username ?? "user",
        avatarUrl: profile?.avatar_url ?? null,
        goalTitle: goal?.title,
        goalCategory: goal?.category ?? "other",
      };
    });
  }

  // Fall back to this week's posts when denormalized data is not ready.
  return getStreaksFromWeeklyPosts(supabase, weekStart, limit);
}

async function getStreaksFromWeeklyPosts(
  supabase: SupabaseClient,
  weekStart: string,
  limit: number,
  category?: string
) {
  let query = supabase
    .from("posts")
    .select(
      `
      user_id, goal_id,
      profiles!inner(display_name, username, avatar_url),
      goals!posts_goal_id_fkey(title, category, is_active)
    `
    )
    .is("deleted_at", null)
    .gte("created_at", `${weekStart}T00:00:00.000Z`)
    .eq("goals.is_active", true);

  if (category) {
    query = query.eq("goals.category", category);
  }

  const { data, error } = await query;
  if (error) throw error;
  if (!data?.length) return [];

  const goalCounts = new Map<
    string,
    { count: number; row: (typeof data)[number] }
  >();
  for (const row of data) {
    const key = `${row.user_id}:${row.goal_id}`;
    const entry = goalCounts.get(key);
    if (entry) entry.count += 1;
    else goalCounts.set(key, { count: 1, row });
  }

  const userBest = new Map<
    string,
    { count: number; row: (typeof data)[number] }
  >();
  for (const { count, row } of goalCounts.values()) {
    const userId = row.user_id as string;
    const existing = userBest.get(userId);
    if (!existing || count > existing.count) {
      userBest.set(userId, { count, row });
    }
  }

  return [...userBest.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map((item, index) => {
      const profile = normalizeProfile(item.row.profiles);
      const goal = normalizeGoal(item.row.goals);
      return {
        rank: index + 1,
        userId: item.row.user_id as string,
        goalId: item.row.goal_id as string,
        score: item.count,
        streakCount: item.count,
        postCount: item.count,
        displayName: profile?.display_name ?? "User",
        username: profile?.username ?? "user",
        avatarUrl: profile?.avatar_url ?? null,
        goalTitle: goal?.title,
        goalCategory: goal?.category ?? category ?? "other",
      };
    });
}

function mapTopStreakRows(
  data: Array<{
    user_id: string;
    score: number;
    streak_count: number;
    category: string;
    profiles: unknown;
    goals: unknown;
  }>
) {
  return data.map((row, index) => {
    const profile = normalizeProfile(row.profiles);
    const goal = normalizeGoal(row.goals);
    return {
      rank: index + 1,
      userId: row.user_id,
      score: row.score,
      streakCount: row.streak_count,
      displayName: profile?.display_name ?? "User",
      username: profile?.username ?? "user",
      avatarUrl: profile?.avatar_url ?? null,
      goalTitle: goal?.title,
      goalCategory: goal?.category ?? row.category,
    };
  });
}

function normalizeGoal(value: unknown): { category: string; title?: string } | null {
  if (!value) return null;
  const g = Array.isArray(value) ? value[0] : value;
  return g as { category: string; title?: string };
}

function normalizeProfile(
  value: unknown
): {
  display_name: string;
  username: string;
  avatar_url: string | null;
  region: string | null;
} | null {
  if (!value) return null;
  const p = Array.isArray(value) ? value[0] : value;
  return p as {
    display_name: string;
    username: string;
    avatar_url: string | null;
    region: string | null;
  };
}

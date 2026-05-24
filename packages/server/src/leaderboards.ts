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

  return (data ?? []).map((row, index) => {
    const profile = normalizeProfile(row.profiles);
    const goal = normalizeGoal(row.goals);
    return {
      rank: index + 1,
      userId: row.user_id,
      goalId: row.goal_id,
      score: row.score,
      streakCount: row.streak_count,
      postCount: row.post_count,
      displayName: profile?.display_name,
      username: profile?.username,
      avatarUrl: profile?.avatar_url,
      goalTitle: goal?.title,
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

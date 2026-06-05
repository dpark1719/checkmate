import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveAvatarUrl } from "@checkmate/server";

export interface LeaderboardApiEntry {
  rank: number;
  displayName: string;
  username: string;
  avatarUrl: string | null;
  goalCategory: string;
  goalTitle: string | null;
  streakDays: number;
}

export async function formatLeaderboardEntries(
  supabase: SupabaseClient,
  rows: Array<{
    rank: number;
    displayName: string;
    username: string;
    avatarUrl: string | null;
    goalCategory: string;
    goalTitle?: string | null;
    streakCount: number;
  }>
): Promise<LeaderboardApiEntry[]> {
  return Promise.all(
    rows.map(async (row) => ({
      rank: row.rank,
      displayName: row.displayName,
      username: row.username,
      avatarUrl: await resolveAvatarUrl(supabase, row.avatarUrl),
      goalCategory: row.goalCategory,
      goalTitle: row.goalTitle ?? null,
      streakDays: row.streakCount,
    }))
  );
}

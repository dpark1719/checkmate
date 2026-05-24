import { todayInTimezone } from "@goalpost/shared";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getAdminClient } from "./supabase";

/** Midnight reconciliation for one user — mark missed, update streaks. */
export async function reconcileStreaksForUser(
  userId: string,
  timezone: string,
  supabase: SupabaseClient = getAdminClient()
): Promise<void> {
  const yesterday = yesterdayInTimezone(timezone);

  const { data: missed } = await supabase
    .from("daily_challenges")
    .select("id, goal_id")
    .eq("user_id", userId)
    .eq("date", yesterday)
    .eq("streak_credited", false);

  for (const challenge of missed ?? []) {
    const { data: streak } = await supabase
      .from("streaks")
      .select("*")
      .eq("user_id", userId)
      .eq("goal_id", challenge.goal_id)
      .single();

    if (streak) {
      await supabase
        .from("streaks")
        .update({ current_count: 0 })
        .eq("id", streak.id);
    }
  }

  const { data: credited } = await supabase
    .from("daily_challenges")
    .select("goal_id")
    .eq("user_id", userId)
    .eq("date", yesterday)
    .eq("streak_credited", true);

  for (const row of credited ?? []) {
    const { data: streak } = await supabase
      .from("streaks")
      .select("*")
      .eq("user_id", userId)
      .eq("goal_id", row.goal_id)
      .single();

    if (!streak) continue;

    const newCount = streak.current_count + 1;
    await supabase
      .from("streaks")
      .update({
        current_count: newCount,
        longest_count: Math.max(streak.longest_count, newCount),
        last_credited_date: yesterday,
      })
      .eq("id", streak.id);
  }
}

function yesterdayInTimezone(timezone: string): string {
  const today = todayInTimezone(timezone);
  const d = new Date(`${today}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return todayInTimezone(timezone, d);
}

export async function reconcileAllStreaks(): Promise<number> {
  const supabase = getAdminClient();
  const { data: profiles } = await supabase.from("profiles").select("id, timezone");

  for (const p of profiles ?? []) {
    await reconcileStreaksForUser(p.id, p.timezone, supabase);
  }
  return profiles?.length ?? 0;
}

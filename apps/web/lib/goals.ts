import { MAX_ACTIVE_GOALS } from "@goalpost/shared";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function countActiveGoals(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const { count, error } = await supabase
    .from("goals")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_active", true)
    .is("archived_at", null);

  if (error) throw error;
  return count ?? 0;
}

export function assertCanAddGoal(activeCount: number) {
  if (activeCount >= MAX_ACTIVE_GOALS) {
    return {
      ok: false as const,
      error: `Maximum ${MAX_ACTIVE_GOALS} active goals allowed`,
      code: "MAX_GOALS_REACHED",
    };
  }
  return { ok: true as const };
}

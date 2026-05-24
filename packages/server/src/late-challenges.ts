import { getAdminClient } from "./supabase";

/** Mark challenges as late when leeway has passed without a credited post. */
export async function markExpiredChallengesAsLate(): Promise<number> {
  const supabase = getAdminClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("daily_challenges")
    .update({ is_late: true })
    .is("posted_at", null)
    .not("leeway_expires_at", "is", null)
    .lt("leeway_expires_at", now)
    .eq("is_late", false)
    .select("id");

  if (error) throw error;
  return data?.length ?? 0;
}

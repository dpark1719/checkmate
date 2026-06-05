import { getAdminClient, getTopWeeklyStreaks, resolveAvatarUrl } from "@checkmate/server";
import { jsonError, jsonOk } from "@/lib/api/response";

export async function GET() {
  const supabase = getAdminClient();

  try {
    const rows = await getTopWeeklyStreaks(supabase, 3);
    const entries = await Promise.all(
      rows.map(async (row) => ({
        rank: row.rank,
        displayName: row.displayName,
        username: row.username,
        avatarUrl: await resolveAvatarUrl(supabase, row.avatarUrl),
        goalCategory: row.goalCategory,
        goalTitle: row.goalTitle,
        streakDays: row.streakCount,
      }))
    );
    return jsonOk({ entries });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Leaderboard error";
    return jsonError(message, "LEADERBOARD_ERROR", 500);
  }
}

import { getAdminClient, getTopWeeklyStreaks } from "@checkmate/server";
import { jsonError, jsonOk } from "@/lib/api/response";
import { formatLeaderboardEntries } from "@/lib/leaderboard-entries";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = getAdminClient();
  const limitParam = request.nextUrl.searchParams.get("limit");
  const limit = Math.min(
    Math.max(parseInt(limitParam ?? "3", 10) || 3, 1),
    50
  );

  try {
    const rows = await getTopWeeklyStreaks(supabase, limit);
    const entries = await formatLeaderboardEntries(supabase, rows);
    return jsonOk({ entries });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Leaderboard error";
    return jsonError(message, "LEADERBOARD_ERROR", 500);
  }
}

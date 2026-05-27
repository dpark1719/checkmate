import { todayInTimezone } from "@goalpost/shared";
import {
  applyHardDeadlines,
  ensureDailyChallengesForUser,
  fireDueTriggers,
} from "@goalpost/server";
import { jsonError, jsonOk, toCamelCase } from "@/lib/api/response";
import { getAuthUserFromRequest, getSupabaseForRequest } from "@/lib/supabase/auth";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const user = await getAuthUserFromRequest(request);
  if (!user) return jsonError("Unauthorized", "UNAUTHORIZED", 401);

  const supabase = await getSupabaseForRequest(request);
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("timezone")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return jsonError("Profile not found", "PROFILE_NOT_FOUND", 404);
  }

  const timezone = profile.timezone;
  await ensureDailyChallengesForUser(user.id, timezone);
  await fireDueTriggers(user.id, timezone);
  await applyHardDeadlines(user.id, timezone);

  const date = todayInTimezone(timezone);
  const { data, error } = await supabase
    .from("daily_challenges")
    .select(
      "*, goals!inner(title, category, default_promise_time, is_active, archived_at)"
    )
    .eq("user_id", user.id)
    .eq("date", date)
    .eq("goals.is_active", true)
    .is("goals.archived_at", null);

  if (error) return jsonError(error.message, "DB_ERROR", 500);

  const rows = data ?? [];
  const postedIds = rows
    .filter((r) => r.posted_at)
    .map((r) => r.id as string);

  const postIdByChallenge = new Map<string, string>();
  if (postedIds.length > 0) {
    const { data: posts } = await supabase
      .from("posts")
      .select("id, daily_challenge_id")
      .in("daily_challenge_id", postedIds)
      .eq("user_id", user.id)
      .is("deleted_at", null);

    for (const p of posts ?? []) {
      postIdByChallenge.set(p.daily_challenge_id as string, p.id as string);
    }
  }

  const challenges = rows.map((row) => {
    const challenge = toCamelCase(row) as Record<string, unknown>;
    const postId = postIdByChallenge.get(row.id as string);
    if (postId) challenge.postId = postId;
    return challenge;
  });

  return jsonOk({ challenges });
}

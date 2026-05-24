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
    .select("*, goals(title, category)")
    .eq("user_id", user.id)
    .eq("date", date);

  if (error) return jsonError(error.message, "DB_ERROR", 500);
  return jsonOk({ challenges: (data ?? []).map((c) => toCamelCase(c)) });
}

import { createPostSchema } from "@goalpost/shared";
import { NextRequest } from "next/server";
import { isPostOnTime } from "@/lib/challenges";
import { jsonError, jsonOk, toCamelCase } from "@/lib/api/response";
import { getAuthUserFromRequest, getSupabaseForRequest } from "@/lib/supabase/auth";

export async function POST(request: NextRequest) {
  const user = await getAuthUserFromRequest(request);
  if (!user) return jsonError("Unauthorized", "UNAUTHORIZED", 401);

  const body = await request.json();
  const parsed = createPostSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.message, "VALIDATION_ERROR", 400);
  }

  const { goalId, dailyChallengeId, photoUrl, caption } = parsed.data;
  const supabase = await getSupabaseForRequest(request);

  const { data: challenge, error: challengeError } = await supabase
    .from("daily_challenges")
    .select("*")
    .eq("id", dailyChallengeId)
    .eq("user_id", user.id)
    .eq("goal_id", goalId)
    .single();

  if (challengeError || !challenge) {
    return jsonError("Daily challenge not found", "NOT_FOUND", 404);
  }

  if (challenge.posted_at) {
    return jsonError("Already posted for this challenge", "ALREADY_POSTED", 400);
  }

  const now = new Date();
  const leeway = challenge.leeway_expires_at
    ? new Date(challenge.leeway_expires_at)
    : null;
  const onTime = isPostOnTime(now, leeway);
  const isLate = !onTime;

  const { data: post, error: postError } = await supabase
    .from("posts")
    .insert({
      user_id: user.id,
      goal_id: goalId,
      daily_challenge_id: dailyChallengeId,
      photo_url: photoUrl,
      caption: caption ?? null,
      is_late: isLate,
    })
    .select()
    .single();

  if (postError) return jsonError(postError.message, "DB_ERROR", 500);

  await supabase
    .from("daily_challenges")
    .update({
      posted_at: now.toISOString(),
      is_late: isLate,
      streak_credited: onTime,
    })
    .eq("id", dailyChallengeId);

  return jsonOk({ post: toCamelCase(post) }, 201);
}

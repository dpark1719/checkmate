import { setPromiseTimeSchema } from "@goalpost/shared";
import { NextRequest } from "next/server";
import { canSetPromiseTime, computeLeewayExpires } from "@/lib/challenges";
import { jsonError, jsonOk, toCamelCase } from "@/lib/api/response";
import { createClient, getAuthUser } from "@/lib/supabase/server";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const user = await getAuthUser();
  if (!user) return jsonError("Unauthorized", "UNAUTHORIZED", 401);

  const { id } = await params;
  const body = await request.json();
  const parsed = setPromiseTimeSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.message, "VALIDATION_ERROR", 400);
  }

  const supabase = await createClient();
  const { data: challenge, error: fetchError } = await supabase
    .from("daily_challenges")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !challenge) {
    return jsonError("Challenge not found", "NOT_FOUND", 404);
  }

  if (!canSetPromiseTime(challenge.trigger_fired_at)) {
    return jsonError(
      "Promise time must be set within 2 hours of trigger",
      "PROMISE_WINDOW_CLOSED",
      400
    );
  }

  const promiseTime = new Date(parsed.data.promiseTime);
  const leewayExpiresAt = computeLeewayExpires(promiseTime);

  const { data, error } = await supabase
    .from("daily_challenges")
    .update({
      promise_time: promiseTime.toISOString(),
      leeway_expires_at: leewayExpiresAt.toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return jsonError(error.message, "DB_ERROR", 500);
  return jsonOk({ challenge: toCamelCase(data) });
}

import type { SupabaseClient } from "@supabase/supabase-js";

export function safeNextPath(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/feed";
  }
  return next;
}

export async function isReturningUser(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const [goalsResult, profileResult, postsResult] = await Promise.all([
    supabase
      .from("goals")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("profiles")
      .select("notification_preferences")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .is("deleted_at", null),
  ]);

  if (!goalsResult.error && (goalsResult.count ?? 0) > 0) {
    return true;
  }

  const prefs = (profileResult.data?.notification_preferences ??
    {}) as Record<string, unknown>;
  if (prefs.ageVerified === true) {
    return true;
  }

  if (!postsResult.error && (postsResult.count ?? 0) > 0) {
    return true;
  }

  return false;
}

export async function resolvePostAuthRedirect(
  supabase: SupabaseClient,
  userId: string,
  requestedNext: string | null
): Promise<string> {
  const returning = await isReturningUser(supabase, userId);
  if (!returning) {
    return "/onboarding";
  }

  const safe = safeNextPath(requestedNext);
  if (safe === "/onboarding") {
    return "/feed";
  }
  return safe;
}

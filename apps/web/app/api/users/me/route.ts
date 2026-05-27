import { sanitizeSocialLinks, updateProfileSchema } from "@goalpost/shared";
import { NextRequest } from "next/server";
import { jsonError, jsonOk, toCamelCase } from "@/lib/api/response";
import { getAuthUserFromRequest, getSupabaseForRequest } from "@/lib/supabase/auth";

export async function GET(request: NextRequest) {
  const user = await getAuthUserFromRequest(request);
  if (!user) return jsonError("Unauthorized", "UNAUTHORIZED", 401);

  const supabase = await getSupabaseForRequest(request);
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) return jsonError(error.message, "DB_ERROR", 500);
  return jsonOk({ userId: user.id, profile: toCamelCase(data) });
}

export async function PATCH(request: NextRequest) {
  const user = await getAuthUserFromRequest(request);
  if (!user) return jsonError("Unauthorized", "UNAUTHORIZED", 401);

  const body = await request.json();
  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.message, "VALIDATION_ERROR", 400);
  }

  const updates: Record<string, unknown> = {};
  const d = parsed.data;
  if (d.displayName !== undefined) updates.display_name = d.displayName;
  if (d.username !== undefined) updates.username = d.username;
  if (d.bio !== undefined) updates.bio = d.bio;
  if (d.avatarUrl !== undefined) updates.avatar_url = d.avatarUrl;
  if (d.timezone !== undefined) updates.timezone = d.timezone;
  if (d.region !== undefined) updates.region = d.region;
  const supabase = await getSupabaseForRequest(request);

  if (d.notificationPreferences !== undefined) {
    const { data: current } = await supabase
      .from("profiles")
      .select("notification_preferences")
      .eq("id", user.id)
      .single();
    const existing =
      (current?.notification_preferences as Record<string, unknown>) ?? {};
    updates.notification_preferences = {
      ...existing,
      ...d.notificationPreferences,
    };
  }
  if (d.socialLinks !== undefined) {
    updates.social_links = sanitizeSocialLinks(d.socialLinks);
  }

  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id)
    .select()
    .single();

  if (error) return jsonError(error.message, "DB_ERROR", 500);
  return jsonOk({ profile: toCamelCase(data) });
}

import { updateProfileSchema } from "@goalpost/shared";
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
  return jsonOk({ profile: toCamelCase(data) });
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
  if (d.notificationPreferences !== undefined) {
    updates.notification_preferences = d.notificationPreferences;
  }

  const supabase = await getSupabaseForRequest(request);
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id)
    .select()
    .single();

  if (error) return jsonError(error.message, "DB_ERROR", 500);
  return jsonOk({ profile: toCamelCase(data) });
}

import { resolveAvatarUrl, resolveUserRole, userCanModeratePosts } from "@checkmate/server";
import { maskPhone, sanitizeSocialLinks, updateProfileSchema } from "@checkmate/shared";
import { NextRequest } from "next/server";
import { jsonError, jsonOk, toCamelCase } from "@/lib/api/response";
import { getAuthUserFromRequest, getSupabaseForRequest } from "@/lib/supabase/auth";

async function profileWithSignedAvatar(
  supabase: Awaited<ReturnType<typeof getSupabaseForRequest>>,
  row: Record<string, unknown>
) {
  const profile = toCamelCase(row) as Record<string, unknown>;
  const stored = row.avatar_url as string | null | undefined;
  profile.avatarUrl = await resolveAvatarUrl(supabase, stored);
  return profile;
}

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
  const profile = await profileWithSignedAvatar(supabase, data as Record<string, unknown>);
  const role = await resolveUserRole(supabase, user.id, user.email);
  const canModerate = await userCanModeratePosts(supabase, user.id, user.email);
  const rawPhone = user.phone ?? null;
  return jsonOk({
    userId: user.id,
    profile: { ...profile, role },
    canModeratePosts: canModerate,
    hasPhone: Boolean(rawPhone),
    phone: rawPhone ? maskPhone(rawPhone) : null,
  });
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
  if (d.avatarPath !== undefined) {
    if (d.avatarPath === null) {
      updates.avatar_url = null;
    } else {
      const prefix = `${user.id}/`;
      if (!d.avatarPath.startsWith(prefix)) {
        return jsonError("Invalid avatar path", "VALIDATION_ERROR", 400);
      }
      updates.avatar_url = d.avatarPath;
    }
  }
  if (d.timezone !== undefined) updates.timezone = d.timezone;
  if (d.timezoneLabel !== undefined) updates.timezone_label = d.timezoneLabel;
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
  const profile = await profileWithSignedAvatar(supabase, data as Record<string, unknown>);
  return jsonOk({ profile });
}

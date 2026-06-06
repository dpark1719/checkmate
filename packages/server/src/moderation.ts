import { USER_ROLES, type UserRole } from "@checkmate/shared";
import type { SupabaseClient } from "@supabase/supabase-js";

export function canModeratePosts(role: UserRole): boolean {
  return role === "moderator" || role === "admin";
}

export async function getUserRole(
  supabase: SupabaseClient,
  userId: string
): Promise<UserRole> {
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (error || !data?.role) return "user";

  const role = data.role as string;
  if ((USER_ROLES as readonly string[]).includes(role)) {
    return role as UserRole;
  }

  return "user";
}

import { USER_ROLES, type UserRole } from "@checkmate/shared";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getAdminClient } from "./supabase";

const DEFAULT_MODERATOR_EMAILS = ["dparktherockitman@gmail.com"];

function moderatorEmails(): string[] {
  const fromEnv = process.env.MODERATOR_EMAILS?.split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  return fromEnv?.length ? fromEnv : DEFAULT_MODERATOR_EMAILS;
}

export function isModeratorEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  return moderatorEmails().includes(email.trim().toLowerCase());
}

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

async function persistModeratorRole(userId: string): Promise<void> {
  try {
    const admin = getAdminClient();
    await admin
      .from("profiles")
      .update({ role: "moderator" })
      .eq("id", userId);
  } catch {
    // Missing service role or profiles.role column — email allowlist still grants access.
  }
}

export async function resolveUserRole(
  supabase: SupabaseClient,
  userId: string,
  email?: string | null
): Promise<UserRole> {
  if (isModeratorEmail(email)) {
    void persistModeratorRole(userId);
    return "moderator";
  }
  return getUserRole(supabase, userId);
}

export async function userCanModeratePosts(
  supabase: SupabaseClient,
  userId: string,
  email?: string | null
): Promise<boolean> {
  const role = await resolveUserRole(supabase, userId, email);
  return canModeratePosts(role);
}

import { getProfileByUsername, resolveAvatarUrl } from "@checkmate/server";
import { jsonError, jsonOk, toCamelCase } from "@/lib/api/response";
import { createClient, getAuthUser } from "@/lib/supabase/server";

type Params = { params: Promise<{ username: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { username } = await params;
  const supabase = await createClient();
  const user = await getAuthUser();

  const result = await getProfileByUsername(
    supabase,
    username,
    user?.id
  );

  if (!result) return jsonError("User not found", "NOT_FOUND", 404);

  const profile = toCamelCase(result.profile) as Record<string, unknown>;
  profile.avatarUrl = await resolveAvatarUrl(
    supabase,
    result.profile.avatar_url as string | null
  );

  return jsonOk({
    profile,
    goals: result.goals.map((g) => toCamelCase(g)),
    streaks: result.streaks.map((s) => toCamelCase(s)),
  });
}

import { getProfileByUsername } from "@goalpost/server";
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

  return jsonOk({
    profile: toCamelCase(result.profile),
    goals: result.goals.map((g) => toCamelCase(g)),
    streaks: result.streaks.map((s) => toCamelCase(s)),
  });
}

import {
  getConnectionsByUsername,
  resolveAvatarUrl,
} from "@checkmate/server";
import { jsonError, jsonOk } from "@/lib/api/response";
import { createClient, getAuthUser } from "@/lib/supabase/server";

type Params = { params: Promise<{ username: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { username } = await params;
  const supabase = await createClient();
  const user = await getAuthUser();

  let result;
  try {
    result = await getConnectionsByUsername(
      supabase,
      username,
      user?.id
    );
  } catch (e) {
    return jsonError(
      e instanceof Error ? e.message : "DB error",
      "DB_ERROR",
      500
    );
  }

  if (!result) return jsonError("User not found", "NOT_FOUND", 404);

  const connections = await Promise.all(
    result.connections.map(async (c) => ({
      id: c.id,
      displayName: c.displayName,
      username: c.username,
      avatarUrl: await resolveAvatarUrl(supabase, c.avatarUrl),
      isFollowing: c.isFollowing,
    }))
  );

  return jsonOk({ connections });
}

import { getHomeFeed } from "@checkmate/server";
import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api/response";
import { getAuthUserFromRequest, getSupabaseForRequest } from "@/lib/supabase/auth";

export async function GET(request: NextRequest) {
  const user = await getAuthUserFromRequest(request);
  if (!user) return jsonError("Unauthorized", "UNAUTHORIZED", 401);

  const { searchParams } = request.nextUrl;
  const cursor = searchParams.get("cursor") ?? undefined;
  const limit = searchParams.get("limit")
    ? parseInt(searchParams.get("limit")!, 10)
    : undefined;

  const supabase = await getSupabaseForRequest(request);

  try {
    const feed = await getHomeFeed(supabase, user.id, { cursor, limit });
    return jsonOk(feed);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Feed error";
    return jsonError(message, "FEED_ERROR", 500);
  }
}

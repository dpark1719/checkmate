import { getGoalPosts } from "@checkmate/server";
import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api/response";
import { createClient, getAuthUser } from "@/lib/supabase/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const user = await getAuthUser();
  if (!user) return jsonError("Unauthorized", "UNAUTHORIZED", 401);

  const { id } = await params;
  const supabase = await createClient();
  const cursor = request.nextUrl.searchParams.get("cursor") ?? undefined;
  const limit = request.nextUrl.searchParams.get("limit")
    ? parseInt(request.nextUrl.searchParams.get("limit")!, 10)
    : undefined;

  try {
    const result = await getGoalPosts(supabase, user.id, id, { cursor, limit });
    if (!result) return jsonError("Goal not found", "NOT_FOUND", 404);
    return jsonOk(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error";
    return jsonError(message, "DB_ERROR", 500);
  }
}

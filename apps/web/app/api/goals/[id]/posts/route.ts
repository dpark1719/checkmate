import { getGoalDetailForOwner, getGoalPosts } from "@checkmate/server";
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
    const postsResult = await getGoalPosts(supabase, user.id, id, {
      cursor,
      limit,
    });
    if (!postsResult) return jsonError("Goal not found", "NOT_FOUND", 404);

    let detail: Awaited<ReturnType<typeof getGoalDetailForOwner>> = null;
    try {
      detail = await getGoalDetailForOwner(supabase, user.id, id);
    } catch (detailError) {
      const message =
        detailError instanceof Error ? detailError.message : "Error";
      if (
        message.includes("target_end_date") ||
        message.includes("completed_at")
      ) {
        return jsonError(
          "Goal completion is not set up yet. Run supabase/migrations/20250605120000_goal_completion.sql in Supabase.",
          "MIGRATION_REQUIRED",
          503
        );
      }
      throw detailError;
    }

    if (!detail) return jsonError("Goal not found", "NOT_FOUND", 404);

    return jsonOk({
      goal: detail.goal,
      progress: detail.progress,
      startPost: detail.startPost,
      endPost: detail.endPost,
      posts: postsResult.posts,
      nextCursor: postsResult.nextCursor,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error";
    return jsonError(message, "DB_ERROR", 500);
  }
}

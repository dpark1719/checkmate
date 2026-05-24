import { jsonError, jsonOk } from "@/lib/api/response";
import { getAuthUserFromRequest, getSupabaseForRequest } from "@/lib/supabase/auth";
import { NextRequest } from "next/server";

type Params = { params: Promise<{ postId: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const user = await getAuthUserFromRequest(request);
  if (!user) return jsonError("Unauthorized", "UNAUTHORIZED", 401);

  const { postId } = await params;
  const supabase = await getSupabaseForRequest(request);

  const { data: post, error: postErr } = await supabase
    .from("posts")
    .select("id, user_id")
    .eq("id", postId)
    .is("deleted_at", null)
    .single();

  if (postErr || !post) {
    return jsonError("Post not found", "NOT_FOUND", 404);
  }

  if (post.user_id === user.id) {
    return jsonError("Cannot message yourself", "VALIDATION_ERROR", 400);
  }

  const { data: conversationId, error } = await supabase.rpc(
    "create_dm_conversation",
    {
      other_user_id: post.user_id,
      p_post_id: postId,
    }
  );

  if (error) {
    const msg = error.message.includes("blocked")
      ? "You cannot message this user"
      : error.message;
    return jsonError(msg, "DB_ERROR", 400);
  }

  return jsonOk({ conversationId });
}

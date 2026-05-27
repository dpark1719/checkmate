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
    const raw = error.message ?? "";
    let msg = raw;
    if (raw.includes("blocked")) {
      msg = "You cannot message this user";
    } else if (
      raw.includes("does not exist") ||
      raw.includes("create_dm_conversation")
    ) {
      msg =
        "Messaging is not set up yet. Run supabase/runbooks/apply_messaging.sql in Supabase SQL Editor: https://supabase.com/dashboard/project/nfpeasuabkwobyvocecc/sql/new";
    }
    return jsonError(msg, "DB_ERROR", 400);
  }

  return jsonOk({ conversationId });
}

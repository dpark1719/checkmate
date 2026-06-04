import { jsonError, jsonOk } from "@/lib/api/response";
import { getAuthUserFromRequest, getSupabaseForRequest } from "@/lib/supabase/auth";
import { NextRequest } from "next/server";

type Params = { params: Promise<{ userId: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const user = await getAuthUserFromRequest(request);
  if (!user) return jsonError("Unauthorized", "UNAUTHORIZED", 401);

  const { userId } = await params;

  if (userId === user.id) {
    return jsonError("Cannot message yourself", "VALIDATION_ERROR", 400);
  }

  const supabase = await getSupabaseForRequest(request);

  const { data: conversationId, error } = await supabase.rpc(
    "create_dm_conversation",
    {
      other_user_id: userId,
      p_post_id: null,
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
        "Messaging is not set up yet. Run supabase/runbooks/apply_messaging.sql in Supabase SQL Editor.";
    }
    return jsonError(msg, "DB_ERROR", 400);
  }

  const { data: otherMembership } = await supabase
    .from("conversation_participants")
    .select("status")
    .eq("conversation_id", conversationId as string)
    .neq("user_id", user.id)
    .single();

  return jsonOk({
    conversationId,
    isRequest: otherMembership?.status === "pending",
  });
}

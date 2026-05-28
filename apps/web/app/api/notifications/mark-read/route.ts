import {
  markAllCommentsRead,
  markPostCommentsRead,
} from "@checkmate/server";
import { jsonError, jsonOk } from "@/lib/api/response";
import { getAuthUserFromRequest, getSupabaseForRequest } from "@/lib/supabase/auth";
import { NextRequest } from "next/server";
import { z } from "zod";

const markReadSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("comments"),
    postId: z.string().uuid().optional(),
    all: z.boolean().optional(),
  }),
  z.object({
    type: z.literal("messages"),
    conversationId: z.string().uuid(),
  }),
]);

export async function POST(request: NextRequest) {
  const user = await getAuthUserFromRequest(request);
  if (!user) return jsonError("Unauthorized", "UNAUTHORIZED", 401);

  const body = await request.json();
  const parsed = markReadSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.message, "VALIDATION_ERROR", 400);
  }

  const supabase = await getSupabaseForRequest(request);
  const data = parsed.data;

  if (data.type === "comments") {
    if (data.all) {
      await markAllCommentsRead(supabase, user.id);
    } else if (data.postId) {
      await markPostCommentsRead(supabase, user.id, data.postId);
    } else {
      return jsonError("postId or all required", "VALIDATION_ERROR", 400);
    }
  } else {
    await supabase
      .from("conversation_participants")
      .update({ last_read_at: new Date().toISOString() })
      .eq("conversation_id", data.conversationId)
      .eq("user_id", user.id);
  }

  return jsonOk({ ok: true });
}

import { jsonError, jsonOk, toCamelCase } from "@/lib/api/response";
import { getAuthUserFromRequest, getSupabaseForRequest } from "@/lib/supabase/auth";
import { signPhotoUrls } from "@checkmate/server";
import { NextRequest } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const user = await getAuthUserFromRequest(request);
  if (!user) return jsonError("Unauthorized", "UNAUTHORIZED", 401);

  const { id } = await params;
  const supabase = await getSupabaseForRequest(request);

  const { data: conv, error: convErr } = await supabase
    .from("conversations")
    .select("id, post_id, updated_at, created_at")
    .eq("id", id)
    .single();

  if (convErr || !conv) {
    return jsonError("Conversation not found", "NOT_FOUND", 404);
  }

  const { data: participants, error: partErr } = await supabase
    .from("conversation_participants")
    .select("user_id, profiles(id, display_name, username, avatar_url)")
    .eq("conversation_id", id);

  if (partErr) return jsonError(partErr.message, "DB_ERROR", 500);

  const other = (participants ?? []).find((p) => p.user_id !== user.id);
  const prof = other?.profiles as
    | { display_name: string; username: string; avatar_url: string | null }
    | { display_name: string; username: string; avatar_url: string | null }[]
    | null;
  const row = Array.isArray(prof) ? prof[0] : prof;

  let postContext: {
    id: string;
    photoUrl: string;
    caption: string | null;
  } | null = null;

  if (conv.post_id) {
    const { data: post } = await supabase
      .from("posts")
      .select("id, photo_url, caption")
      .eq("id", conv.post_id)
      .is("deleted_at", null)
      .maybeSingle();

    if (post?.photo_url) {
      const signed = await signPhotoUrls(supabase, [post.photo_url as string]);
      postContext = {
        id: post.id as string,
        photoUrl: signed.get(post.photo_url as string) ?? (post.photo_url as string),
        caption: post.caption as string | null,
      };
    }
  }

  await supabase
    .from("conversation_participants")
    .update({ last_read_at: new Date().toISOString() })
    .eq("conversation_id", id)
    .eq("user_id", user.id);

  return jsonOk({
    conversation: toCamelCase(conv),
    otherUser: row
      ? toCamelCase({
          id: other!.user_id,
          display_name: row.display_name,
          username: row.username,
          avatar_url: row.avatar_url,
        })
      : null,
    postContext,
  });
}

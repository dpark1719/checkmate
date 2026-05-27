import { resolveAvatarUrl } from "@goalpost/server";
import { jsonError, jsonOk, toCamelCase } from "@/lib/api/response";
import { getAuthUserFromRequest, getSupabaseForRequest } from "@/lib/supabase/auth";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const user = await getAuthUserFromRequest(request);
  if (!user) return jsonError("Unauthorized", "UNAUTHORIZED", 401);

  const supabase = await getSupabaseForRequest(request);

  const { data: memberships, error: memErr } = await supabase
    .from("conversation_participants")
    .select("conversation_id, last_read_at")
    .eq("user_id", user.id);

  if (memErr) return jsonError(memErr.message, "DB_ERROR", 500);

  const convIds = (memberships ?? []).map((m) => m.conversation_id as string);
  if (convIds.length === 0) {
    return jsonOk({ conversations: [] });
  }

  const { data: convs, error: convErr } = await supabase
    .from("conversations")
    .select("id, post_id, updated_at, created_at")
    .in("id", convIds)
    .order("updated_at", { ascending: false });

  if (convErr) return jsonError(convErr.message, "DB_ERROR", 500);

  const { data: participants, error: partErr } = await supabase
    .from("conversation_participants")
    .select("conversation_id, user_id, profiles(id, display_name, username, avatar_url)")
    .in("conversation_id", convIds);

  if (partErr) return jsonError(partErr.message, "DB_ERROR", 500);

  const { data: recentMessages, error: msgErr } = await supabase
    .from("messages")
    .select("id, conversation_id, body, sender_id, created_at")
    .in("conversation_id", convIds)
    .order("created_at", { ascending: false })
    .limit(200);

  if (msgErr) return jsonError(msgErr.message, "DB_ERROR", 500);

  const lastByConv = new Map<string, (typeof recentMessages)[number]>();
  for (const m of recentMessages ?? []) {
    if (!lastByConv.has(m.conversation_id as string)) {
      lastByConv.set(m.conversation_id as string, m);
    }
  }

  const readMap = new Map(
    (memberships ?? []).map((m) => [m.conversation_id as string, m.last_read_at])
  );

  const conversations = await Promise.all(
    (convs ?? []).map(async (c) => {
      const others = (participants ?? [])
        .filter(
          (p) =>
            p.conversation_id === c.id && (p.user_id as string) !== user.id
        )
        .map((p) => {
          const prof = p.profiles as
            | {
                display_name: string;
                username: string;
                avatar_url: string | null;
              }
            | {
                display_name: string;
                username: string;
                avatar_url: string | null;
              }[]
            | null;
          const row = Array.isArray(prof) ? prof[0] : prof;
          return row
            ? {
                id: p.user_id,
                displayName: row.display_name,
                username: row.username,
                avatarUrl: row.avatar_url,
              }
            : null;
        })
        .filter(Boolean);

      const other = others[0];
      if (other?.avatarUrl) {
        other.avatarUrl = await resolveAvatarUrl(
          supabase,
          other.avatarUrl as string
        );
      }

      const last = lastByConv.get(c.id as string);
      const lastRead = readMap.get(c.id as string);
      const unread =
        last &&
        last.sender_id !== user.id &&
        (!lastRead ||
          new Date(last.created_at as string) > new Date(lastRead as string));

      return {
        id: c.id,
        postId: c.post_id,
        updatedAt: c.updated_at,
        otherUser: other ?? null,
        lastMessage: last
          ? {
              body: last.body,
              createdAt: last.created_at,
              senderId: last.sender_id,
            }
          : null,
        unread: Boolean(unread),
      };
    })
  );

  return jsonOk({ conversations: conversations.map((x) => toCamelCase(x)) });
}

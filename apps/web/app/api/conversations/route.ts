import { resolveAvatarUrl } from "@checkmate/server";
import { jsonError, jsonOk, toCamelCase } from "@/lib/api/response";
import { getAuthUserFromRequest, getSupabaseForRequest } from "@/lib/supabase/auth";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const user = await getAuthUserFromRequest(request);
  if (!user) return jsonError("Unauthorized", "UNAUTHORIZED", 401);

  const supabase = await getSupabaseForRequest(request);

  const { data: memberships, error: memErr } = await supabase
    .from("conversation_participants")
    .select("conversation_id, last_read_at, status")
    .eq("user_id", user.id)
    .neq("status", "declined");

  if (memErr) return jsonError(memErr.message, "DB_ERROR", 500);

  const convIds = (memberships ?? []).map((m) => m.conversation_id as string);
  if (convIds.length === 0) {
    return jsonOk({ conversations: [], requests: [] });
  }

  const { data: convs, error: convErr } = await supabase
    .from("conversations")
    .select("id, post_id, initiated_by, updated_at, created_at")
    .in("id", convIds)
    .order("updated_at", { ascending: false });

  if (convErr) return jsonError(convErr.message, "DB_ERROR", 500);

  const { data: participants, error: partErr } = await supabase
    .from("conversation_participants")
    .select("conversation_id, user_id, status, profiles(id, display_name, username, avatar_url)")
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

  const membershipMap = new Map(
    (memberships ?? []).map((m) => [m.conversation_id as string, m])
  );

  const mapped = await Promise.all(
    (convs ?? [])
      .filter((c) => {
        const parts = (participants ?? []).filter(
          (p) => p.conversation_id === c.id
        );
        const other = parts.find((p) => (p.user_id as string) !== user.id);
        return other?.status !== "declined";
      })
      .map(async (c) => {
      const membership = membershipMap.get(c.id as string);
      const viewerStatus = (membership?.status as string) ?? "accepted";
      const initiatedBy = c.initiated_by as string | null;
      const isRequest =
        viewerStatus === "pending" && initiatedBy !== user.id;

      const others = (participants ?? [])
        .filter(
          (p) =>
            p.conversation_id === c.id &&
            (p.user_id as string) !== user.id &&
            p.status !== "declined"
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
      const lastRead = membership?.last_read_at;
      const unread =
        !isRequest &&
        last &&
        last.sender_id !== user.id &&
        (!lastRead ||
          new Date(last.created_at as string) > new Date(lastRead as string));

      return {
        id: c.id,
        postId: c.post_id,
        initiatedBy,
        updatedAt: c.updated_at,
        status: viewerStatus,
        isRequest,
        otherUser: other ?? null,
        lastMessage: last
          ? {
              body: isRequest ? null : (last.body as string),
              previewHidden: isRequest,
              createdAt: last.created_at,
              senderId: last.sender_id,
            }
          : null,
        unread: Boolean(unread),
      };
    })
  );

  const conversations = dedupeInboxThreads(
    mapped.filter((c) => !c.isRequest)
  ).map((x) => toCamelCase(x));
  const requests = dedupeInboxThreads(mapped.filter((c) => c.isRequest)).map((x) =>
    toCamelCase(x)
  );

  return jsonOk({ conversations, requests });
}

type MappedConversation = {
  id: string;
  postId: string | null;
  initiatedBy: string | null;
  updatedAt: string;
  status: string;
  isRequest: boolean;
  otherUser: {
    id: string;
    displayName: string;
    username: string;
    avatarUrl: string | null;
  } | null;
  lastMessage: {
    body: string | null;
    previewHidden?: boolean;
    createdAt: string;
    senderId: string;
  } | null;
  unread: boolean;
};

/** One inbox row per person; newest activity wins, unread if any thread is unread. */
function threadActivityTime(item: MappedConversation): number {
  if (item.lastMessage?.createdAt) {
    return new Date(item.lastMessage.createdAt).getTime();
  }
  return new Date(item.updatedAt).getTime();
}

function mergeInboxThreads(
  existing: MappedConversation,
  incoming: MappedConversation
): MappedConversation {
  const keepIncoming =
    threadActivityTime(incoming) >= threadActivityTime(existing);
  const primary = keepIncoming ? incoming : existing;
  const secondary = keepIncoming ? existing : incoming;
  return {
    ...primary,
    unread: primary.unread || secondary.unread,
  };
}

function dedupeInboxThreads(items: MappedConversation[]): MappedConversation[] {
  const byPerson = new Map<string, MappedConversation>();

  for (const item of items) {
    const otherId = item.otherUser?.id;
    if (!otherId) continue;

    const existing = byPerson.get(otherId);
    byPerson.set(
      otherId,
      existing ? mergeInboxThreads(existing, item) : item
    );
  }

  return Array.from(byPerson.values()).sort(
    (a, b) => threadActivityTime(b) - threadActivityTime(a)
  );
}

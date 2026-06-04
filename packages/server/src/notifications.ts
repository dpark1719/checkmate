import type { SupabaseClient } from "@supabase/supabase-js";
import { getAdminClient } from "./supabase";
import { sendCommentEmail, sendMessageEmail } from "./email";

export async function countUnreadMessages(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const { data: memberships } = await supabase
    .from("conversation_participants")
    .select("conversation_id, last_read_at, status")
    .eq("user_id", userId)
    .neq("status", "declined");

  if (!memberships?.length) return 0;

  const convIds = memberships.map((m) => m.conversation_id as string);
  const { data: messages } = await supabase
    .from("messages")
    .select("conversation_id, sender_id, created_at")
    .in("conversation_id", convIds)
    .order("created_at", { ascending: false })
    .limit(500);

  const lastByConv = new Map<string, { sender_id: string; created_at: string }>();
  for (const m of messages ?? []) {
    const cid = m.conversation_id as string;
    if (!lastByConv.has(cid)) {
      lastByConv.set(cid, {
        sender_id: m.sender_id as string,
        created_at: m.created_at as string,
      });
    }
  }

  let unread = 0;
  for (const m of memberships) {
    if ((m.status as string) === "pending") {
      unread++;
      continue;
    }
    const last = lastByConv.get(m.conversation_id as string);
    if (!last || last.sender_id === userId) continue;
    const lastRead = m.last_read_at as string | null;
    if (!lastRead || new Date(last.created_at) > new Date(lastRead)) {
      unread++;
    }
  }
  return unread;
}

export async function countUnreadComments(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const { count, error } = await supabase
    .from("user_notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);

  if (error) {
    if (error.message.includes("does not exist")) return 0;
    throw error;
  }
  return count ?? 0;
}

export async function notifyPostComment(options: {
  postId: string;
  commentId: string;
  actorId: string;
  actorName: string;
  commentBody: string;
}): Promise<void> {
  const admin = getAdminClient();

  const { data: post } = await admin
    .from("posts")
    .select("user_id")
    .eq("id", options.postId)
    .is("deleted_at", null)
    .single();

  if (!post || post.user_id === options.actorId) return;

  const { data: profile } = await admin
    .from("profiles")
    .select("notification_preferences")
    .eq("id", post.user_id)
    .single();

  const prefs = (profile?.notification_preferences ?? {}) as Record<
    string,
    unknown
  >;

  const { error: insertErr } = await admin.from("user_notifications").insert({
    user_id: post.user_id,
    type: "comment",
    actor_id: options.actorId,
    post_id: options.postId,
    comment_id: options.commentId,
  });

  if (insertErr && !insertErr.message.includes("duplicate")) {
    throw insertErr;
  }

  void sendCommentEmail({
    toUserId: post.user_id as string,
    actorName: options.actorName,
    postId: options.postId,
    commentPreview: options.commentBody,
    prefs,
  });
}

export async function notifyConversationMessage(options: {
  conversationId: string;
  senderId: string;
  senderName: string;
  messageBody: string;
}): Promise<void> {
  const admin = getAdminClient();

  const { data: participants } = await admin
    .from("conversation_participants")
    .select("user_id, status")
    .eq("conversation_id", options.conversationId);

  for (const p of participants ?? []) {
    const recipientId = p.user_id as string;
    if (recipientId === options.senderId) continue;

    const { data: profile } = await admin
      .from("profiles")
      .select("notification_preferences")
      .eq("id", recipientId)
      .single();

    const prefs = (profile?.notification_preferences ?? {}) as Record<
      string,
      unknown
    >;

    const isRequest = (p.status as string) === "pending";

    void sendMessageEmail({
      toUserId: recipientId,
      actorName: options.senderName,
      conversationId: options.conversationId,
      messagePreview: options.messageBody,
      isRequest,
      prefs,
    });
  }
}

export async function markPostCommentsRead(
  supabase: SupabaseClient,
  userId: string,
  postId: string
): Promise<void> {
  await supabase
    .from("user_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("post_id", postId)
    .is("read_at", null);
}

export async function markAllCommentsRead(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  await supabase
    .from("user_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null);
}

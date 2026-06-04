import { sendMessageSchema } from "@checkmate/shared";
import { notifyConversationMessage } from "@checkmate/server";
import { jsonError, jsonOk, toCamelCase } from "@/lib/api/response";
import { getAuthUserFromRequest, getSupabaseForRequest } from "@/lib/supabase/auth";
import { NextRequest } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const user = await getAuthUserFromRequest(request);
  if (!user) return jsonError("Unauthorized", "UNAUTHORIZED", 401);

  const { id } = await params;
  const supabase = await getSupabaseForRequest(request);
  const { searchParams } = new URL(request.url);
  const before = searchParams.get("before");

  const { data: membership } = await supabase
    .from("conversation_participants")
    .select("status")
    .eq("conversation_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership || membership.status === "declined") {
    return jsonError("Conversation not found", "NOT_FOUND", 404);
  }

  let query = supabase
    .from("messages")
    .select("id, conversation_id, sender_id, body, created_at")
    .eq("conversation_id", id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (before) {
    query = query.lt("created_at", before);
  }

  const { data, error } = await query;
  if (error) return jsonError(error.message, "DB_ERROR", 500);

  const messages = (data ?? []).reverse();
  return jsonOk({
    messages: messages.map((m) => toCamelCase(m)),
    nextBefore:
      messages.length > 0 ? (messages[0].created_at as string) : null,
  });
}

export async function POST(request: NextRequest, { params }: Params) {
  const user = await getAuthUserFromRequest(request);
  if (!user) return jsonError("Unauthorized", "UNAUTHORIZED", 401);

  const { id } = await params;
  const body = await request.json();
  const parsed = sendMessageSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.message, "VALIDATION_ERROR", 400);
  }

  const supabase = await getSupabaseForRequest(request);

  const { data: membership } = await supabase
    .from("conversation_participants")
    .select("status")
    .eq("conversation_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership || membership.status === "declined") {
    return jsonError("Conversation not found", "NOT_FOUND", 404);
  }

  const { data: conv } = await supabase
    .from("conversations")
    .select("initiated_by")
    .eq("id", id)
    .single();

  const canReply =
    membership.status === "accepted" ||
    conv?.initiated_by === user.id;

  if (!canReply) {
    return jsonError(
      "Accept this message request before replying",
      "VALIDATION_ERROR",
      403
    );
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: id,
      sender_id: user.id,
      body: parsed.data.body.trim(),
    })
    .select()
    .single();

  if (error) return jsonError(error.message, "DB_ERROR", 500);

  const { data: senderProfile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  void notifyConversationMessage({
    conversationId: id,
    senderId: user.id,
    senderName: senderProfile?.display_name ?? "Someone",
    messageBody: parsed.data.body.trim(),
  }).catch((e) => console.error("[notifyConversationMessage]", e));

  return jsonOk({ message: toCamelCase(data) }, 201);
}

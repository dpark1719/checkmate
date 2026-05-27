import {
  countUnreadComments,
  countUnreadMessages,
} from "@goalpost/server";
import { jsonError, jsonOk } from "@/lib/api/response";
import { getAuthUserFromRequest, getSupabaseForRequest } from "@/lib/supabase/auth";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const user = await getAuthUserFromRequest(request);
  if (!user) return jsonError("Unauthorized", "UNAUTHORIZED", 401);

  const supabase = await getSupabaseForRequest(request);

  const [messages, comments] = await Promise.all([
    countUnreadMessages(supabase, user.id),
    countUnreadComments(supabase, user.id),
  ]);

  return jsonOk({
    messages,
    comments,
    total: messages + comments,
  });
}

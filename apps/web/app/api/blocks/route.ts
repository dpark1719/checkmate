import { blockSchema } from "@checkmate/shared";
import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api/response";
import { createClient, getAuthUser } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return jsonError("Unauthorized", "UNAUTHORIZED", 401);

  const body = await request.json();
  const parsed = blockSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.message, "VALIDATION_ERROR", 400);
  }

  if (parsed.data.blockedId === user.id) {
    return jsonError("Cannot block yourself", "INVALID_BLOCK", 400);
  }

  const supabase = await createClient();
  const { error } = await supabase.from("blocks").insert({
    blocker_id: user.id,
    blocked_id: parsed.data.blockedId,
  });

  if (error) return jsonError(error.message, "DB_ERROR", 500);
  return jsonOk({ blocked: true }, 201);
}

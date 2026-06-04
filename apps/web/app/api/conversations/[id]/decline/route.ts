import { jsonError, jsonOk } from "@/lib/api/response";
import { getAuthUserFromRequest, getSupabaseForRequest } from "@/lib/supabase/auth";
import { NextRequest } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const user = await getAuthUserFromRequest(request);
  if (!user) return jsonError("Unauthorized", "UNAUTHORIZED", 401);

  const { id } = await params;
  const supabase = await getSupabaseForRequest(request);

  const { error } = await supabase.rpc("decline_conversation_request", {
    cid: id,
  });

  if (error) {
    const raw = error.message ?? "";
    if (raw.includes("not a pending request")) {
      return jsonError("Not a pending message request", "VALIDATION_ERROR", 400);
    }
    if (
      raw.includes("does not exist") ||
      raw.includes("decline_conversation_request")
    ) {
      return jsonError(
        "Message requests are not set up yet. Run the latest messaging migration in Supabase.",
        "DB_ERROR",
        400
      );
    }
    return jsonError(raw, "DB_ERROR", 400);
  }

  return jsonOk({ declined: true });
}

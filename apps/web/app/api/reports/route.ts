import { reportSchema } from "@goalpost/shared";
import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api/response";
import { createClient, getAuthUser } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return jsonError("Unauthorized", "UNAUTHORIZED", 401);

  const body = await request.json();
  const parsed = reportSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.message, "VALIDATION_ERROR", 400);
  }

  const supabase = await createClient();
  const { error } = await supabase.from("reports").insert({
    reporter_id: user.id,
    target_type: parsed.data.targetType,
    target_id: parsed.data.targetId,
    reason: parsed.data.reason,
  });

  if (error) return jsonError(error.message, "DB_ERROR", 500);
  return jsonOk({ reported: true }, 201);
}

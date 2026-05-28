import { pushTokenSchema } from "@checkmate/shared";
import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api/response";
import { createClient, getAuthUser } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return jsonError("Unauthorized", "UNAUTHORIZED", 401);

  const body = await request.json();
  const parsed = pushTokenSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.message, "VALIDATION_ERROR", 400);
  }

  const supabase = await createClient();
  const { error } = await supabase.from("push_tokens").upsert({
    user_id: user.id,
    token: parsed.data.token,
    platform: parsed.data.platform,
  });

  if (error) return jsonError(error.message, "DB_ERROR", 500);
  return jsonOk({ registered: true }, 201);
}

export async function DELETE(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return jsonError("Unauthorized", "UNAUTHORIZED", 401);

  const token = request.nextUrl.searchParams.get("token");
  if (!token) return jsonError("Missing token", "VALIDATION_ERROR", 400);

  const supabase = await createClient();
  await supabase
    .from("push_tokens")
    .delete()
    .eq("user_id", user.id)
    .eq("token", token);

  return jsonOk({ success: true });
}

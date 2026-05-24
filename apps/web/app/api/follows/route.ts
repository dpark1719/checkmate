import { followSchema } from "@goalpost/shared";
import { NextRequest } from "next/server";
import { jsonError, jsonOk, toCamelCase } from "@/lib/api/response";
import { createClient, getAuthUser } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return jsonError("Unauthorized", "UNAUTHORIZED", 401);

  const body = await request.json();
  const parsed = followSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.message, "VALIDATION_ERROR", 400);
  }

  if (parsed.data.followingId === user.id) {
    return jsonError("Cannot follow yourself", "INVALID_FOLLOW", 400);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("follows")
    .insert({
      follower_id: user.id,
      following_id: parsed.data.followingId,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return jsonError("Already following", "ALREADY_FOLLOWING", 400);
    }
    return jsonError(error.message, "DB_ERROR", 500);
  }

  return jsonOk({ follow: toCamelCase(data) }, 201);
}

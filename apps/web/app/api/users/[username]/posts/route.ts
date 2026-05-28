import { getUserPosts } from "@checkmate/server";
import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api/response";
import { createClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ username: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const { username } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username.toLowerCase())
    .single();

  if (!profile) return jsonError("User not found", "NOT_FOUND", 404);

  const cursor = request.nextUrl.searchParams.get("cursor") ?? undefined;
  const limit = request.nextUrl.searchParams.get("limit")
    ? parseInt(request.nextUrl.searchParams.get("limit")!, 10)
    : undefined;

  try {
    const result = await getUserPosts(supabase, profile.id, { cursor, limit });
    return jsonOk(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error";
    return jsonError(message, "DB_ERROR", 500);
  }
}

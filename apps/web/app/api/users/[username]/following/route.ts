import { jsonError, jsonOk, toCamelCase } from "@/lib/api/response";
import { createClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ username: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { username } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username.toLowerCase())
    .single();

  if (!profile) return jsonError("Not found", "NOT_FOUND", 404);

  const { data, error } = await supabase
    .from("follows")
    .select("created_at, profiles!follows_following_id_fkey(display_name, username, avatar_url)")
    .eq("follower_id", profile.id);

  if (error) return jsonError(error.message, "DB_ERROR", 500);
  return jsonOk({ following: (data ?? []).map((f) => toCamelCase(f)) });
}

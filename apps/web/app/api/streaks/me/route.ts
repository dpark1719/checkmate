import { jsonError, jsonOk, toCamelCase } from "@/lib/api/response";
import { createClient, getAuthUser } from "@/lib/supabase/server";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return jsonError("Unauthorized", "UNAUTHORIZED", 401);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("streaks")
    .select("*, goals(title, category)")
    .eq("user_id", user.id);

  if (error) return jsonError(error.message, "DB_ERROR", 500);
  return jsonOk({ streaks: (data ?? []).map((s) => toCamelCase(s)) });
}

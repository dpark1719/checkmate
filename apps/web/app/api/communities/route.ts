import { jsonError, jsonOk, toCamelCase } from "@/lib/api/response";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("goal_communities")
    .select("*")
    .order("category");

  if (error) return jsonError(error.message, "DB_ERROR", 500);
  return jsonOk({ communities: (data ?? []).map((c) => toCamelCase(c)) });
}

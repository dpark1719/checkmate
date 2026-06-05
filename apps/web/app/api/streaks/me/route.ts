import { jsonError, jsonOk, toCamelCase } from "@/lib/api/response";
import { createClient, getAuthUser } from "@/lib/supabase/server";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return jsonError("Unauthorized", "UNAUTHORIZED", 401);

  const supabase = await createClient();

  let { data, error } = await supabase
    .from("streaks")
    .select("*, goals!inner(title, category, is_active, archived_at, completed_at)")
    .eq("user_id", user.id)
    .eq("goals.is_active", true)
    .is("goals.archived_at", null)
    .is("goals.completed_at", null);

  if (error?.message?.includes("completed_at")) {
    ({ data, error } = await supabase
      .from("streaks")
      .select("*, goals!inner(title, category, is_active, archived_at)")
      .eq("user_id", user.id)
      .eq("goals.is_active", true)
      .is("goals.archived_at", null));
  }

  if (error) return jsonError(error.message, "DB_ERROR", 500);

  const sorted = [...(data ?? [])].sort((a, b) => {
    const currentDiff = (b.current_count as number) - (a.current_count as number);
    if (currentDiff !== 0) return currentDiff;
    return (b.longest_count as number) - (a.longest_count as number);
  });

  return jsonOk({ streaks: sorted.map((s) => toCamelCase(s)) });
}

import { jsonError, jsonOk, toCamelCase } from "@/lib/api/response";
import { createClient, getAuthUser } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return jsonError("Unauthorized", "UNAUTHORIZED", 401);

  const cursor = request.nextUrl.searchParams.get("cursor");
  const limit = Math.min(
    parseInt(request.nextUrl.searchParams.get("limit") ?? "20", 10),
    50
  );

  const supabase = await createClient();
  let query = supabase
    .from("daily_challenges")
    .select("*, goals(title, category)")
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .limit(limit);

  if (cursor) query = query.lt("date", cursor);

  const { data, error } = await query;
  if (error) return jsonError(error.message, "DB_ERROR", 500);

  return jsonOk({
    challenges: (data ?? []).map((c) => toCamelCase(c)),
    nextCursor: data?.length === limit ? data[data.length - 1]?.date : null,
  });
}

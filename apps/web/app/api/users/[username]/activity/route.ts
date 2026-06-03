import { getUserActivity, type ActivityRange } from "@checkmate/server";
import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api/response";
import { createClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ username: string }> };

function parseRange(value: string | null): ActivityRange | undefined {
  if (value === "month" || value === "year" || value === "all") return value;
  return undefined;
}

export async function GET(request: NextRequest, { params }: Params) {
  const { username } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, timezone, created_at")
    .eq("username", username.toLowerCase())
    .single();

  if (!profile) return jsonError("User not found", "NOT_FOUND", 404);

  const range = parseRange(request.nextUrl.searchParams.get("range")) ?? "month";
  const anchor = request.nextUrl.searchParams.get("anchor") ?? undefined;

  try {
    const result = await getUserActivity(
      supabase,
      profile.id,
      profile.timezone ?? "UTC",
      {
        range,
        anchor,
        accountCreatedAt: profile.created_at as string,
      }
    );
    return jsonOk(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error";
    return jsonError(message, "DB_ERROR", 500);
  }
}

import { getLeaderboard } from "@goalpost/server";
import { goalCategorySchema, leaderboardQuerySchema } from "@goalpost/shared";
import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api/response";
import { createClient, getAuthUser } from "@/lib/supabase/server";

type Params = { params: Promise<{ category: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const { category } = await params;
  const cat = goalCategorySchema.safeParse(category);
  if (!cat.success) return jsonError("Invalid category", "VALIDATION_ERROR", 400);

  const { searchParams } = request.nextUrl;
  const parsed = leaderboardQuerySchema.safeParse({
    period: searchParams.get("period") ?? "weekly",
    scope: searchParams.get("scope") ?? "global",
  });
  if (!parsed.success) {
    return jsonError(parsed.error.message, "VALIDATION_ERROR", 400);
  }

  const supabase = await createClient();
  let region: string | null = null;

  if (parsed.data.scope === "regional") {
    const user = await getAuthUser();
    if (!user) return jsonError("Unauthorized", "UNAUTHORIZED", 401);
    const { data: profile } = await supabase
      .from("profiles")
      .select("region")
      .eq("id", user.id)
      .single();
    region = profile?.region ?? null;
  }

  try {
    const entries = await getLeaderboard(
      supabase,
      cat.data,
      parsed.data.period,
      region
    );
    return jsonOk({ entries, period: parsed.data.period, scope: parsed.data.scope });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Leaderboard error";
    return jsonError(message, "LEADERBOARD_ERROR", 500);
  }
}

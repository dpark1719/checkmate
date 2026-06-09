import { setFeedLastViewedAt } from "@checkmate/server";
import { jsonError, jsonOk } from "@/lib/api/response";
import { getAuthUserFromRequest } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const user = await getAuthUserFromRequest(request);
  if (!user) return jsonError("Unauthorized", "UNAUTHORIZED", 401);

  let viewedAt: string | undefined;
  try {
    const body = await request.json();
    if (body?.viewedAt && typeof body.viewedAt === "string") {
      viewedAt = body.viewedAt;
    }
  } catch {
    // empty body is fine
  }

  try {
    const supabase = createAdminClient();
    const feedLastViewedAt = await setFeedLastViewedAt(
      supabase,
      user.id,
      viewedAt
    );
    return jsonOk({ feedLastViewedAt });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not update feed viewed";
    return jsonError(message, "DB_ERROR", 500);
  }
}

import { getHomeFeed } from "@checkmate/server";
import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/api/response";
import { getAuthUserFromRequest } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = await getAuthUserFromRequest(request);
  if (!user) return jsonError("Unauthorized", "UNAUTHORIZED", 401);

  const { searchParams } = request.nextUrl;
  const cursor = searchParams.get("cursor") ?? undefined;
  const limit = searchParams.get("limit")
    ? parseInt(searchParams.get("limit")!, 10)
    : undefined;

  try {
    const supabase = createAdminClient();
    const feed = await getHomeFeed(supabase, user.id, { cursor, limit });
    return NextResponse.json(feed, {
      status: 200,
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
      },
    });
  } catch (e) {
    const message =
      e instanceof Error
        ? e.message
        : typeof e === "object" &&
            e !== null &&
            "message" in e &&
            typeof (e as { message: unknown }).message === "string"
          ? (e as { message: string }).message
          : "Feed error";
    return jsonError(message, "FEED_ERROR", 500);
  }
}

import { goalCategorySchema } from "@goalpost/shared";
import { getCommunityFeed } from "@goalpost/server";
import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/admin";

type Params = { params: Promise<{ category: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const { category } = await params;
  const parsed = goalCategorySchema.safeParse(category);
  if (!parsed.success) {
    return jsonError("Invalid category", "VALIDATION_ERROR", 400);
  }

  const { searchParams } = request.nextUrl;
  const cursor = searchParams.get("cursor") ?? undefined;
  const limit = searchParams.get("limit")
    ? parseInt(searchParams.get("limit")!, 10)
    : undefined;

  try {
    const supabase = createAdminClient();
    const feed = await getCommunityFeed(supabase, parsed.data, { cursor, limit });
    return jsonOk(feed);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Feed error";
    return jsonError(message, "FEED_ERROR", 500);
  }
}

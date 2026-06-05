import { getSimilarGoals } from "@checkmate/server";
import { goalCategorySchema } from "@checkmate/shared";
import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api/response";
import { createClient, getAuthUser } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const title = request.nextUrl.searchParams.get("title");
  const category = request.nextUrl.searchParams.get("category");
  const statusParam = request.nextUrl.searchParams.get("status") ?? "completed";
  const limitParam = request.nextUrl.searchParams.get("limit");

  if (!title || !category) {
    return jsonError("title and category are required", "VALIDATION_ERROR", 400);
  }

  const categoryParsed = goalCategorySchema.safeParse(category);
  if (!categoryParsed.success) {
    return jsonError("Invalid category", "VALIDATION_ERROR", 400);
  }

  if (statusParam !== "completed" && statusParam !== "active") {
    return jsonError("status must be completed or active", "VALIDATION_ERROR", 400);
  }

  const user = await getAuthUser();
  const supabase = await createClient();

  try {
    const result = await getSimilarGoals(supabase, {
      title,
      category: categoryParsed.data,
      status: statusParam,
      excludeUserId: user?.id,
      limit: limitParam ? parseInt(limitParam, 10) : undefined,
    });

    return jsonOk(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error";
    return jsonError(message, "DB_ERROR", 500);
  }
}

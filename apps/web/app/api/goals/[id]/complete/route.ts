import { completeGoal } from "@checkmate/server";
import { completeGoalSchema } from "@checkmate/shared";
import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api/response";
import { createClient, getAuthUser } from "@/lib/supabase/server";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const user = await getAuthUser();
  if (!user) return jsonError("Unauthorized", "UNAUTHORIZED", 401);

  const { id } = await params;
  const body = await request.json();
  const parsed = completeGoalSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.message, "VALIDATION_ERROR", 400);
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("timezone")
    .eq("id", user.id)
    .single();

  try {
    const result = await completeGoal(
      supabase,
      user.id,
      id,
      parsed.data,
      (profile?.timezone as string) ?? "UTC"
    );

    if ("error" in result) {
      if (result.error === "NOT_FOUND") {
        return jsonError("Goal not found", "NOT_FOUND", 404);
      }
      return jsonError(result.message, result.error, 400);
    }

    return jsonOk({
      goal: {
        id: result.goal.id,
        title: result.goal.title,
        category: result.goal.category,
        completedAt: result.goal.completed_at,
        completionNote: result.goal.completion_note,
      },
      stats: result.stats,
      startPost: result.startPost,
      endPost: result.endPost,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error";
    return jsonError(message, "DB_ERROR", 500);
  }
}

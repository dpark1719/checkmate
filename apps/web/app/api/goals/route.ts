import { createGoalSchema } from "@checkmate/shared";
import { NextRequest } from "next/server";
import { jsonError, jsonOk, toCamelCase } from "@/lib/api/response";
import {
  assertCanAddGoal,
  countActiveGoals,
  hasDuplicateActiveGoalTitle,
} from "@/lib/goals";
import { createClient, getAuthUser } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return jsonError("Unauthorized", "UNAUTHORIZED", 401);

  const archived = request.nextUrl.searchParams.get("archived") === "true";
  const completed = request.nextUrl.searchParams.get("completed") === "true";
  const supabase = await createClient();

  let query = supabase.from("goals").select("*").eq("user_id", user.id);

  if (completed) {
    query = query
      .not("completed_at", "is", null)
      .is("archived_at", null)
      .order("completed_at", { ascending: false });
  } else if (archived) {
    query = query.not("archived_at", "is", null).order("archived_at", {
      ascending: false,
    });
  } else {
    query = query
      .eq("is_active", true)
      .is("archived_at", null)
      .is("completed_at", null)
      .order("created_at", { ascending: false });
  }

  let { data, error } = await query;

  if (error?.message?.includes("completed_at")) {
    let fallback = supabase.from("goals").select("*").eq("user_id", user.id);
    if (completed) {
      return jsonOk({ goals: [] });
    }
    if (archived) {
      fallback = fallback.not("archived_at", "is", null).order("archived_at", {
        ascending: false,
      });
    } else {
      fallback = fallback
        .eq("is_active", true)
        .is("archived_at", null)
        .order("created_at", { ascending: false });
    }
    ({ data, error } = await fallback);
  }

  if (error) return jsonError(error.message, "DB_ERROR", 500);
  return jsonOk({ goals: (data ?? []).map((g) => toCamelCase(g)) });
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return jsonError("Unauthorized", "UNAUTHORIZED", 401);

  const body = await request.json();
  const parsed = createGoalSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.message, "VALIDATION_ERROR", 400);
  }

  const supabase = await createClient();
  const activeCount = await countActiveGoals(supabase, user.id);
  const gate = assertCanAddGoal(activeCount);
  if (!gate.ok) return jsonError(gate.error, gate.code, 400);

  const { title, category, description, defaultPromiseTime, targetEndDate } =
    parsed.data;

  if (await hasDuplicateActiveGoalTitle(supabase, user.id, title)) {
    return jsonError(
      "You already have an active goal with this title. Edit the existing one or pick a different name.",
      "DUPLICATE_GOAL_TITLE",
      400
    );
  }

  const { data, error } = await supabase
    .from("goals")
    .insert({
      user_id: user.id,
      title,
      category,
      description: description ?? null,
      target_end_date: targetEndDate,
      default_promise_time: defaultPromiseTime ?? "20:00:00",
    })
    .select()
    .single();

  if (error) {
    if (error.message.includes("target_end_date")) {
      return jsonError(
        "Goal completion is not set up yet. Run supabase/migrations/20250605120000_goal_completion.sql in Supabase.",
        "MIGRATION_REQUIRED",
        503
      );
    }
    return jsonError(error.message, "DB_ERROR", 500);
  }

  await supabase.from("streaks").insert({
    user_id: user.id,
    goal_id: data.id,
  });

  return jsonOk({ goal: toCamelCase(data) }, 201);
}

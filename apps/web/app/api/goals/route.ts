import { createGoalSchema } from "@goalpost/shared";
import { NextRequest } from "next/server";
import { jsonError, jsonOk, toCamelCase } from "@/lib/api/response";
import {
  assertCanAddGoal,
  countActiveGoals,
  hasDuplicateActiveGoalTitle,
} from "@/lib/goals";
import { createClient, getAuthUser } from "@/lib/supabase/server";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return jsonError("Unauthorized", "UNAUTHORIZED", 401);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .is("archived_at", null)
    .order("created_at", { ascending: false });

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

  const { title, category, description, defaultPromiseTime } = parsed.data;

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
      default_promise_time: defaultPromiseTime ?? "20:00:00",
    })
    .select()
    .single();

  if (error) return jsonError(error.message, "DB_ERROR", 500);

  await supabase.from("streaks").insert({
    user_id: user.id,
    goal_id: data.id,
  });

  return jsonOk({ goal: toCamelCase(data) }, 201);
}

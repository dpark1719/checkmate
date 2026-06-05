import { pruneOrphanDailyChallenges } from "@checkmate/server";
import { updateGoalSchema } from "@checkmate/shared";
import { NextRequest } from "next/server";
import { jsonError, jsonOk, toCamelCase } from "@/lib/api/response";
import {
  assertCanAddGoal,
  countActiveGoals,
  hasDuplicateActiveGoalTitle,
} from "@/lib/goals";
import { createClient, getAuthUser } from "@/lib/supabase/server";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const user = await getAuthUser();
  if (!user) return jsonError("Unauthorized", "UNAUTHORIZED", 401);

  const { id } = await params;
  const body = await request.json();
  const parsed = updateGoalSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.message, "VALIDATION_ERROR", 400);
  }

  const updates: Record<string, unknown> = {};
  const d = parsed.data;
  if (d.title !== undefined) updates.title = d.title;
  if (d.category !== undefined) updates.category = d.category;
  if (d.description !== undefined) updates.description = d.description;
  if (d.targetEndDate !== undefined) updates.target_end_date = d.targetEndDate;
  if (d.defaultPromiseTime !== undefined) {
    updates.default_promise_time = d.defaultPromiseTime;
  }
  if (d.isActive !== undefined) updates.is_active = d.isActive;
  if (d.isActive === true) updates.archived_at = null;

  const supabase = await createClient();

  if (d.isActive === true) {
    const activeCount = await countActiveGoals(supabase, user.id);
    const gate = assertCanAddGoal(activeCount);
    if (!gate.ok) return jsonError(gate.error, gate.code, 400);

    const titleToCheck = d.title;
    if (titleToCheck !== undefined) {
      const duplicate = await hasDuplicateActiveGoalTitle(
        supabase,
        user.id,
        titleToCheck,
        id
      );
      if (duplicate) {
        return jsonError(
          "You already have an active goal with this title.",
          "DUPLICATE_GOAL_TITLE",
          400
        );
      }
    } else {
      const { data: existing } = await supabase
        .from("goals")
        .select("title")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();
      if (existing?.title) {
        const duplicate = await hasDuplicateActiveGoalTitle(
          supabase,
          user.id,
          existing.title as string,
          id
        );
        if (duplicate) {
          return jsonError(
            "You already have an active goal with this title.",
            "DUPLICATE_GOAL_TITLE",
            400
          );
        }
      }
    }
  }

  if (d.title !== undefined && d.isActive !== true) {
    const duplicate = await hasDuplicateActiveGoalTitle(
      supabase,
      user.id,
      d.title,
      id
    );
    if (duplicate) {
      return jsonError(
        "You already have an active goal with this title.",
        "DUPLICATE_GOAL_TITLE",
        400
      );
    }
  }

  const { data, error } = await supabase
    .from("goals")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return jsonError(error.message, "DB_ERROR", 500);
  return jsonOk({ goal: toCamelCase(data) });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const user = await getAuthUser();
  if (!user) return jsonError("Unauthorized", "UNAUTHORIZED", 401);

  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("goals")
    .update({ is_active: false, archived_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return jsonError(error.message, "DB_ERROR", 500);

  const { data: profile } = await supabase
    .from("profiles")
    .select("timezone")
    .eq("id", user.id)
    .single();

  try {
    await pruneOrphanDailyChallenges(
      user.id,
      (profile?.timezone as string) ?? "UTC"
    );
  } catch {
    // Non-fatal: orphan cleanup also runs when loading the Post tab
  }

  return jsonOk({ goal: toCamelCase(data) });
}

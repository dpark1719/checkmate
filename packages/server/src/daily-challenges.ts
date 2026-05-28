import {
  computeLeewayExpires,
  hardDeadlineTime,
  deterministicTriggerTime,
  todayInTimezone,
} from "@checkmate/shared";
import { notifyUser } from "./push";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getAdminClient } from "./supabase";

interface ActiveGoal {
  id: string;
  default_promise_time: string;
}

export async function ensureDailyChallengesForUser(
  userId: string,
  timezone: string,
  supabase: SupabaseClient = getAdminClient()
): Promise<number> {
  const date = todayInTimezone(timezone);
  const now = new Date();

  const { data: goals, error: goalsError } = await supabase
    .from("goals")
    .select("id, default_promise_time")
    .eq("user_id", userId)
    .eq("is_active", true)
    .is("archived_at", null);

  if (goalsError) throw goalsError;

  await pruneOrphanDailyChallenges(userId, timezone, supabase);

  if (!goals?.length) return 0;

  const { data: existing } = await supabase
    .from("daily_challenges")
    .select("goal_id")
    .eq("user_id", userId)
    .eq("date", date);

  const existingGoalIds = new Set((existing ?? []).map((r) => r.goal_id));
  const toCreate = (goals as ActiveGoal[]).filter((g) => !existingGoalIds.has(g.id));

  if (toCreate.length === 0) return 0; // prune already ran above

  const rows = toCreate.map((goal) => {
    const triggerAt = deterministicTriggerTime(userId, goal.id, timezone, date);
    const shouldFire = now >= triggerAt;
    const [h, m] = goal.default_promise_time.split(":").map(Number);
    const promiseLocal = `${date}T${String(h).padStart(2, "0")}:${String(m ?? 0).padStart(2, "0")}:00`;
    const promiseTime = localPromiseToUtc(promiseLocal, timezone);
    const leeway = computeLeewayExpires(promiseTime);

    return {
      user_id: userId,
      goal_id: goal.id,
      date,
      trigger_fired_at: shouldFire ? now.toISOString() : null,
      promise_time: shouldFire ? promiseTime.toISOString() : null,
      leeway_expires_at: shouldFire ? leeway.toISOString() : null,
    };
  });

  const { error: insertError } = await supabase.from("daily_challenges").insert(rows);
  if (insertError) throw insertError;

  await pruneOrphanDailyChallenges(userId, timezone, supabase);

  return rows.length;
}

/**
 * Drop today's challenges for goals that are archived or inactive.
 * Leaves posted challenges alone (historical record).
 */
export async function pruneOrphanDailyChallenges(
  userId: string,
  timezone: string,
  supabase: SupabaseClient = getAdminClient()
): Promise<number> {
  const date = todayInTimezone(timezone);

  const { data: activeGoals, error: goalsError } = await supabase
    .from("goals")
    .select("id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .is("archived_at", null);

  if (goalsError) throw goalsError;

  const activeIds = new Set((activeGoals ?? []).map((g) => g.id as string));

  const { data: challenges, error: chError } = await supabase
    .from("daily_challenges")
    .select("id, goal_id, posted_at")
    .eq("user_id", userId)
    .eq("date", date);

  if (chError) throw chError;

  const orphanIds = (challenges ?? [])
    .filter(
      (c) =>
        !activeIds.has(c.goal_id as string) && c.posted_at == null
    )
    .map((c) => c.id as string);

  if (orphanIds.length === 0) return 0;

  const { error: delError } = await supabase
    .from("daily_challenges")
    .delete()
    .in("id", orphanIds);

  if (delError) throw delError;
  return orphanIds.length;
}

/** Fire trigger for challenges that are due (sets default promise from goal). */
export async function fireDueTriggers(
  userId: string,
  timezone: string,
  supabase: SupabaseClient = getAdminClient()
): Promise<number> {
  const date = todayInTimezone(timezone);
  const now = new Date();

  const { data: challenges, error } = await supabase
    .from("daily_challenges")
    .select("id, goal_id, trigger_fired_at")
    .eq("user_id", userId)
    .eq("date", date)
    .is("trigger_fired_at", null);

  if (error) throw error;
  if (!challenges?.length) return 0;

  let fired = 0;
  for (const row of challenges) {
    const triggerAt = deterministicTriggerTime(userId, row.goal_id, timezone, date);
    if (now < triggerAt) continue;

    const { data: goal } = await supabase
      .from("goals")
      .select("default_promise_time")
      .eq("id", row.goal_id)
      .single();

    const defaultTime = goal?.default_promise_time ?? "20:00:00";
    const [h, m] = defaultTime.split(":").map(Number);
    const promiseLocal = `${date}T${String(h).padStart(2, "0")}:${String(m ?? 0).padStart(2, "0")}:00`;
    const promiseTime = localPromiseToUtc(promiseLocal, timezone);
    const leeway = computeLeewayExpires(promiseTime);

    await supabase
      .from("daily_challenges")
      .update({
        trigger_fired_at: now.toISOString(),
        promise_time: promiseTime.toISOString(),
        leeway_expires_at: leeway.toISOString(),
      })
      .eq("id", row.id);

    const { data: goalRow } = await supabase
      .from("goals")
      .select("title")
      .eq("id", row.goal_id)
      .single();

    await notifyUser(
      userId,
      "CheckMate — daily trigger",
      `Time to check in on "${goalRow?.title ?? "your goal"}"`,
      { challengeId: row.id, goalId: row.goal_id }
    );

    fired++;
  }

  return fired;
}

/** Apply hard deadline (10pm) leeway for challenges with no promise set. */
export async function applyHardDeadlines(
  userId: string,
  timezone: string,
  supabase: SupabaseClient = getAdminClient()
): Promise<void> {
  const date = todayInTimezone(timezone);
  const now = new Date();
  const deadline = hardDeadlineTime(timezone, date);
  if (now < deadline) return;

  await supabase
    .from("daily_challenges")
    .update({
      leeway_expires_at: deadline.toISOString(),
    })
    .eq("user_id", userId)
    .eq("date", date)
    .is("promise_time", null)
    .is("leeway_expires_at", null);
}

function localPromiseToUtc(localIso: string, timezone: string): Date {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const target = new Date(localIso + "Z");
  for (let i = 0; i < 3; i++) {
    const parts = formatter.formatToParts(target);
    const get = (type: string) =>
      parseInt(parts.find((p) => p.type === type)?.value ?? "0", 10);
    const composed = Date.UTC(
      get("year"),
      get("month") - 1,
      get("day"),
      get("hour"),
      get("minute"),
      get("second")
    );
    const [y, mo, d] = localIso.split("T")[0].split("-").map(Number);
    const [h, mi, s] = localIso.split("T")[1].split(":").map(Number);
    const desired = Date.UTC(y, mo - 1, d, h, mi, s);
    target.setTime(target.getTime() + (desired - composed));
  }
  return target;
}

export async function ensureAllUsersDailyChallenges(): Promise<{ users: number; created: number }> {
  const supabase = getAdminClient();
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, timezone");

  if (error) throw error;

  let created = 0;
  for (const profile of profiles ?? []) {
    const n = await ensureDailyChallengesForUser(profile.id, profile.timezone, supabase);
    created += n;
    await fireDueTriggers(profile.id, profile.timezone, supabase);
    await applyHardDeadlines(profile.id, profile.timezone, supabase);
  }

  return { users: profiles?.length ?? 0, created };
}

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  currentMonthAnchor,
  currentYearAnchor,
  dateInTimezone,
  localDayUtcBounds,
  monthBounds,
  todayInTimezone,
  yearBounds,
} from "@checkmate/shared";

export type ActivityRange = "month" | "year" | "all";

function activityLevel(count: number): number {
  if (count <= 0) return 0;
  return Math.min(count, 5);
}

function resolveRangeBounds(
  timezone: string,
  range: ActivityRange,
  anchor: string | undefined,
  accountFrom: string
): { from: string; to: string; resolvedAnchor: string } {
  const today = todayInTimezone(timezone);

  if (range === "all") {
    return { from: accountFrom, to: today, resolvedAnchor: "all" };
  }

  if (range === "year") {
    const yearAnchor = anchor ?? currentYearAnchor(timezone);
    const bounds = yearBounds(timezone, yearAnchor);
    return { ...bounds, resolvedAnchor: yearAnchor };
  }

  const monthAnchor = anchor ?? currentMonthAnchor(timezone);
  const bounds = monthBounds(timezone, monthAnchor);
  return { ...bounds, resolvedAnchor: monthAnchor };
}

export async function getUserActivity(
  supabase: SupabaseClient,
  userId: string,
  timezone: string,
  options: {
    range?: ActivityRange;
    anchor?: string;
    accountCreatedAt?: string;
  } = {}
) {
  let accountCreatedAt = options.accountCreatedAt;
  if (!accountCreatedAt) {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("created_at")
      .eq("id", userId)
      .single();
    if (profileError) throw profileError;
    accountCreatedAt = profile.created_at as string;
  }

  const accountFrom = dateInTimezone(accountCreatedAt, timezone);
  const range = options.range ?? "month";
  const { from, to, resolvedAnchor } = resolveRangeBounds(
    timezone,
    range,
    options.anchor,
    accountFrom
  );

  const { start } = localDayUtcBounds(from, timezone);
  const { end } = localDayUtcBounds(to, timezone);

  const { data, error } = await supabase
    .from("posts")
    .select("created_at")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .gte("created_at", start)
    .lt("created_at", end);

  if (error) throw error;

  const countByDate = new Map<string, number>();
  for (const row of data ?? []) {
    const date = dateInTimezone(row.created_at as string, timezone);
    if (date < from || date > to) continue;
    countByDate.set(date, (countByDate.get(date) ?? 0) + 1);
  }

  const days: { date: string; count: number; level: number }[] = [];
  let totalPosts = 0;
  let postDays = 0;

  for (const [date, count] of countByDate.entries()) {
    days.push({ date, count, level: activityLevel(count) });
    totalPosts += count;
    postDays += 1;
  }

  days.sort((a, b) => a.date.localeCompare(b.date));

  return {
    timezone,
    range,
    anchor: resolvedAnchor,
    accountFrom,
    from,
    to,
    days,
    totals: {
      postDays,
      totalPosts,
    },
  };
}

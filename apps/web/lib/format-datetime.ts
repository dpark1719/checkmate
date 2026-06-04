export function formatPostDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function formatMessageTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { timeStyle: "short" });
}

/** Local calendar day key (YYYY-MM-DD) for grouping feed posts. */
export function getLocalDayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatFeedDayLabel(dayKey: string): string {
  const now = new Date();
  const todayKey = getLocalDayKey(now);
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = getLocalDayKey(yesterday);

  if (dayKey === todayKey) return "Today";
  if (dayKey === yesterdayKey) return "Yesterday";

  const [y, m, d] = dayKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);

  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 6);
  weekAgo.setHours(0, 0, 0, 0);

  if (date >= weekAgo) {
    return date.toLocaleDateString(undefined, { weekday: "long" });
  }

  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    ...(date.getFullYear() !== now.getFullYear() ? { year: "numeric" as const } : {}),
  });
}

export function groupPostsByDay<T extends { createdAt: string }>(
  posts: T[]
): { dayKey: string; label: string; posts: T[] }[] {
  const groups = new Map<string, T[]>();

  for (const post of posts) {
    const key = getLocalDayKey(new Date(post.createdAt));
    const bucket = groups.get(key) ?? [];
    bucket.push(post);
    groups.set(key, bucket);
  }

  return Array.from(groups.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([dayKey, dayPosts]) => ({
      dayKey,
      label: formatFeedDayLabel(dayKey),
      posts: dayPosts,
    }));
}

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

export function formatFeedDayHeader(dayKey: string): {
  weekday: string;
  date: string;
} {
  const [y, m, d] = dayKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const weekday = date.toLocaleDateString(undefined, { weekday: "long" });
  const month = date.toLocaleDateString(undefined, { month: "long" });
  return {
    weekday,
    date: `${month}/${d}/${y}`,
  };
}

export function groupPostsByDay<T extends { createdAt: string }>(
  posts: T[]
): { dayKey: string; weekday: string; date: string; posts: T[] }[] {
  const groups = new Map<string, T[]>();

  for (const post of posts) {
    const key = getLocalDayKey(new Date(post.createdAt));
    const bucket = groups.get(key) ?? [];
    bucket.push(post);
    groups.set(key, bucket);
  }

  return Array.from(groups.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([dayKey, dayPosts]) => {
      const header = formatFeedDayHeader(dayKey);
      return {
        dayKey,
        weekday: header.weekday,
        date: header.date,
        posts: dayPosts,
      };
    });
}

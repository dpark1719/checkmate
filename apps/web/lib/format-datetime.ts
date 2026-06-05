/** e.g. 1 → "1st", 4 → "4th", 22 → "22nd" */
function ordinalDay(day: number): string {
  const mod100 = day % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${day}th`;
  const suffix = ["th", "st", "nd", "rd"][day % 10] ?? "th";
  return `${day}${suffix}`;
}

/** e.g. "June 4th, 2026" */
export function formatLongDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const month = d.toLocaleDateString("en-US", { month: "long" });
  return `${month} ${ordinalDay(d.getDate())}, ${d.getFullYear()}`;
}

export function formatPostDateTime(iso: string) {
  const d = new Date(iso);
  const time = d.toLocaleTimeString("en-US", { timeStyle: "short" });
  return `${formatLongDate(d)} at ${time}`;
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

export function formatFeedDayHeader(dayKey: string): { label: string } {
  const [y, m, d] = dayKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return { label: formatLongDate(date) };
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
    .map(([dayKey, dayPosts]) => {
      const header = formatFeedDayHeader(dayKey);
      return {
        dayKey,
        label: header.label,
        posts: dayPosts,
      };
    });
}

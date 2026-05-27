/** Count active goal titles (case-insensitive) for duplicate detection in UI. */
export function countGoalTitles(
  titles: string[]
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const raw of titles) {
    const key = raw.trim().toLowerCase();
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

export function isDuplicateGoalTitle(
  title: string,
  counts: Map<string, number>
): boolean {
  const key = title.trim().toLowerCase();
  return Boolean(key && (counts.get(key) ?? 0) > 1);
}

export function formatDefaultPromiseTime(time: string): string {
  const parts = time.split(":");
  if (parts.length < 2) return time;
  const h = parseInt(parts[0], 10);
  const m = parts[1];
  const ampm = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${m} ${ampm}`;
}

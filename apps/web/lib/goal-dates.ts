export function normalizeDateOnly(value: string): string {
  return value.slice(0, 10);
}

export function defaultTargetEndDate(daysFromNow = 90): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + daysFromNow);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatTargetEndDate(value: string): string {
  const normalized = normalizeDateOnly(value);
  return new Date(`${normalized}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function daysUntilTarget(value: string | null): number | null {
  if (!value) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${normalizeDateOnly(value)}T00:00:00`);
  if (Number.isNaN(target.getTime())) return null;
  const diff = target.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function isTargetDateReached(value: string | null): boolean {
  const days = daysUntilTarget(value);
  return days !== null && days <= 0;
}

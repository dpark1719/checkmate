import {
  HARD_DEADLINE_HOUR,
  TRIGGER_WINDOW_END_HOUR,
  TRIGGER_WINDOW_START_HOUR,
} from "./constants";

/** YYYY-MM-DD in the given IANA timezone. */
export function todayInTimezone(timezone: string, now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** Stable trigger time per user/goal/day (5am–10pm local). */
export function deterministicTriggerTime(
  userId: string,
  goalId: string,
  timezone: string,
  date: string
): Date {
  const seed = `${userId}:${goalId}:${date}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const startMinutes = TRIGGER_WINDOW_START_HOUR * 60;
  const range = (TRIGGER_WINDOW_END_HOUR - TRIGGER_WINDOW_START_HOUR) * 60;
  const offsetMinutes = startMinutes + (hash % range);
  const hours = Math.floor(offsetMinutes / 60);
  const minutes = offsetMinutes % 60;
  const localIso = `${date}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`;
  return localTimeToUtc(localIso, timezone);
}

/** Random local time today between 5:00 and 22:00 in `timezone`. */
export function randomTriggerTime(timezone: string, date: string): Date {
  const startMinutes = TRIGGER_WINDOW_START_HOUR * 60;
  const endMinutes = TRIGGER_WINDOW_END_HOUR * 60;
  const offsetMinutes =
    startMinutes + Math.floor(Math.random() * (endMinutes - startMinutes));

  const hours = Math.floor(offsetMinutes / 60);
  const minutes = offsetMinutes % 60;
  const localIso = `${date}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`;

  return localTimeToUtc(localIso, timezone);
}

/** 10pm local on `date` as UTC Date. */
export function hardDeadlineTime(timezone: string, date: string): Date {
  const localIso = `${date}T${String(HARD_DEADLINE_HOUR).padStart(2, "0")}:00:00`;
  return localTimeToUtc(localIso, timezone);
}

function localTimeToUtc(localIso: string, timezone: string): Date {
  const probe = new Date(`${localIso}Z`);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    timeZoneName: "shortOffset",
  }).formatToParts(probe);
  const tzPart = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT";
  const match = tzPart.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  if (!match) return probe;

  const sign = match[1] === "+" ? 1 : -1;
  const offsetHours = parseInt(match[2], 10);
  const offsetMins = parseInt(match[3] ?? "0", 10);
  const offsetMs = sign * (offsetHours * 60 + offsetMins) * 60 * 1000;

  const asUtc = new Date(`${localIso}Z`);
  return new Date(asUtc.getTime() - offsetMs);
}

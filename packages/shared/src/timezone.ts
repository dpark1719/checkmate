import {
  HARD_DEADLINE_HOUR,
  TRIGGER_WINDOW_END_HOUR,
  TRIGGER_WINDOW_START_HOUR,
} from "./constants";

/** YYYY-MM-DD in the given IANA timezone. */
export function todayInTimezone(timezone: string, now = new Date()): string {
  return dateInTimezone(now.toISOString(), timezone);
}

/** Format a UTC ISO timestamp as local YYYY-MM-DD in `timezone`. */
export function dateInTimezone(iso: string, timezone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

/** UTC ISO bounds for a local calendar day (inclusive start, exclusive end). */
export function localDayUtcBounds(
  date: string,
  timezone: string
): { start: string; end: string } {
  const start = localTimeToUtc(`${date}T00:00:00`, timezone);
  const nextDate = addDaysToDateString(date, 1);
  const end = localTimeToUtc(`${nextDate}T00:00:00`, timezone);
  return { start: start.toISOString(), end: end.toISOString() };
}

function addDaysToDateString(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d + days));
  return utc.toISOString().slice(0, 10);
}

function lastDayOfMonth(year: number, month: number): string {
  const utc = new Date(Date.UTC(year, month, 0));
  return utc.toISOString().slice(0, 10);
}

function minDate(a: string, b: string): string {
  return a <= b ? a : b;
}

/** Current month as YYYY-MM in the given timezone. */
export function currentMonthAnchor(timezone: string, now = new Date()): string {
  return todayInTimezone(timezone, now).slice(0, 7);
}

/** Current year as YYYY in the given timezone. */
export function currentYearAnchor(timezone: string, now = new Date()): string {
  return todayInTimezone(timezone, now).slice(0, 4);
}

/** Shift a YYYY-MM anchor by delta months. */
export function shiftMonth(anchor: string, delta: number): string {
  const [y, m] = anchor.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/** Shift a YYYY anchor by delta years. */
export function shiftYear(anchor: string, delta: number): string {
  return String(parseInt(anchor, 10) + delta);
}

/** Local date bounds for a calendar month; `to` capped at today when viewing current month. */
export function monthBounds(
  timezone: string,
  anchor: string,
  now = new Date()
): { from: string; to: string } {
  const [year, month] = anchor.split("-").map(Number);
  const from = `${anchor}-01`;
  const monthEnd = lastDayOfMonth(year, month);
  const today = todayInTimezone(timezone, now);
  const currentAnchor = today.slice(0, 7);
  const to = anchor === currentAnchor ? minDate(monthEnd, today) : monthEnd;
  return { from, to };
}

/** Local date bounds for a calendar year; `to` capped at today when viewing current year. */
export function yearBounds(
  timezone: string,
  anchor: string,
  now = new Date()
): { from: string; to: string } {
  const from = `${anchor}-01-01`;
  const yearEnd = `${anchor}-12-31`;
  const today = todayInTimezone(timezone, now);
  const to = anchor === currentYearAnchor(timezone, now)
    ? minDate(yearEnd, today)
    : yearEnd;
  return { from, to };
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

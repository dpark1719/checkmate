import { LEEWAY_HOURS, PROMISE_SET_WINDOW_HOURS } from "./constants";

export function canSetPromiseTime(
  triggerFiredAt: string | null,
  now = new Date()
): boolean {
  if (!triggerFiredAt) return true;
  const trigger = new Date(triggerFiredAt);
  const windowEnd = new Date(
    trigger.getTime() + PROMISE_SET_WINDOW_HOURS * 60 * 60 * 1000
  );
  return now <= windowEnd;
}

export function computeLeewayExpires(promiseTime: Date): Date {
  return new Date(promiseTime.getTime() + LEEWAY_HOURS * 60 * 60 * 1000);
}

export function isPostOnTime(
  postedAt: Date,
  leewayExpiresAt: Date | null
): boolean {
  if (!leewayExpiresAt) return false;
  return postedAt <= leewayExpiresAt;
}

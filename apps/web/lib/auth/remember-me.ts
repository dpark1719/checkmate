import type { CookieOptions } from "@supabase/ssr";

export const REMEMBER_ME_COOKIE = "checkmate-remember-me";

/** 30 days — stay logged in on this device */
export const REMEMBER_ME_MAX_AGE = 60 * 60 * 24 * 30;

/** 1 day — browser-session-style when unchecked */
export const SESSION_MAX_AGE = 60 * 60 * 24;

export function isRememberMeEnabled(cookieValue: string | undefined): boolean {
  return cookieValue !== "0";
}

export function authCookieMaxAge(remember: boolean): number {
  return remember ? REMEMBER_ME_MAX_AGE : SESSION_MAX_AGE;
}

export function withAuthCookieMaxAge(
  options: CookieOptions,
  remember: boolean
): CookieOptions {
  return {
    ...options,
    maxAge: authCookieMaxAge(remember),
    sameSite: options.sameSite ?? "lax",
  };
}

/** Set before OAuth redirect so callback/middleware apply the right cookie lifetime. */
export function setRememberMeClientCookie(remember: boolean): void {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:";
  const maxAge = authCookieMaxAge(remember);
  const value = remember ? "1" : "0";
  let cookie = `${REMEMBER_ME_COOKIE}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`;
  if (secure) cookie += "; Secure";
  document.cookie = cookie;
}

export function readRememberMeFromClient(): boolean {
  if (typeof document === "undefined") return true;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${REMEMBER_ME_COOKIE}=`));
  if (!match) return true;
  return isRememberMeEnabled(match.split("=")[1]);
}

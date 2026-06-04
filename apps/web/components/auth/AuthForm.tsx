"use client";

import {
  readRememberMeFromClient,
  setRememberMeClientCookie,
} from "@/lib/auth/remember-me";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

type Mode = "login" | "signup";

export function AuthForm({ mode }: { mode: Mode }) {
  const [message, setMessage] = useState<string | null>(null);
  const [messageIsError, setMessageIsError] = useState(false);
  const [stayLoggedIn, setStayLoggedIn] = useState(true);

  useEffect(() => {
    setStayLoggedIn(readRememberMeFromClient());
  }, []);

  // Prefer live browser origin on deployed site so OAuth isn't sent to localhost
  // if NEXT_PUBLIC_APP_URL wasn't updated in Vercel yet.
  const envBase = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  const appBase =
    typeof window !== "undefined"
      ? envBase && !envBase.includes("localhost")
        ? envBase
        : window.location.origin
      : envBase ?? "";
  // Base path only — Supabase allow-list must include this URL (or https://yoursite.com/**)
  const redirectTo = `${appBase}/auth/callback?next=/onboarding`;

  function applyRememberMePreference() {
    setRememberMeClientCookie(stayLoggedIn);
  }

  async function signInWithGoogle() {
    setMessage(null);
    setMessageIsError(false);
    applyRememberMePreference();
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        queryParams: { prompt: "select_account" },
      },
    });
    if (error) {
      setMessage(error.message);
      setMessageIsError(true);
    }
  }

  return (
    <div className="w-full max-w-md space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="gp-text-muted mt-1">
          {mode === "login"
            ? "Sign in to continue your streak."
            : "Start documenting your goals today."}
        </p>
      </div>

      <label className="flex items-center gap-2 text-sm gp-text-muted cursor-pointer select-none">
        <input
          type="checkbox"
          checked={stayLoggedIn}
          onChange={(e) => {
            const next = e.target.checked;
            setStayLoggedIn(next);
            setRememberMeClientCookie(next);
          }}
          className="rounded border-[var(--gp-border)] accent-[var(--accent)]"
        />
        Stay logged in on this device
      </label>

      <div className="space-y-2">
        <button
          type="button"
          onClick={signInWithGoogle}
          className="w-full rounded-lg border border-[var(--gp-border)] py-3 hover:bg-[var(--gp-card)]"
        >
          Continue with Google
        </button>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[var(--gp-border)]" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-[var(--background)] px-2 gp-text-muted">or</span>
        </div>
      </div>

      <fieldset
        disabled
        className="space-y-4 opacity-60 cursor-not-allowed"
        aria-label="Email sign-in (coming soon)"
      >
        <div className="flex items-center justify-between gap-2">
          <label className="text-sm gp-text-muted line-through">Email</label>
          <span className="text-[10px] font-medium uppercase tracking-wide text-[var(--gp-subtle)] border border-[var(--gp-border)] rounded-full px-2 py-0.5 shrink-0">
            Coming soon
          </span>
        </div>
        <input
          type="email"
          readOnly
          tabIndex={-1}
          className="w-full gp-input pointer-events-none"
          placeholder="you@example.com"
        />
        <button
          type="button"
          disabled
          className="w-full rounded-lg bg-accent text-accent-foreground font-semibold py-3 line-through disabled:opacity-50"
        >
          Continue with email
        </button>
      </fieldset>

      <fieldset
        disabled
        className="space-y-3 pt-2 border-t border-[var(--gp-border)] opacity-60 cursor-not-allowed"
        aria-label="Phone sign-in (coming soon)"
      >
        <div className="flex items-center justify-between gap-2">
          <label className="text-sm gp-text-muted line-through">Phone (SMS)</label>
          <span className="text-[10px] font-medium uppercase tracking-wide text-[var(--gp-subtle)] border border-[var(--gp-border)] rounded-full px-2 py-0.5 shrink-0">
            Coming soon
          </span>
        </div>
        <input
          type="tel"
          readOnly
          tabIndex={-1}
          placeholder="+15551234567"
          className="w-full rounded-lg bg-[var(--gp-card)] border border-[var(--gp-border)] px-4 py-3 pointer-events-none"
        />
        <button
          type="button"
          disabled
          className="w-full rounded-lg border border-[var(--gp-border)] py-2.5 text-sm line-through disabled:opacity-50"
        >
          Send SMS code
        </button>
      </fieldset>

      {message && (
        <p
          className={`text-sm text-center ${
            messageIsError ? "text-amber-400" : "text-accent"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}

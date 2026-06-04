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
            ? "Good to see you showing up for yourself twin"
            : "Start showing up for yourself today"}
        </p>
      </div>

      <div className="space-y-3">
        <button
          type="button"
          onClick={signInWithGoogle}
          className="w-full rounded-lg border border-[var(--gp-border)] py-3 hover:bg-[var(--gp-card)]"
        >
          Continue with Google
        </button>
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
      </div>

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

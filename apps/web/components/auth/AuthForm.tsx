"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

type Mode = "login" | "signup";

const RESEND_COOLDOWN_SEC = 60;

function formatAuthError(message: string): { text: string; isRateLimit: boolean } {
  const lower = message.toLowerCase();
  if (
    lower.includes("rate") ||
    lower.includes("over_email_send_rate_limit") ||
    lower.includes("429")
  ) {
    return {
      isRateLimit: true,
      text: "Too many sign-in emails sent. Check your inbox for an earlier link, wait about an hour, or use Google sign-in below.",
    };
  }
  return { text: message, isRateLimit: false };
}

export function AuthForm({ mode }: { mode: Mode }) {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [phoneStep, setPhoneStep] = useState<"idle" | "sent">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [messageIsError, setMessageIsError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cooldownSec, setCooldownSec] = useState(0);

  useEffect(() => {
    if (cooldownSec <= 0) return;
    const timer = setInterval(() => {
      setCooldownSec((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownSec]);

  const appBase =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    (typeof window !== "undefined" ? window.location.origin : "");
  const redirectTo = `${appBase}/auth/callback?next=/onboarding`;

  async function sendMagicLink(event: React.FormEvent) {
    event.preventDefault();
    if (cooldownSec > 0) return;

    setLoading(true);
    setMessage(null);
    setMessageIsError(false);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });

    setLoading(false);
    if (error) {
      const formatted = formatAuthError(error.message);
      setMessage(formatted.text);
      setMessageIsError(true);
      if (formatted.isRateLimit) setCooldownSec(RESEND_COOLDOWN_SEC);
      return;
    }
    setMessage("Check your email for the magic link. Links expire after a few minutes.");
    setMessageIsError(false);
    setCooldownSec(RESEND_COOLDOWN_SEC);
  }

  async function signInWithGoogle() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
  }

  async function signInWithApple() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "apple",
      options: { redirectTo },
    });
  }

  async function sendPhoneOtp(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const res = await fetch("/api/auth/phone", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setMessage(data.error ?? "Failed to send code");
      return;
    }
    setPhoneStep("sent");
    setMessage("Enter the code we sent to your phone.");
  }

  async function verifyPhoneOtp(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);

    const res = await fetch("/api/auth/phone", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, token: otp }),
    });
    setLoading(false);

    if (res.ok) {
      window.location.href = "/onboarding";
      return;
    }
    const data = await res.json();
    setMessage(data.error ?? "Invalid code");
  }

  return (
    <div className="w-full max-w-md space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="text-zinc-400 mt-1">
          {mode === "login"
            ? "Sign in to continue your streak."
            : "Start documenting your goals today."}
        </p>
      </div>

      <form onSubmit={sendMagicLink} className="space-y-4">
        <label className="block text-sm text-zinc-400">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          placeholder="you@example.com"
        />
        <button
          type="submit"
          disabled={loading || cooldownSec > 0}
          className="w-full rounded-lg bg-emerald-500 text-zinc-950 font-semibold py-3 hover:bg-emerald-400 disabled:opacity-50"
        >
          {loading
            ? "Sending…"
            : cooldownSec > 0
              ? `Wait ${cooldownSec}s to resend`
              : "Continue with email"}
        </button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-zinc-800" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-zinc-950 px-2 text-zinc-500">or</span>
        </div>
      </div>

      <div className="space-y-2">
        <button
          type="button"
          onClick={signInWithGoogle}
          className="w-full rounded-lg border border-zinc-700 py-3 hover:bg-zinc-900"
        >
          Continue with Google
        </button>
        <button
          type="button"
          onClick={signInWithApple}
          className="w-full rounded-lg border border-zinc-700 py-3 hover:bg-zinc-900"
        >
          Continue with Apple
        </button>
      </div>

      <form
        onSubmit={phoneStep === "sent" ? verifyPhoneOtp : sendPhoneOtp}
        className="space-y-3 pt-2 border-t border-zinc-800"
      >
        <label className="block text-sm text-zinc-400">Phone (SMS)</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+15551234567"
          className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-4 py-3"
        />
        {phoneStep === "sent" && (
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="6-digit code"
            className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-4 py-3"
          />
        )}
        <button
          type="submit"
          disabled={loading || !phone}
          className="w-full rounded-lg border border-zinc-600 py-2.5 text-sm hover:bg-zinc-900 disabled:opacity-50"
        >
          {phoneStep === "sent" ? "Verify code" : "Send SMS code"}
        </button>
      </form>

      {message && (
        <p
          className={`text-sm text-center ${
            messageIsError ? "text-amber-400" : "text-emerald-400"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}

"use client";

import { LocalDevAuthHint } from "@/components/auth/LocalDevAuthHint";
import { getOAuthCallbackUrl } from "@/lib/auth/oauth-redirect";
import {
  readRememberMeFromClient,
  setRememberMeClientCookie,
} from "@/lib/auth/remember-me";
import { createClient } from "@/lib/supabase/client";
import { normalizePhoneInput } from "@checkmate/shared";
import { useEffect, useState } from "react";

type Mode = "login" | "signup";
type PhoneStep = "phone" | "otp";

function GoogleIcon() {
  return (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export function AuthForm({
  mode,
  authError,
}: {
  mode: Mode;
  authError?: React.ReactNode;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [messageIsError, setMessageIsError] = useState(false);
  const [stayLoggedIn, setStayLoggedIn] = useState(true);
  const [phoneStep, setPhoneStep] = useState<PhoneStep>("phone");
  const [phoneInput, setPhoneInput] = useState("");
  const [normalizedPhone, setNormalizedPhone] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [phoneLoading, setPhoneLoading] = useState(false);

  useEffect(() => {
    setStayLoggedIn(readRememberMeFromClient());
  }, []);

  function applyRememberMePreference() {
    setRememberMeClientCookie(stayLoggedIn);
  }

  function showMessage(text: string, isError: boolean) {
    setMessage(text);
    setMessageIsError(isError);
  }

  async function signInWithGoogle() {
    setMessage(null);
    setMessageIsError(false);
    applyRememberMePreference();
    const redirectTo = getOAuthCallbackUrl(window.location.origin);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        queryParams: { prompt: "select_account" },
      },
    });
    if (error) {
      showMessage(error.message, true);
    }
  }

  async function sendPhoneCode(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);
    setMessageIsError(false);

    const phone = normalizePhoneInput(phoneInput);
    if (!phone) {
      showMessage("Enter a valid phone number (e.g. +1 555 123 4567).", true);
      return;
    }

    setPhoneLoading(true);
    applyRememberMePreference();
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({ phone });
    setPhoneLoading(false);

    if (error) {
      showMessage(error.message, true);
      return;
    }

    setNormalizedPhone(phone);
    setPhoneStep("otp");
    showMessage("Code sent. Check your texts.", false);
  }

  async function verifyPhoneCode(event: React.FormEvent) {
    event.preventDefault();
    if (!normalizedPhone) return;

    setMessage(null);
    setMessageIsError(false);
    setPhoneLoading(true);
    applyRememberMePreference();

    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      phone: normalizedPhone,
      token: otpCode.trim(),
      type: "sms",
    });
    setPhoneLoading(false);

    if (error) {
      showMessage(error.message, true);
      return;
    }

    window.location.href = "/feed";
  }

  function resetPhoneFlow() {
    setPhoneStep("phone");
    setOtpCode("");
    setNormalizedPhone(null);
    setMessage(null);
    setMessageIsError(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="gp-text-muted mt-2 text-sm leading-relaxed">
          {mode === "login"
            ? "Good to see you showing up for yourself twin"
            : "Start showing up for yourself today"}
        </p>
      </div>

      {authError && (
        <div
          role="alert"
          className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
        >
          {authError}
        </div>
      )}

      <LocalDevAuthHint />

      <div className="space-y-4">
        <button
          type="button"
          onClick={signInWithGoogle}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-[var(--gp-border)] bg-[var(--gp-surface)] py-3 font-medium transition-colors hover:bg-[var(--gp-card)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--gp-card)]"
        >
          <GoogleIcon />
          Continue with Google
        </button>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-[var(--gp-border)]" />
          <span className="text-xs gp-text-muted">or</span>
          <div className="h-px flex-1 bg-[var(--gp-border)]" />
        </div>

        {phoneStep === "phone" ? (
          <form onSubmit={sendPhoneCode} className="space-y-3">
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-[var(--gp-fg)]"
              >
                Phone number
              </label>
              <input
                id="phone"
                type="tel"
                autoComplete="tel"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder="+1 555 123 4567"
                className="gp-input w-full mt-1"
              />
              <p className="text-xs gp-text-muted mt-1">
                US numbers can be 10 digits. We&apos;ll text you a login code and
                daily check-in reminders.
              </p>
            </div>
            <button
              type="submit"
              disabled={phoneLoading}
              className="w-full rounded-xl bg-accent text-accent-foreground py-3 font-semibold disabled:opacity-50"
            >
              {phoneLoading ? "Sending…" : "Send code"}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyPhoneCode} className="space-y-3">
            <p className="text-sm gp-text-muted">
              Code sent to{" "}
              <span className="text-[var(--gp-fg)]">{normalizedPhone}</span>
            </p>
            <div>
              <label
                htmlFor="otp"
                className="block text-sm font-medium text-[var(--gp-fg)]"
              >
                Verification code
              </label>
              <input
                id="otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                maxLength={6}
                placeholder="123456"
                className="gp-input w-full mt-1 tracking-widest"
              />
            </div>
            <button
              type="submit"
              disabled={phoneLoading || otpCode.length < 4}
              className="w-full rounded-xl bg-accent text-accent-foreground py-3 font-semibold disabled:opacity-50"
            >
              {phoneLoading ? "Verifying…" : "Verify & continue"}
            </button>
            <button
              type="button"
              onClick={resetPhoneFlow}
              className="gp-btn-text gp-btn-text-xs w-full"
            >
              Use a different number
            </button>
          </form>
        )}

        <label className="flex items-center gap-2.5 text-sm gp-text-muted cursor-pointer select-none">
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
          role="alert"
          className={`rounded-xl px-4 py-3 text-sm text-center ${
            messageIsError
              ? "border border-amber-500/30 bg-amber-500/10 text-amber-400"
              : "border border-accent/30 bg-[var(--gp-accent-subtle)] text-accent"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}

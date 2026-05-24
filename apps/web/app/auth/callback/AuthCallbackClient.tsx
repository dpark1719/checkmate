"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

function safeNextPath(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/onboarding";
  }
  return next;
}

export function AuthCallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const started = useRef(false);
  const [status, setStatus] = useState("Completing sign in…");
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const next = safeNextPath(searchParams.get("next"));
    const oauthError = searchParams.get("error");
    const oauthDescription = searchParams.get("error_description");

    if (oauthError) {
      const msg = oauthDescription ?? oauthError;
      setErrorDetail(msg);
      setStatus("Sign-in failed");
      router.replace(`/login?error=auth&reason=${encodeURIComponent(msg)}`);
      return;
    }

    const code = searchParams.get("code");
    const tokenHash = searchParams.get("token_hash");
    const type = searchParams.get("type");

    async function finish() {
      let supabase: ReturnType<typeof createClient>;
      try {
        supabase = createClient();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "missing_supabase_env";
        setErrorDetail(msg);
        setStatus("Configuration error");
        router.replace(`/login?error=auth&reason=${encodeURIComponent(msg)}`);
        return;
      }

      try {
        if (code) {
          setStatus("Verifying with Google…");
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            setErrorDetail(error.message);
            setStatus("Sign-in failed");
            router.replace(
              `/login?error=auth&reason=${encodeURIComponent(error.message)}`
            );
            return;
          }
          setStatus("Success — redirecting…");
          router.replace(next);
          router.refresh();
          return;
        }

        if (tokenHash && type) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as "email" | "signup" | "magiclink" | "recovery" | "invite",
          });
          if (error) {
            setErrorDetail(error.message);
            setStatus("Sign-in failed");
            router.replace(
              `/login?error=auth&reason=${encodeURIComponent(error.message)}`
            );
            return;
          }
          router.replace(next);
          router.refresh();
          return;
        }

        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
        if (session && !error) {
          router.replace(next);
          router.refresh();
          return;
        }

        const msg = error?.message ?? "missing_code";
        setErrorDetail(msg);
        setStatus("Sign-in failed");
        router.replace(`/login?error=auth&reason=${encodeURIComponent(msg)}`);
      } catch (err) {
        const message = err instanceof Error ? err.message : "callback_failed";
        setErrorDetail(message);
        setStatus("Sign-in failed");
        router.replace(`/login?error=auth&reason=${encodeURIComponent(message)}`);
      }
    }

    void finish();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-6 max-w-md text-center">
      <p className="text-zinc-300">{status}</p>
      {errorDetail && (
        <p className="text-sm text-red-400 break-words">{errorDetail}</p>
      )}
      <p className="text-xs text-zinc-500">
        Check{" "}
        <a href="/api/auth/health" className="text-emerald-400 underline">
          /api/auth/health
        </a>{" "}
        on this site — all flags should be true. After changing Vercel env vars,
        redeploy.
      </p>
    </div>
  );
}

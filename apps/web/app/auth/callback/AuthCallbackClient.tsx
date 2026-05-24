"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

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

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const next = safeNextPath(searchParams.get("next"));
    const oauthError = searchParams.get("error");
    const oauthDescription = searchParams.get("error_description");

    if (oauthError) {
      const reason = encodeURIComponent(oauthDescription ?? oauthError);
      router.replace(`/login?error=auth&reason=${reason}`);
      return;
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
      router.replace("/login?error=auth&reason=missing_supabase_env");
      return;
    }

    const supabase = createClient();
    const code = searchParams.get("code");
    const tokenHash = searchParams.get("token_hash");
    const type = searchParams.get("type");

    async function finish() {
      try {
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            router.replace(
              `/login?error=auth&reason=${encodeURIComponent(error.message)}`
            );
            return;
          }
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

        router.replace(
          `/login?error=auth&reason=${encodeURIComponent(error?.message ?? "missing_code")}`
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : "callback_failed";
        router.replace(`/login?error=auth&reason=${encodeURIComponent(message)}`);
      }
    }

    void finish();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-2 px-6">
      <p className="text-zinc-300">Completing sign in…</p>
      <p className="text-sm text-zinc-500">You can close this tab if nothing happens.</p>
    </div>
  );
}

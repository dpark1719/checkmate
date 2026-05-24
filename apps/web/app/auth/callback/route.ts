import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function safeNextPath(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/onboarding";
  }
  return next;
}

function loginErrorRedirect(origin: string, reason?: string) {
  const errorUrl = new URL("/login", origin);
  errorUrl.searchParams.set("error", "auth");
  if (reason) errorUrl.searchParams.set("reason", reason.slice(0, 200));
  return NextResponse.redirect(errorUrl);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const origin = request.nextUrl.origin;
  const next = safeNextPath(searchParams.get("next"));

  const oauthError = searchParams.get("error");
  const oauthDescription = searchParams.get("error_description");
  if (oauthError) {
    return loginErrorRedirect(
      origin,
      oauthDescription ?? oauthError
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return loginErrorRedirect(origin, "missing_supabase_env");
  }

  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  let response = NextResponse.redirect(new URL(next, origin));

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        response = NextResponse.redirect(new URL(next, origin));
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  try {
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) return response;
      return loginErrorRedirect(origin, error.message);
    }

    if (tokenHash && type) {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: type as "email" | "signup" | "magiclink" | "recovery" | "invite",
      });
      if (!error) return response;
      return loginErrorRedirect(origin, error.message);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "callback_failed";
    return loginErrorRedirect(origin, message);
  }

  return loginErrorRedirect(origin, "missing_code");
}

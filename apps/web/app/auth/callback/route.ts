import { resolvePostAuthRedirect } from "@/lib/auth/post-auth-redirect";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

async function redirectAfterAuth(
  origin: string,
  supabase: Awaited<ReturnType<typeof createClient>>,
  requestedNext: string | null
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(
      `${origin}/login?error=auth&reason=${encodeURIComponent("no_session")}`
    );
  }
  const path = await resolvePostAuthRedirect(supabase, user.id, requestedNext);
  return NextResponse.redirect(`${origin}${path}`);
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const requestedNext = searchParams.get("next");

  const oauthError = searchParams.get("error");
  const oauthDescription = searchParams.get("error_description");
  if (oauthError) {
    const msg = oauthDescription ?? oauthError;
    return NextResponse.redirect(
      `${origin}/login?error=auth&reason=${encodeURIComponent(msg)}`
    );
  }

  const supabase = await createClient();

  const code = searchParams.get("code");
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return redirectAfterAuth(origin, supabase, requestedNext);
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      return redirectAfterAuth(origin, supabase, requestedNext);
    }

    return NextResponse.redirect(
      `${origin}/login?error=auth&reason=${encodeURIComponent(error.message)}`
    );
  }

  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as "email" | "signup" | "magiclink" | "recovery" | "invite",
    });
    if (!error) {
      return redirectAfterAuth(origin, supabase, requestedNext);
    }
    return NextResponse.redirect(
      `${origin}/login?error=auth&reason=${encodeURIComponent(error.message)}`
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    return redirectAfterAuth(origin, supabase, requestedNext);
  }

  return NextResponse.redirect(
    `${origin}/login?error=auth&reason=${encodeURIComponent("missing_code")}`
  );
}

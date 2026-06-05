import { resolvePostAuthRedirect } from "@/lib/auth/post-auth-redirect";
import {
  isRememberMeEnabled,
  REMEMBER_ME_COOKIE,
  withAuthCookieMaxAge,
} from "@/lib/auth/remember-me";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type SessionCookie = {
  name: string;
  value: string;
  options: CookieOptions;
};

function createCallbackClient(
  request: NextRequest,
  sessionCookies: SessionCookie[]
) {
  const remember = isRememberMeEnabled(
    request.cookies.get(REMEMBER_ME_COOKIE)?.value
  );

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options: CookieOptions;
          }[]
        ) {
          sessionCookies.length = 0;
          cookiesToSet.forEach(({ name, value, options }) => {
            const cookieOptions = withAuthCookieMaxAge(options, remember);
            sessionCookies.push({ name, value, options: cookieOptions });
          });
        },
      },
    }
  );
}

function redirectWithSessionCookies(
  origin: string,
  path: string,
  sessionCookies: SessionCookie[]
) {
  const redirect = NextResponse.redirect(`${origin}${path}`);
  sessionCookies.forEach(({ name, value, options }) => {
    redirect.cookies.set(name, value, options);
  });
  return redirect;
}

async function redirectAfterAuth(
  origin: string,
  supabase: ReturnType<typeof createCallbackClient>,
  requestedNext: string | null,
  sessionCookies: SessionCookie[]
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return redirectWithSessionCookies(
      origin,
      `/login?error=auth&reason=${encodeURIComponent("no_session")}`,
      sessionCookies
    );
  }
  const path = await resolvePostAuthRedirect(supabase, user.id, requestedNext);
  return redirectWithSessionCookies(origin, path, sessionCookies);
}

export async function GET(request: NextRequest) {
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

  const sessionCookies: SessionCookie[] = [];
  const supabase = createCallbackClient(request, sessionCookies);

  const code = searchParams.get("code");
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return redirectAfterAuth(
        origin,
        supabase,
        requestedNext,
        sessionCookies
      );
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      return redirectAfterAuth(
        origin,
        supabase,
        requestedNext,
        sessionCookies
      );
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
      return redirectAfterAuth(
        origin,
        supabase,
        requestedNext,
        sessionCookies
      );
    }
    return NextResponse.redirect(
      `${origin}/login?error=auth&reason=${encodeURIComponent(error.message)}`
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    return redirectAfterAuth(origin, supabase, requestedNext, sessionCookies);
  }

  return NextResponse.redirect(
    `${origin}/login?error=auth&reason=${encodeURIComponent("missing_code")}`
  );
}

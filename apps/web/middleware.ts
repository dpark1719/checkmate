import {
  isRememberMeEnabled,
  REMEMBER_ME_COOKIE,
  withAuthCookieMaxAge,
} from "@/lib/auth/remember-me";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const publicPaths = ["/", "/login", "/signup", "/auth/callback"];

function isPublicProfile(path: string) {
  return path.startsWith("/u/");
}

function isPublicApi(path: string) {
  return (
    path.startsWith("/api/inngest") ||
    (path.startsWith("/api/communities/") && path.endsWith("/feed")) ||
    path === "/api/conversations/health"
  );
}

function redirectWithCookies(
  request: NextRequest,
  pathname: string,
  response: NextResponse
) {
  const redirect = NextResponse.redirect(new URL(pathname, request.url));
  response.cookies.getAll().forEach((cookie) => {
    redirect.cookies.set(cookie);
  });
  return redirect;
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isPublic =
    publicPaths.some((p) => path === p) ||
    isPublicApi(path) ||
    isPublicProfile(path);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    if (!isPublic && !path.startsWith("/api/")) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  const remember = isRememberMeEnabled(
    request.cookies.get(REMEMBER_ME_COOKIE)?.value
  );

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            response = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(
                name,
                value,
                withAuthCookieMaxAge(options, remember)
              )
            );
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user && !isPublic && !path.startsWith("/api/")) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", path);
      const redirect = NextResponse.redirect(url);
      response.cookies.getAll().forEach((cookie) => {
        redirect.cookies.set(cookie);
      });
      return redirect;
    }

    if (user && (path === "/" || path === "/login" || path === "/signup")) {
      return redirectWithCookies(request, "/feed", response);
    }
  } catch {
    if (!isPublic && !path.startsWith("/api/")) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

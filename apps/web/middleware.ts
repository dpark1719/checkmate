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
      return NextResponse.redirect(url);
    }

    if (user && (path === "/login" || path === "/signup")) {
      return NextResponse.redirect(new URL("/feed", request.url));
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

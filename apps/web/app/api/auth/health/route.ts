import { NextResponse } from "next/server";

/** Public check that production env vars are set (no secrets returned). */
export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? null;
  return NextResponse.json({
    ok: Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ),
    hasSupabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    hasAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    hasServiceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    appUrl,
    appUrlLooksLocal: appUrl?.includes("localhost") ?? false,
    hint: appUrl?.includes("localhost")
      ? "Set NEXT_PUBLIC_APP_URL to your Vercel URL and redeploy."
      : undefined,
  });
}
